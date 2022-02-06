import produce from 'immer';
import { BaseStore } from './BaseStore';

type BaseState = {
    [prop: string]: any;
};

type BaseAppEvents = {
    [eventName: string]: (...args: any) => void;
};

export type Transitions<State extends BaseState, AppEvents extends BaseAppEvents> = {
    [eventName in keyof AppEvents]: (...payload: Parameters<AppEvents[eventName]>) => (state: State) => void;
};

type EventHandlers<AppEvents extends BaseAppEvents> = {
    [eventName in keyof AppEvents]: (...payload: Parameters<AppEvents[eventName]>) => void;
};

type SideEffect<Args extends Array<any>, ReturnType, AppEvents> = {
    name: string;
    execute: (...payload: Args) => Promise<ReturnType>;
    args: Args;
    successEvent: AppEvents[keyof AppEvents];
    failureEvent: AppEvents[keyof AppEvents];
};

export function createSideEffect<Args extends Array<any>, ReturnType, AppEvents>(
    name: string,
    execute: (...payload: Args) => Promise<ReturnType>,
    successEvent: AppEvents[keyof AppEvents],
    failureEvent: AppEvents[keyof AppEvents],
) {
    return (...args: Args) => ({
        name,
        execute,
        args,
        successEvent,
        failureEvent,
    });
}

type SideEffectList<AppEvents extends BaseAppEvents> = Array<SideEffect<any, any, AppEvents>>;

export class StateStore<State extends BaseState, AppEvents extends BaseAppEvents> extends BaseStore<State> {
    private readonly copyOfTransitions: Transitions<State, AppEvents>;
    private readonly eventHandlers: EventHandlers<AppEvents>;
    private readonly scheduledSideEffects: SideEffectList<AppEvents>;

    constructor(initialState: State, transitions: Transitions<State, AppEvents>) {
        super(initialState);
        this.copyOfTransitions = transitions;
        this.eventHandlers = this.getEventHandlers(transitions);
        this.scheduledSideEffects = [];
    }

    private getEventHandlers(transitions: Transitions<State, AppEvents>): EventHandlers<AppEvents> {
        const tmp = {} as EventHandlers<AppEvents>;
        for (const eventName of Object.keys(transitions)) {
            const typedEventName = eventName as keyof AppEvents;
            const eventHandler = transitions[typedEventName];
            tmp[typedEventName] = ((...payload: Parameters<typeof eventHandler>) => {
                const sideEffectList: SideEffectList<AppEvents> = [];
                this.value = produce(this.value, draftState => {
                    const updaterForGivenPayload = eventHandler(...(payload as any));
                    sideEffectList.push(updaterForGivenPayload(draftState as any) as any);
                });
                this.broadcast();
                if (sideEffectList.length > 0) {
                    return this.executeSideEffects(sideEffectList);
                }
            }) as any;
        }
        return tmp as EventHandlers<AppEvents>;
    }

    get dispatch() {
        return this.eventHandlers;
    }

    private getEventNameByHandler(handler: Function) {
        return Object.keys(this.copyOfTransitions).find(
            key => this.copyOfTransitions[key] === (handler as any),
        );
    }

    private executeSideEffects(sideEffects: SideEffectList<AppEvents>): Promise<void> {
        return Promise.allSettled(
            sideEffects
                .filter(sideEffect => sideEffect !== undefined)
                .map(sideEffect =>
                    sideEffect
                        .execute(...sideEffect.args)
                        .then(result => {
                            const successEventName = this.getEventNameByHandler(sideEffect.successEvent);
                            if (successEventName !== undefined) {
                                (this.eventHandlers[successEventName] as any)(result);
                            }
                        })
                        .catch(error => {
                            const failureEventName = this.getEventNameByHandler(sideEffect.failureEvent);
                            if (failureEventName !== undefined) {
                                (this.eventHandlers[failureEventName] as any)(error);
                            }
                        }),
                ),
        ).then();
    }
}
