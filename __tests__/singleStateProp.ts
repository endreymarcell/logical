import { createTransitions, StateStore } from '../src';

type State = {
    count: number;
};

const transitions = createTransitions<State>()({
    increase: (amount: number) => state => void (state.count += amount),
    decrease: (amount: number) => state => void (state.count -= amount),
    reset: () => state => void (state.count = 0),
    multiplyThenAdd: (mult: number, add: number) => state => void (state.count = state.count * mult + add),
});

describe('state with single prop', () => {
    test('initial state', () => {
        const store = new StateStore({ count: 99 }, transitions);
        expect(store.get().count).toBe(99);
    });

    test('events with single payload', () => {
        const store = new StateStore({ count: 0 }, transitions);

        store.dispatch.increase(10);
        expect(store.get().count).toBe(10);

        store.dispatch.decrease(3);
        expect(store.get().count).toBe(7);
    });

    test('event with no payload', () => {
        const store = new StateStore({ count: 10 }, transitions);

        store.dispatch.reset();
        expect(store.get().count).toBe(0);
    });

    test('event with multipart payload', () => {
        const store = new StateStore({ count: 2 }, transitions);

        store.dispatch.multiplyThenAdd(3, 1);
        expect(store.get().count).toBe(7);
    });
});
