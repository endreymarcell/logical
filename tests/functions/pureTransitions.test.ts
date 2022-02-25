import { createTransitions } from '../../src/transitions';
import { Store } from '../../src';

describe('pure transitions', () => {
    test('single state field, single parameter payload', () => {
        type State = { count: number };
        const transitions = createTransitions<State>()({
            plus: (amount: number) => state => void (state.count += amount),
            reset: () => state => void (state.count = 0),
        });
        const store = new Store<State>({ count: 0 });
        const dispatcher = store.getDispatcher()(transitions);
        expect(store.get().count).toBe(0);

        dispatcher.plus(10);
        expect(store.get().count).toBe(10);

        dispatcher.plus(10);
        expect(store.get().count).toBe(20);

        dispatcher.reset();
        expect(store.get().count).toBe(0);
    });

    test('multiple state fields, single parameter payload', () => {
        type State = {
            count: number;
            numChanges: number;
        };
        const initialState: State = {
            count: 0,
            numChanges: 0,
        };
        const transitions = createTransitions<State>()({
            plus: (amount: number) => state => {
                state.count += amount;
                state.numChanges++;
            },
            minus: (amount: number) => state => {
                state.count -= amount;
                state.numChanges++;
            },
            reset: () => state => {
                state.count = 0;
                state.numChanges++;
            },
        });
        const store = new Store<State>(initialState);
        const dispatcher = store.getDispatcher()(transitions);
        expect(store.get()).toEqual(initialState);

        dispatcher.plus(10);
        expect(store.get()).toEqual({ count: 10, numChanges: 1 });

        dispatcher.minus(3);
        expect(store.get()).toEqual({ count: 7, numChanges: 2 });

        dispatcher.reset();
        expect(store.get()).toEqual({ count: 0, numChanges: 3 });
    });

    test('multiple state fields, multiple parameters payload', () => {
        type State = {
            count: number;
            text: string;
        };
        const initialState: State = {
            count: 0,
            text: '',
        };
        const store = new Store<State>(initialState);
        const transitions = createTransitions<State>()({
            set: (count: number, text: string) => state => {
                state.count = count;
                state.text = text;
            },
            reset: () => state => {
                state.count = 0;
                state.text = '';
            },
        });
        const dispatcher = store.getDispatcher()(transitions);
        expect(store.get()).toEqual(initialState);

        dispatcher.set(99, "but a glitch ain't one");
        expect(store.get()).toEqual({ count: 99, text: "but a glitch ain't one" });

        dispatcher.reset();
        expect(store.get()).toEqual({ count: 0, text: '' });
    });
});
