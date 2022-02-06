import { createSideEffect, Store, Transitions } from '../src';

type State = {
    value: string;
};

type AppEvents = {
    setValuePurely: (value: string) => void;
    setValueWithSideEffect: (value: string) => any;
    onlySideEffect: (value: string) => any;
    zero: () => void;
};

const transitions: Transitions<State, AppEvents> = {
    setValuePurely: value => state => void (state.value = value),
    setValueWithSideEffect: value => state => {
        state.value = value;
        return sideEffects.consoleLogFoo();
    },
    onlySideEffect: () => () => sideEffects.consoleLogFoo(),
    zero: () => () => {},
};

const sideEffects = {
    consoleLogFoo: createSideEffect<[], void, AppEvents>(
        'consoleLogFoo',
        () => Promise.resolve(),
        transitions.zero,
        transitions.zero,
    ),
};

describe('side effects', () => {
    test('just set the value', () => {
        const store = new Store({ value: 'initial' }, transitions);
        store.dispatch.setValuePurely('set-from-test');
        expect(store.get().value).toBe('set-from-test');
    });

    test('set the value with side effect', () => {
        const store = new Store({ value: 'initial' }, transitions);
        store.dispatch.setValueWithSideEffect('set-from-test');
        expect(store.get().value).toBe('set-from-test');
        expect(store.TEST__scheduledSideEffects).toEqual([sideEffects.consoleLogFoo()]);
    });

    test('side effect only', () => {
        const store = new Store({ value: 'initial' }, transitions);
        store.dispatch.onlySideEffect('set-from-test');
        expect(store.get().value).toBe('initial');
        expect(store.TEST__scheduledSideEffects).toEqual([sideEffects.consoleLogFoo()]);
    });
});
