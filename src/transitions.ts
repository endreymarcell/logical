export type BaseState = {
    [key: PropertyKey]: any;
};

export type Transition<Args extends Array<any>, State extends BaseState> = (
    ...args: Args
) => (state: State) => void;

export function createTransition<State extends BaseState>() {
    return function <Args extends Array<any>, ReturnVoid>(
        input: (...args: Args) => (state: State) => ReturnVoid extends void ? ReturnVoid : never,
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
