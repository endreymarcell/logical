import { BaseState } from './StateStore';
import { SideEffectThunk } from './sideEffects';

export type BaseAppEvents = {
    [eventName: string]: (...args: any) => any;
};

type SideEffectTypeForEventName<
    AppEvents extends BaseAppEvents,
    eventName extends keyof AppEvents,
> = SideEffectThunk<
    Parameters<ReturnType<ReturnType<AppEvents[eventName]>>>,
    ReturnType<ReturnType<ReturnType<AppEvents[eventName]>>>,
    AppEvents
>;

type TransitionTypeForEventName<
    State extends BaseState,
    AppEvents extends BaseAppEvents,
    eventName extends keyof AppEvents,
> = (
    ...payload: Parameters<AppEvents[eventName]>
) => (state: State) => void | SideEffectTypeForEventName<AppEvents, eventName>;

export type Transitions<State extends BaseState, AppEvents extends BaseAppEvents> = {
    [eventName in keyof AppEvents]: TransitionTypeForEventName<State, AppEvents, eventName>;
};

type TransitionInput<State extends BaseState> = (...args: Array<any>) => (state: State) => any;

export function createTransitions<State extends BaseState>(inputs: {
    [key: string]: TransitionInput<State>;
}): { [key in keyof typeof inputs]: TransitionInput<State> } {
    // @ts-ignore
    return {
        ...inputs,
    };
}

export const createLogic = createTransitions;
