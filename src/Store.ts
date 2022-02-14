import { BaseStore } from './BaseStore';
import type { Transition } from './transitions';
import produce from 'immer';

export class Store<ValueType> extends BaseStore<ValueType> {
    constructor(initialValue: ValueType) {
        super(initialValue);
    }

    public getDispatcher() {
        const that = this;
        return function <Transitions extends Record<PropertyKey, Transition<Array<any>, ValueType>>>(
            transitions: Transitions,
        ) {
            type TypedTransitions = typeof transitions;
            const eventHandlers = {} as {
                [key in keyof TypedTransitions]: (...args: Parameters<TypedTransitions[key]>) => void;
            };
            // The `as` type cast is required because `Object.keys(foo)` returns string, not `keyof foo`
            for (const eventName of Object.keys(transitions) as Array<keyof TypedTransitions>) {
                eventHandlers[eventName] = that.getEventHandler(transitions[eventName]);
            }
            return eventHandlers;
        };
    }

    // For a given transition definition `payload? => state => void`
    // create an event handler `payload? => void`, which
    // 1. updates the state of the store using Immer, and
    // 2. broadcasts this new state to the store's subscribers.
    private getEventHandler<Args extends Array<any>>(transition: Transition<Args, ValueType>) {
        return (...payload: Parameters<typeof transition>) => {
            // Bind the specific payload to the transition to get a state updater function
            const updaterForGivenPayload = transition(...payload);
            // Use Immer to produce the new value
            this.value = produce(this.value, draftState => {
                // Update the state
                updaterForGivenPayload(draftState as ValueType);
            });
            this.broadcast();
        };
    }
}
