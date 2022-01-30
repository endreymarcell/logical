import produce from 'immer';

type BaseAppEvents = {
    [eventName: string]: (...args: any) => void;
};

export type Logic<State, AppEvents extends BaseAppEvents> = {
    [eventName in keyof AppEvents]: (...payload: Parameters<AppEvents[eventName]>) => (state: State) => void;
};

type InternalLogic<AppEvents extends BaseAppEvents> = {
    [eventName in keyof AppEvents]: (...payload: Parameters<AppEvents[eventName]>) => void;
};

export class Store<State, AppEvents extends BaseAppEvents> {
    private state: State;
    private readonly internalLogic: InternalLogic<AppEvents>;

    constructor(initialState: State, logic: Logic<State, AppEvents>) {
        this.state = initialState;
        this.internalLogic = this.getInternalLogic(logic);
    }

    private getInternalLogic(logic: Logic<State, AppEvents>): InternalLogic<AppEvents> {
        const tmp = {} as InternalLogic<AppEvents>;
        for (const eventName of Object.keys(logic)) {
            const typedEventName = eventName as keyof AppEvents;
            const eventHandler = logic[typedEventName];
            tmp[typedEventName] = ((...payload: Parameters<typeof eventHandler>) => {
                this.state = produce(this.state, eventHandler(...(payload as any)));
            }) as any;
        }
        return tmp as InternalLogic<AppEvents>;
    }

    get dispatch() {
        return this.internalLogic;
    }

    get() {
        return this.state;
    }
}
