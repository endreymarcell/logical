import { Store } from '../src';
import { createTransitions } from '../src/transitions';
import { createSideEffectInstanceCreators } from '../src/sideEffects';

describe('side effect', () => {
    test('huh', async () => {
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
});
