import { createSideEffectCreator, StateStore } from '../src';
import type { Transitions } from '../src';
import { createSideEffects } from '../src/sideEffects';

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

const sideEffects = createSideEffects(transitions, {
    consoleLogFoo: {
        execute: () => {
            console.log('foo');
            return Promise.resolve();
        },
        successEvent: transitions.zero,
        failureEvent: transitions.zero,
    },
});

describe('side effects', () => {
    test('just set the value', () => {
        const store = new StateStore({ value: 'initial' }, transitions);
        store.dispatch.setValuePurely('set-from-test');
        expect(store.get().value).toBe('set-from-test');
    });

    test('set the value with side effect', () => {
        const store = new StateStore({ value: 'initial' }, transitions);
        const consoleLogMock = jest.spyOn(console, 'log').mockImplementation();
        store.dispatch.setValueWithSideEffect('set-from-test');
        expect(store.get().value).toBe('set-from-test');
        expect(consoleLogMock).toBeCalledWith('foo');
        consoleLogMock.mockRestore();
    });

    test('side effect only', () => {
        const store = new StateStore({ value: 'initial' }, transitions);
        const consoleLogMock = jest.spyOn(console, 'log').mockImplementation();
        store.dispatch.onlySideEffect('set-from-test');
        expect(store.get().value).toBe('initial');
        expect(consoleLogMock).toBeCalledWith('foo');
        consoleLogMock.mockRestore();
    });
});
