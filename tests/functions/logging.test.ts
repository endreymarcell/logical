import { createTransitions, noop } from '../../src/transitions';
import { Store } from '../../src';
import { createSideEffectInstanceCreators } from '../../src/sideEffects';

describe('Store logging', () => {
    test('Logs events when in debug mode', async () => {
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
        const store = new Store<State>(initialState, { logLevel: 'debug' });
        const d = store.getDispatcher()(transitions, sideEffects);

        // WHEN
        await d.triggerSideEffects();

        // THEN
        expect(mock).toHaveBeenCalledTimes(2);
        expect(mock).toHaveBeenNthCalledWith(1, 'first');
        expect(mock).toHaveBeenNthCalledWith(2, 'second');
    });
});
