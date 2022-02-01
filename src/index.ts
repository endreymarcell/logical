import produce from 'immer';

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

type Subscriber<State extends BaseState> = (value: State) => void;

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

export class Store<State extends BaseState, AppEvents extends BaseAppEvents> {
    private state: State;
    private readonly eventHandlers: EventHandlers<AppEvents>;
    private subscribers: Subscriber<State>[];
    private scheduledSideEffects: SideEffectList<AppEvents>;

    constructor(initialState: State, transitions: Transitions<State, AppEvents>) {
        this.state = initialState;
        this.eventHandlers = this.getEventHandlers(transitions);
        this.subscribers = [];
        this.scheduledSideEffects = [];
    }

    private getEventHandlers(transitions: Transitions<State, AppEvents>): EventHandlers<AppEvents> {
        const tmp = {} as EventHandlers<AppEvents>;
        for (const eventName of Object.keys(transitions)) {
            const typedEventName = eventName as keyof AppEvents;
            const eventHandler = transitions[typedEventName];
            tmp[typedEventName] = ((...payload: Parameters<typeof eventHandler>) => {
                const sideEffectList: SideEffectList<AppEvents> = [];
                this.state = produce(this.state, draftState => {
                    const updaterForGivenPayload = eventHandler(...(payload as any));
                    sideEffectList.push(updaterForGivenPayload(draftState as any) as any);
                });
                this.broadcast();
                if (sideEffectList.length > 0) {
                    this.scheduleSideEffects(sideEffectList);
                }
            }) as any;
        }
        return tmp as EventHandlers<AppEvents>;
    }

    get dispatch() {
        return this.eventHandlers;
    }

    get() {
        return this.state;
    }

    subscribe(subscriber: Subscriber<State>) {
        this.subscribers.push(subscriber);
        subscriber(this.state);
    }

    private broadcast() {
        this.subscribers.forEach(subscriber => subscriber(this.state));
    }

    private scheduleSideEffects(sideEffectList: SideEffectList<AppEvents>) {
        this.scheduledSideEffects.push(...sideEffectList);
    }

    get TEST__scheduledSideEffects() {
        return [...this.scheduledSideEffects];
    }

    private executeSideEffects() {
        while (this.scheduledSideEffects.length > 0) {
            const sideEffect = this.scheduledSideEffects.shift();
            if (sideEffect !== undefined) {
                sideEffect
                    .execute(...sideEffect.args)
                    .then(result => (this.dispatch[sideEffect.successEvent as any] as any)(result))
                    .catch(error => (this.dispatch[sideEffect.failureEvent as any] as any)(error));
            }
        }
    }
}
