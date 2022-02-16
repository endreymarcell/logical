import { SideEffectInstance } from './sideEffects';

export type BaseState = {
    [key: PropertyKey]: any;
};

// I cannot reference the actual side effects type in the Transitions type
// because it creates a circular type dependency between them.
// Therefore, I only have this opaque type here to ensure that
// whatever is being returned from a transition has the shape of a side effect.
// It's a very specific shape anyway so it'll probably catch wrong invocations.
export type OpaqueSideEffectType<State extends BaseState> = SideEffectInstance<
    Array<unknown>,
    Array<unknown>,
    State
>;

export type Transition<Args extends Array<any>, State extends BaseState> = (
    ...args: Args
) => (state: State) => void | OpaqueSideEffectType<State>;

type MustBeOpaqueSideEffectOrVoid<T, State extends BaseState> = T extends OpaqueSideEffectType<State>
    ? T
    : T extends void
    ? T
    : never;

export function createTransition<State extends BaseState>() {
    return function <Args extends Array<any>, Return>(
        input: (...args: Args) => (state: State) => MustBeOpaqueSideEffectOrVoid<Return, State>,
    ) {
        return input;
    };
}

export function createTransitions<State extends BaseState>() {
    return function <InputsType extends Record<PropertyKey, Transition<any, State>>>(inputs: InputsType) {
        const transitions = {} as typeof inputs;
        for (const key of Object.keys(inputs) as Array<keyof typeof inputs>) {
            // @ts-ignore
            transitions[key] = createTransition<State>()(inputs[key]);
        }
        return transitions;
    };
}
