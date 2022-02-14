import { createTransitions } from '../src/transitions';
import { Store } from '../src/Store';

describe('pure transitions', () => {
    test('work', () => {
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
});
