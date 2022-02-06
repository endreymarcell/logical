import { BaseStore } from './BaseStore';
import produce from 'immer';
import type { BaseAppEvents, Transitions } from './transitions';
import type { SideEffectList } from './sideEffects';

export type BaseState = {
    [prop: string]: any;
};

type EventHandlers<AppEvents extends BaseAppEvents> = {
    [eventName in keyof AppEvents]: (...payload: Parameters<AppEvents[eventName]>) => void;
};

export class StateStore<State extends BaseState, AppEvents extends BaseAppEvents> extends BaseStore<State> {
    private readonly copyOfTransitions: Transitions<State, AppEvents>;
    private readonly eventHandlers: EventHandlers<AppEvents>;

    constructor(initialState: State, transitions: Transitions<State, AppEvents>) {
        super(initialState);
        this.copyOfTransitions = transitions;
        this.eventHandlers = this.getEventHandlers(transitions);
    }

    private getEventHandlers(transitions: Transitions<State, AppEvents>): EventHandlers<AppEvents> {
        const eventHandlers = {} as EventHandlers<AppEvents>;
        for (const eventName of Object.keys(transitions)) {
            // Workaround for the problem that `typeof Object.keys(foo) !== keyof foo`
            const typedEventName = eventName as keyof AppEvents;
            const transition = transitions[typedEventName];
            eventHandlers[typedEventName] = this.getEventHandler(typedEventName, transition);
        }
        return eventHandlers as EventHandlers<AppEvents>;
    }

    // For a given transition definition `payload? => state => sideEffect?`
    // create an event handler `payload? => void`, which
    // 1. updates the state of the store using Immer,
    // 2. broadcasts this new state to the store's subscribers, and
    // 3. executes the transition's side effects (if any).
    private getEventHandler(
        eventName: keyof AppEvents,
        transition: Transitions<State, AppEvents>[typeof eventName],
    ) {
        return (...payload: Parameters<AppEvents[typeof eventName]>) => {
            const sideEffectList: SideEffectList<AppEvents> = [];
            this.value = produce(this.value, draftState => {
                const updaterForGivenPayload = transition(...payload);
                const maybeSideEffect = updaterForGivenPayload(draftState as State);
                if (maybeSideEffect !== undefined) {
                    sideEffectList.push(maybeSideEffect);
                }
            });
            this.broadcast();
            if (sideEffectList.length > 0) {
                return this.executeSideEffects(sideEffectList);
            }
        };
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
