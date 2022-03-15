import { createTransitions } from '../../src/transitions';
import { Store } from '../../src/Store';

initialStateMatching: {
    // OK: empty
    new Store<{}>({});

    // OK: initial state matches state type
    new Store<{ count: number }>({ count: 0 });

    // Error: initial state is missing properties
    // @ts-expect-error
    new Store<{ count: number }>({});

    // Error: initial state specifies property not present on the state type
    // // @ts-expect-error
    new Store<{}>({ count: 0 });
    // TODO apparently superfluous properties are not causing errors
}

stateTypeMatching: {
    // OK: matching state type
    {
        const s = new Store<{ count: number }>({ count: 0 });
        const t = createTransitions<{ count: number }>()({});
        s.getDispatcher()(t);
    }

    // Error: wrong property type
    {
        const s = new Store<{ count: string }>({ count: 'zero' });
        const t = createTransitions<{ count: number }>()({
            plus: (amount: number) => state => void (state.count += amount),
        });
        // @ts-expect-error
        s.getDispatcher()(t);
    }

    // Error: transition has a property that is missing from the store's state
    {
        const s = new Store<{}>({});
        const t = createTransitions<{ count: number }>()({
            plus: (amount: number) => state => void (state.count += amount),
        });
        // @ts-expect-error
        s.getDispatcher()(t);
    }

    // Error: the store's state has a property that's missing from the transition
    {
        const s = new Store<{ count: number }>({ count: 0 });
        const t = createTransitions<{}>()({
            plus: () => state => {
                console.log({ state });
            },
        });
        // // @ts-expect-error
        s.getDispatcher()(t);
        // TODO do I need to make this one fail?
    }

    // Error: the store and the transition have a different property each
    {
        const s = new Store<{ count: number }>({ count: 0 });
        const t = createTransitions<{ value: string }>()({
            set: (newValue: string) => state => void (state.value = newValue),
        });
        // @ts-expect-error
        s.getDispatcher()(t);
    }
}

dispatchType: {
    const s = new Store<{ count: number }>({ count: 0 });
    const t = createTransitions<{ count: number }>()({
        plus: (amount: number) => state => void (state.count += amount),
        reset: () => state => void (state.count = 0),
    });
    const d = s.getDispatcher()(t);

    // OK: no payload
    d.reset();

    // OK: correct payload type
    d.plus(10);

    // Error: superfluous argument passed
    // @ts-expect-error
    d.reset(10);

    // Error: missing argument
    // @ts-expect-error
    d.plus();

    // Error: wrong number of arguments
    // @ts-expect-error
    d.plus(1, 2, 3);

    // Error: wrong argument type
    // @ts-expect-error
    d.plus('expecting a number');
}
