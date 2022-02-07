import { createSideEffectCreator, StateStore } from '../src';
import type { Transitions } from '../src';
import { createSideEffects } from '../src/sideEffects';

type State = {
    value: string;
};

type AppEvents = {
    successfulSideEffect: () => string;
    failingSideEffect: () => string;
    success: (result: string) => void;
    failure: (error: any) => void;
    zero: () => void;
};

const transitions: Transitions<State, AppEvents> = {
    successfulSideEffect: () => () => sideEffects.resolveWithSuccessString(),
    failingSideEffect: () => () => sideEffects.rejectWithError(),
    success: (result: string) => state => void (state.value = result),
    failure: (error: any) => state => void (state.value = error),
    zero: () => () => {},
};

const sideEffects = createSideEffects(transitions, {
    resolveWithSuccessString: {
        execute: () => Promise.resolve('success'),
        successEvent: transitions.success,
        failureEvent: transitions.failure,
    },
    rejectWithError: {
        execute: () => Promise.reject('error'),
        successEvent: transitions.success,
        failureEvent: transitions.failure,
    },
});

describe('side effects', () => {
    test('success action', async () => {
        const store = new StateStore({ value: 'initial' }, transitions);
        await store.dispatch.successfulSideEffect();
        expect(store.get().value).toBe('success');
    });

    test('failure action', async () => {
        const store = new StateStore({ value: 'initial' }, transitions);
        await store.dispatch.failingSideEffect();
        expect(store.get().value).toBe('error');
    });
});
