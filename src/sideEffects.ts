import type { BaseAppEvents } from './transitions';

export type SideEffect<Args extends Array<any>, ReturnType, AppEvents> = {
    name: string;
    execute: (...payload: Args) => Promise<ReturnType>;
    args: Args;
    successEvent: AppEvents[keyof AppEvents];
    failureEvent: AppEvents[keyof AppEvents];
};

type SideEffectCreator<Args extends Array<any>, ReturnType, AppEvents extends BaseAppEvents> = (
    ...args: Args
) => SideEffect<Args, ReturnType, AppEvents>;

export function createSideEffectCreator<Args extends Array<any>, ReturnType, AppEvents extends BaseAppEvents>(
    name: string,
    execute: (...payload: Args) => Promise<ReturnType>,
    successEvent: AppEvents[keyof AppEvents],
    failureEvent: AppEvents[keyof AppEvents],
): SideEffectCreator<Args, ReturnType, AppEvents> {
    return (...args: Args) => ({
        name,
        execute,
        args,
        successEvent,
        failureEvent,
    });
}

export type SideEffectList<AppEvents extends BaseAppEvents> = Array<SideEffect<any, any, AppEvents>>;
