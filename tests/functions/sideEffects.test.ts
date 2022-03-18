import { Store } from '../../src';
import { createTransitions, noop } from '../../src/transitions';
import { createSideEffectInstanceCreators } from '../../src/sideEffects';

describe('side effect', () => {
    test('single side effect', async () => {
        // GIVEN
        type State = {
            value: string;
        };
        const initialState: State = {
            value: 'initial',
        };
        const sideEffects = createSideEffectInstanceCreators<State>()({
            successful: [
                () => Promise.resolve(),
                () => state => void (state.value = 'success'),
                () => state => void (state.value = 'failure'),
            ],
            failing: [
                () => Promise.reject(),
                () => state => void (state.value = 'success'),
                () => state => void (state.value = 'failure'),
            ],
        });
        const transitions = createTransitions<State>()({
            good: () => state => {
                state.value = 'started';
                return sideEffects.successful();
            },
            bad: () => state => {
                state.value = 'started';
                return sideEffects.failing();
            },
        });
        const store = new Store<State>(initialState);
        const d = store.getDispatcher()(transitions, sideEffects);

        // WHEN
        await d.good();

        // THEN
        expect(store.get().value).toBe('success');

        // WHEN
        await d.bad();

        // THEN
        expect(store.get().value).toBe('failure');
    });

    test('multiple side effects', async () => {
        // GIVEN
        type State = {};
        const initialState: State = {};
        const mock = jest.fn();
        const sideEffects = createSideEffectInstanceCreators<State>()({
            first: [
                () => {
                    mock('first');
                    return Promise.resolve();
                },
                noop,
                noop,
            ],
            second: [
                () => {
                    mock('second');
                    return Promise.resolve();
                },
                noop,
                noop,
            ],
        });
        const transitions = createTransitions<State>()({
            triggerSideEffects: () => state => [sideEffects.first(), sideEffects.second()],
        });
        const store = new Store<State>(initialState);
        const d = store.getDispatcher()(transitions, sideEffects);

        // WHEN
        await d.triggerSideEffects();

        // THEN
        expect(mock).toHaveBeenCalledTimes(2);
        expect(mock).toHaveBeenNthCalledWith(1, 'first');
        expect(mock).toHaveBeenNthCalledWith(2, 'second');
    });
});
