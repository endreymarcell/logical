import { BaseStore } from './BaseStore';
import produce from 'immer';
import type { BaseAppEvents, Transitions } from './transitions';
import type { SideEffectList } from './sideEffects';

export type BaseState = {
    [prop: string]: any;
};

type EventHandlers<AppEvents extends BaseAppEvents> = {
    [eventName in keyof AppEvents]: (...payload: Parameters<AppEvents[eventName]>) => void;
};

export class StateStore<State extends BaseState, AppEvents extends BaseAppEvents> extends BaseStore<State> {
    private readonly eventHandlers: EventHandlers<AppEvents>;

    constructor(initialState: State, transitions: Transitions<State, AppEvents>) {
        super(initialState);
        this.eventHandlers = this.getEventHandlers(transitions);
    }

    private getEventHandlers(transitions: Transitions<State, AppEvents>): EventHandlers<AppEvents> {
        const eventHandlers = {} as EventHandlers<AppEvents>;
        // The `as` type cast is required because `Object.keys(foo)` returns string, not `keyof foo`
        for (const eventName of Object.keys(transitions) as Array<keyof AppEvents>) {
            eventHandlers[eventName] = this.getEventHandler(eventName, transitions[eventName]);
        }
        return eventHandlers;
    }

    // For a given transition definition `payload? => state => sideEffect?`
    // create an event handler `payload? => void`, which
    // 1. updates the state of the store using Immer,
    // 2. broadcasts this new state to the store's subscribers, and
    // 3. executes the transition's side effects (if any).
    private getEventHandler(
        eventName: keyof AppEvents,
        transition: Transitions<State, AppEvents>[typeof eventName],
    ) {
        return (...payload: Parameters<AppEvents[typeof eventName]>) => {
            // Bind the specific payload to the transition to get a state updater function
            const updaterForGivenPayload = transition(...payload);
            const sideEffectList: SideEffectList<AppEvents> = [];
            // Use Immer to produce the new value
            this.value = produce(this.value, draftState => {
                // Update the state AND get possible side effect
                const maybeSideEffect = updaterForGivenPayload(draftState as State);
                if (maybeSideEffect !== undefined) {
                    sideEffectList.push(maybeSideEffect);
                }
            });
            this.broadcast();
            if (sideEffectList.length > 0) {
                return this.executeSideEffects(sideEffectList);
            }
        };
    }

    get dispatch() {
        return this.eventHandlers;
    }

    private executeSideEffects(sideEffects: SideEffectList<AppEvents>): Promise<void> {
        return Promise.allSettled(
            sideEffects
                .filter(sideEffect => sideEffect !== undefined)
                .map(sideEffect =>
                    sideEffect
                        .execute(...sideEffect.args)
                        .then(result => {
                            if (sideEffect.successEventName !== undefined) {
                                (this.eventHandlers[sideEffect.successEventName] as any)(result);
                            }
                        })
                        .catch(error => {
                            if (sideEffect.failureEventName !== undefined) {
                                (this.eventHandlers[sideEffect.failureEventName] as any)(error);
                            }
                        }),
                ),
        ).then();
    }
}
