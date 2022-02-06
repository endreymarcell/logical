import { BaseState } from './StateStore';

export type BaseAppEvents = {
    [eventName: string]: (...args: any) => void;
};

export type Transitions<State extends BaseState, AppEvents extends BaseAppEvents> = {
    [eventName in keyof AppEvents]: (...payload: Parameters<AppEvents[eventName]>) => (state: State) => void;
};
