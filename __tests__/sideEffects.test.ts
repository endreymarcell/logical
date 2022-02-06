import { createSideEffect, Store, Transitions } from '../src';

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
    resolveWithSuccessString: createSideEffect<[], string, AppEvents>(
        'resolveWithSuccessString',
        () => Promise.resolve('success'),
        transitions.success,
        transitions.failure,
    ),
    rejectWithError: createSideEffect<[], void, AppEvents>(
        'rejectWithError',
        () => Promise.reject('error'),
        transitions.success,
        transitions.failure,
    ),
};

describe('side effects', () => {
    test('success action', async () => {
        const store = new Store({ value: 'initial' }, transitions);
        store.dispatch.successfulSideEffect();
        store.executeSideEffects();
        await Promise.resolve();
        expect(store.get().value).toBe('success');
    });

    test('failure action', async () => {
        const store = new Store({ value: 'initial' }, transitions);
        store.dispatch.failingSideEffect();
        store.executeSideEffects();
        await Promise.resolve();
        await Promise.resolve();
        expect(store.get().value).toBe('error');
    });
});
