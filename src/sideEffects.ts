import { BaseState, Transition } from './transitions';

type SideEffectBlueprint<Args extends Array<any>, Return extends Array<any>, State extends BaseState> = [
    Execute: (...args: Args) => Promise<Return>,
    SuccessTransition: Transition<Return, State>,
    FailureTransition: Transition<any, State>,
];

type SideEffectInstance<Args extends Array<any>, Return extends Array<any>, State extends BaseState> = (
    ...args: Args
) => {
    name: PropertyKey;
    args: Args;
    blueprint: SideEffectBlueprint<Args, Return, State>;
};

export function createSideEffectInstance<State extends BaseState>() {
    return function <Args extends Array<any>, Return extends Array<any>>(
        name: PropertyKey,
        input: [
            Execute: (...args: Args) => Promise<Return>,
            SuccessTransition: Transition<Return, State>,
            FailureTransition: Transition<any, State>,
        ],
    ) {
        return (...args: Args) => ({
            name,
            args,
            blueprint: input,
        });
    };
}

export function createSideEffects<State extends BaseState>() {
    return function <InputsType extends Record<PropertyKey, SideEffectBlueprint<any, any, State>>>(
        inputs: InputsType,
    ) {
        type TypedInput = typeof inputs;
        const sideEffects = {} as {
            [key in keyof TypedInput]: SideEffectInstance<
                Parameters<TypedInput[key][0]>,
                Awaited<ReturnType<TypedInput[key][0]>>,
                State
            >;
        };
        for (const key of Object.keys(inputs) as Array<keyof TypedInput>) {
            sideEffects[key] = createSideEffectInstance<State>()(key, inputs[key]);
        }
        return sideEffects;
    };
}
