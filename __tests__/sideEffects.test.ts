import { createSideEffects, createTransitions, StateStore } from '../src';

type State = {
    value: string;
};

const transitions = createTransitions<State>()({
    successfulSideEffect: () => () => sideEffects.resolveWithSuccessString(),
    failingSideEffect: () => () => sideEffects.rejectWithError(),
    success: (result: string) => state => void (state.value = result),
    failure: (error: any) => state => void (state.value = error),
});

const sideEffects = createSideEffects(transitions, {
    resolveWithSuccessString: [() => Promise.resolve('success'), transitions.success, transitions.failure],
    rejectWithError: [() => Promise.reject('error'), transitions.success, transitions.failure],
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
