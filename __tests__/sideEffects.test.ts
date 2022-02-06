import { createSideEffectCreator, StateStore } from '../src';
import type { Transitions } from '../src';

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

const sideEffects = {
    resolveWithSuccessString: createSideEffectCreator<[], string, AppEvents>(
        'resolveWithSuccessString',
        () => Promise.resolve('success'),
        transitions.success,
        transitions.failure,
    ),
    rejectWithError: createSideEffectCreator<[], void, AppEvents>(
        'rejectWithError',
        () => Promise.reject('error'),
        transitions.success,
        transitions.failure,
    ),
};

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
