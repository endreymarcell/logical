import type { BaseAppEvents, Transitions } from './transitions';
import { BaseState } from './StateStore';

type SideEffectInput<Args extends Array<any>, ReturnType, AppEvents extends BaseAppEvents> = [
    execute: (...payload: Args) => Promise<ReturnType>,
    successEvent: AppEvents[keyof AppEvents],
    failureEvent: AppEvents[keyof AppEvents],
];

function createSideEffect<
    Args extends Array<any>,
    ReturnType,
    State extends BaseState,
    AppEvents extends BaseAppEvents,
>(
    name: string,
    input: SideEffectInput<Args, ReturnType, any>,
    transitions: Transitions<State, AppEvents>,
): SideEffectCreator<Args, ReturnType, AppEvents> {
    const [execute, successEvent, failureEvent] = input;
    return (...args: Args) => ({
        name,
        execute,
        args,
        successEventName: getEventNameByHandler(successEvent, transitions),
        failureEventName: getEventNameByHandler(failureEvent, transitions),
    });
}

export function createSideEffects<State extends BaseState, AppEvents extends BaseAppEvents>(
    transitions: Transitions<State, AppEvents>,
    inputs: { [key: string]: SideEffectInput<any, any, AppEvents> },
) {
    const sideEffects = {} as { [key in keyof typeof inputs]: SideEffectCreator<any, any, AppEvents> };
    for (const key of Object.keys(inputs) as Array<keyof typeof inputs>) {
        sideEffects[key] = createSideEffect(key as any, inputs[key] as any, transitions);
    }
    return sideEffects;
}

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
