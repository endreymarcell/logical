import { Store, Transitions } from '../src';

type State = {
    value: string;
};

type AppEvents = {
    set: (value: string) => void;
};

const transitions: Transitions<State, AppEvents> = {
    set: value => state => void (state.value = value),
};

describe('subscription', () => {
    test('single subscriber', () => {
        // given
        const store = new Store({ value: '' }, transitions);
        const sub = jest.fn();
        store.subscribe(sub);

        // when
        store.dispatch.set('foo');

        // then
        expect(sub).toBeCalledWith({ value: 'foo' });
    });

    test('multiple subscribers', () => {
        // given
        const store = new Store({ value: '' }, transitions);
        const sub1 = jest.fn();
        const sub2 = jest.fn();
        store.subscribe(sub1);
        store.subscribe(sub2);

        // when
        store.dispatch.set('foo');

        // then
        expect(sub1).toBeCalledWith({ value: 'foo' });
        expect(sub2).toBeCalledWith({ value: 'foo' });
    });
});