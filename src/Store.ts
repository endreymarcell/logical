import { BaseStore } from './BaseStore';
import type { OpaqueSideEffectType, Transition } from './transitions';
import produce from 'immer';
import { SideEffectInstanceCreator } from './sideEffects';

type LogLevel = 'silent' | 'debug';

interface StoreOptions {
    logLevel: LogLevel;
}

export class Store<ValueType> extends BaseStore<ValueType> {
    private localCopyOfTransitions: Record<PropertyKey, any>;
    private logLevel: LogLevel;

    constructor(initialValue: ValueType, options?: StoreOptions) {
        super(initialValue);
        this.localCopyOfTransitions = {};
        this.logLevel = options?.logLevel ?? 'silent';
    }

    private log(...message: Array<string>) {
        if (this.logLevel === 'debug') {
            console.log(...message);
        }
    }

    public getDispatcher() {
        const that = this;
        return function <
            Transitions extends Record<PropertyKey, Transition<Array<any>, ValueType>>,
            SideEffects extends Record<
                PropertyKey,
                SideEffectInstanceCreator<Array<any>, Array<any> | void, ValueType>
            >,
        >(transitions: Transitions, sideEffects?: SideEffects) {
            type TypedTransitions = typeof transitions;
            type TypedSideEffectInstanceCreators = typeof sideEffects;

            type EventHandlersForTransitions = {
                [key in keyof TypedTransitions]: (...args: Parameters<TypedTransitions[key]>) => void;
            };
            const eventHandlersForTransitions = {} as EventHandlersForTransitions;

            type EventHandlersForSideEffectSuccess = {
                [key in keyof TypedSideEffectInstanceCreators as `${key}Success`]: (
                    ...args: [ReturnType<TypedSideEffectInstanceCreators[key]>]
                ) => void;
            };
            const eventHandlersForSideEffectSuccess = {} as EventHandlersForSideEffectSuccess;

            type EventHandlersForSideEffectFailure = {
                [key in keyof TypedSideEffectInstanceCreators as `${key}Failure`]: (...args: [any]) => void;
            };
            const eventHandlersForSideEffectFailure = {} as EventHandlersForSideEffectFailure;

            for (const eventName of Object.keys(transitions) as Array<keyof TypedTransitions>) {
                eventHandlersForTransitions[eventName] = that.getEventHandler(transitions[eventName]);
            }

            if (sideEffects !== undefined) {
                for (const eventName of Object.keys(sideEffects) as Array<
                    keyof TypedSideEffectInstanceCreators
                >) {
                    // @ts-ignore
                    eventHandlersForSideEffectSuccess[`${eventName}Success`] = that.getEventHandler(
                        sideEffects[eventName].successTransition,
                    );
                    // @ts-ignore
                    eventHandlersForSideEffectFailure[`${eventName}Failure`] = that.getEventHandler(
                        sideEffects[eventName].failureTransition,
                    );
                }
            }

            const finalTransitions = {
                ...eventHandlersForTransitions,
                ...eventHandlersForSideEffectSuccess,
                ...eventHandlersForSideEffectFailure,
            };
            that.localCopyOfTransitions = finalTransitions;
            return finalTransitions;
        };
    }

    // For a given transition definition `payload? => state => void | SideEffect`
    // create an event handler `payload? => void | SideEffect`, which
    // 1. updates the state of the store using Immer,
    // 2. broadcasts this new state to the store's subscribers, and
    // 3. executes possible returned side effects.
    private getEventHandler<Args extends Array<any>>(transition: Transition<Args, ValueType>) {
        return (...payload: Parameters<typeof transition>) => {
            // Bind the specific payload to the transition to get a state updater function
            const updaterForGivenPayload = transition(...payload);

            const maybeSideEffects: Array<OpaqueSideEffectType<ValueType>> = [];

            // Use Immer to produce the new value
            this.value = produce(this.value, draftState => {
                // Update the state
                const maybeSideEffect = updaterForGivenPayload(draftState as ValueType);
                if (maybeSideEffect) {
                    if (Array.isArray(maybeSideEffect)) {
                        maybeSideEffects.push(...maybeSideEffect);
                    } else {
                        maybeSideEffects.push(maybeSideEffect);
                    }
                }
            });

            const eventLog = `logical/event: ${transition.name}(${payload.join(', ')})`;
            const sideEffectsLog =
                maybeSideEffects.length > 0
                    ? `logical/sideEffects: ${maybeSideEffects.map(effect => effect.name).join(', ')}`
                    : undefined;
            this.log(eventLog, sideEffectsLog !== undefined ? `-> ${sideEffectsLog}` : '');

            this.broadcast();
            return Promise.allSettled(maybeSideEffects.map(sideEffect => this.executeSideEffect(sideEffect)));
        };
    }

    private executeSideEffect(sideEffect: OpaqueSideEffectType<ValueType>) {
        const {
            args,
            blueprint: [execute],
        } = sideEffect;
        this.log(`logical/sideEffect: ${String(sideEffect.name)}(${args.join(', ')})`);
        return execute(...args)
            .then(result => this.localCopyOfTransitions[String(sideEffect.name) + 'Success'](result))
            .catch(problem => this.localCopyOfTransitions[String(sideEffect.name) + 'Failure'](problem));
    }
}
