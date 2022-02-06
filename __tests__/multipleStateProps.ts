import { StateStore } from '../src';
import type { Transitions } from '../src';

type State = {
    count: number;
    numChanges: number;
};

type AppEvents = {
    increase: (amount: number) => void;
    decrease: (amount: number) => void;
    reset: () => void;
    multiplyThenAdd: (mult: number, add: number) => void;
};

const transitions: Transitions<State, AppEvents> = {
    increase: amount => state => {
        state.count += amount;
        state.numChanges++;
    },
    decrease: amount => state => {
        state.count -= amount;
        state.numChanges++;
    },
    reset: () => state => {
        state.count = 0;
        state.numChanges++;
    },
    multiplyThenAdd: (mult, add) => state => {
        state.count = state.count * mult + add;
        state.numChanges++;
    },
};

describe('state with multiple properties', () => {
    test('initial state', () => {
        const store = new StateStore(
            {
                count: 0,
                numChanges: 0,
            },
            transitions,
        );
        expect(store.get()).toEqual({ count: 0, numChanges: 0 });
    });

    test('multiple props can change', () => {
        const store = new StateStore(
            {
                count: 0,
                numChanges: 0,
            },
            transitions,
        );

        store.dispatch.increase(10);
        expect(store.get()).toEqual({ count: 10, numChanges: 1 });

        store.dispatch.decrease(3);
        expect(store.get()).toEqual({ count: 7, numChanges: 2 });

        store.dispatch.reset();
        expect(store.get()).toEqual({ count: 0, numChanges: 3 });

        store.dispatch.increase(3);
        expect(store.get()).toEqual({ count: 3, numChanges: 4 });

        store.dispatch.multiplyThenAdd(3, 1);
        expect(store.get()).toEqual({ count: 10, numChanges: 5 });
    });
});
