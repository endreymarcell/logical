import type { BaseAppEvents, Transitions } from './transitions';
import { BaseState } from './StateStore';

export type SideEffectThunk<Args extends Array<any>, ReturnType, AppEvents> = {
    name: string;
    execute: (...payload: Args) => Promise<ReturnType>;
    args: Args;
    successEventName: keyof AppEvents | undefined;
    failureEventName: keyof AppEvents | undefined;
};

type SideEffectCreator<Args extends Array<any>, ReturnType, AppEvents extends BaseAppEvents> = (
    ...args: Args
) => SideEffectThunk<Args, ReturnType, AppEvents>;

export function createSideEffectCreator<
    Args extends Array<any>,
    ReturnType,
    State extends BaseState,
    AppEvents extends BaseAppEvents,
>(
    name: string,
    execute: (...payload: Args) => Promise<ReturnType>,
    successEvent: AppEvents[keyof AppEvents],
    failureEvent: AppEvents[keyof AppEvents],
    transitions: Transitions<State, AppEvents>,
): SideEffectCreator<Args, ReturnType, AppEvents> {
    return (...args: Args) => ({
        name,
        execute,
        args,
        successEventName: getEventNameByHandler(successEvent, transitions),
        failureEventName: getEventNameByHandler(failureEvent, transitions),
    });
}

function getEventNameByHandler<State extends BaseState, AppEvents extends BaseAppEvents>(
    handler: Transitions<State, AppEvents>[keyof AppEvents],
    transitions: Transitions<State, AppEvents>,
) {
    return Object.keys(transitions).find(key => transitions[key] === handler);
}

export type SideEffectList<AppEvents extends BaseAppEvents> = Array<SideEffectThunk<any, any, AppEvents>>;
