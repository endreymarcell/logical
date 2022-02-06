import type { BaseAppEvents } from './transitions';

export type SideEffect<Args extends Array<any>, ReturnType, AppEvents> = {
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

export type SideEffectList<AppEvents extends BaseAppEvents> = Array<SideEffect<any, any, AppEvents>>;
