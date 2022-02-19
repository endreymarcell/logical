import { BaseState, Transition } from './transitions';

export type SideEffectBlueprint<
    Args extends Array<any>,
    Return extends Array<any> | void,
    State extends BaseState,
> = [
    Execute: (...args: Args) => Promise<Return>,
    SuccessTransition: Transition<Return extends Array<any> ? Return : [], State>,
    FailureTransition: Transition<any, State>,
];

export type SideEffectInstance<
    Args extends Array<any>,
    Return extends Array<any> | void,
    State extends BaseState,
> = {
    name: PropertyKey;
    args: Args;
    blueprint: SideEffectBlueprint<Args, Return, State>;
};

export type SideEffectInstanceCreator<
    Args extends Array<any>,
    Return extends Array<any> | void,
    State extends BaseState,
> = {
    (...args: Args): SideEffectInstance<Args, Return, State>;
    successTransition: Transition<Args, State>;
    failureTransition: Transition<Args, State>;
};

export function createSideEffectInstanceCreator<State extends BaseState>() {
    return function <Args extends Array<any>, Return>(
        name: PropertyKey,
        blueprint: [
            Execute: (...args: Args) => Promise<Return>,
            SuccessTransition: Transition<[Return], State>,
            FailureTransition: Transition<any, State>,
        ],
    ) {
        const instanceCreator = (...args: Args) => ({ name, args, blueprint });
        instanceCreator.successTransition = blueprint[1];
        instanceCreator.failureTransition = blueprint[2];
        return instanceCreator;
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
