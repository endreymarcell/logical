import { BaseState } from './StateStore';
import { SideEffect } from './sideEffects';

export type BaseAppEvents = {
    [eventName: string]: (...args: any) => any;
};

export type Transitions<State extends BaseState, AppEvents extends BaseAppEvents> = {
    [eventName in keyof AppEvents]: (
        ...payload: Parameters<AppEvents[eventName]>
    ) => (state: State) => void | SideEffect<any, any, AppEvents>;
};
