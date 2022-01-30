import { Logic, Store } from '../src';

type State = {
    count: number;
};

type AppEvents = {
    increase: (amount: number) => void;
    decrease: (amount: number) => void;
    reset: () => void;
    multiplyThenAdd: (mult: number, add: number) => void;
};

describe('store', () => {
    test('works', () => {
        const logic: Logic<State, AppEvents> = {
            increase: amount => state => void (state.count += amount),
            decrease: amount => state => void (state.count -= amount),
            reset: () => state => void (state.count = 0),
            multiplyThenAdd: (mult, add) => state => void (state.count = state.count * mult + add),
        };
        const initialState: State = {
            count: 0,
        };
        const store = new Store(initialState, logic);

        store.dispatch.increase(10);
        expect(store.get().count).toBe(10);

        store.dispatch.decrease(5);
        expect(store.get().count).toBe(5);

        store.dispatch.reset();
        expect(store.get().count).toBe(0);

        store.dispatch.increase(3);
        expect(store.get().count).toBe(3);

        store.dispatch.multiplyThenAdd(3, 1);
        expect(store.get().count).toBe(10);
    });
});
