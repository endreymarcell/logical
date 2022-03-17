import { createTransitions } from '../../src/transitions';
import { Store } from '../../src';

type State = {
    value: string;
};

const transitions = createTransitions<State>()({
    set: (value: string) => state => void (state.value = value),
});

describe('subscription', () => {
    test('single subscriber', () => {
        // given
        const store = new Store({ value: '' });
        const dispatcher = store.getDispatcher()(transitions);
        const sub = jest.fn();
        store.subscribe(sub);

        // when
        dispatcher.set('foo');

        // then
        expect(sub).toBeCalledWith({ value: 'foo' });
    });

    test('multiple subscribers', () => {
        // given
        const store = new Store({ value: '' });
        const dispatcher = store.getDispatcher()(transitions);
        const sub1 = jest.fn();
        const sub2 = jest.fn();
        store.subscribe(sub1);
        store.subscribe(sub2);

        // when
        dispatcher.set('foo');

        // then
        expect(sub1).toBeCalledWith({ value: 'foo' });
        expect(sub2).toBeCalledWith({ value: 'foo' });
    });

    test('unsubbing', () => {
        const store = new Store({ value: '' });
        const dispatcher = store.getDispatcher()(transitions);

        // mock function has no calls initially
        const sub = jest.fn();
        expect(sub).toBeCalledTimes(0);

        // subscribing calls the function immediately, call count is 1
        const unsubscribe = store.subscribe(sub);
        expect(sub).toBeCalledTimes(1);

        // dispatching an event calls the subscription again, call count is 2
        dispatcher.set('foo');
        expect(sub).toBeCalledTimes(2);

        // however, after unsubbing...
        unsubscribe();

        // further events do not increase the call count
        dispatcher.set('will not see this');
        expect(sub).toBeCalledTimes(2);
    });
});
