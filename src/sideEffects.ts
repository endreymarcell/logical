import { BaseState, Transition } from './transitions';

export type SideEffectBlueprint<
    Args extends Array<any>,
    Return extends Array<any>,
    State extends BaseState,
> = [
    Execute: (...args: Args) => Promise<Return>,
    SuccessTransition: Transition<Return, State>,
    FailureTransition: Transition<any, State>,
];

export type SideEffectInstance<
    Args extends Array<any>,
    Return extends Array<any>,
    State extends BaseState,
> = {
    name: PropertyKey;
    args: Args;
    blueprint: SideEffectBlueprint<Args, Return, State>;
};

export type SideEffectInstanceCreator<
    Args extends Array<any>,
    Return extends Array<any>,
    State extends BaseState,
> = (...args: Args) => SideEffectInstance<Args, Return, State>;

export function createSideEffectInstanceCreator<State extends BaseState>() {
    return function <Args extends Array<any>, Return>(
        name: PropertyKey,
        blueprint: [
            Execute: (...args: Args) => Promise<Return>,
            SuccessTransition: Transition<[Return], State>,
            FailureTransition: Transition<any, State>,
        ],
    ) {
        return (...args: Args) => ({
            name,
            args,
            blueprint,
        });
    };
}

export function createSideEffectInstanceCreators<State extends BaseState>() {
    return function <Blueprints extends Record<PropertyKey, SideEffectBlueprint<any, any, State>>>(
        blueprints: Blueprints,
    ) {
        type BlueprintsType = typeof blueprints;
        type Execute = 0;
        const sideEffectInstanceCreators = {} as {
            [name in keyof BlueprintsType]: SideEffectInstanceCreator<
                Parameters<BlueprintsType[name][Execute]>,
                Awaited<ReturnType<BlueprintsType[name][Execute]>>,
                State
            >;
        };
        for (const key of Object.keys(blueprints) as Array<keyof BlueprintsType>) {
            sideEffectInstanceCreators[key] = createSideEffectInstanceCreator<State>()(key, blueprints[key]);
        }
        return sideEffectInstanceCreators;
    };
}
