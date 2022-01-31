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

export class Store<State extends BaseState, AppEvents extends BaseAppEvents> {
    private state: State;
    private readonly eventHandlers: EventHandlers<AppEvents>;
    private subscribers: Subscriber<State>[];

    constructor(initialState: State, transitions: Transitions<State, AppEvents>) {
        this.state = initialState;
        this.eventHandlers = this.getEventHandlers(transitions);
        this.subscribers = [];
    }

    private getEventHandlers(transitions: Transitions<State, AppEvents>): EventHandlers<AppEvents> {
        const tmp = {} as EventHandlers<AppEvents>;
        for (const eventName of Object.keys(transitions)) {
            const typedEventName = eventName as keyof AppEvents;
            const eventHandler = transitions[typedEventName];
            tmp[typedEventName] = ((...payload: Parameters<typeof eventHandler>) => {
                this.state = produce(this.state, eventHandler(...(payload as any)));
                this.broadcast();
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
}
