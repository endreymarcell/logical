import { createTransition, createTransitions, OpaqueSideEffectType } from './transitions';

createTransition: {
    // OK: everything is empty
    createTransition<{}>()(() => () => {});

    // OK: no payload, hard-coded value matches field
    createTransition<{ value: string }>()(() => state => void (state.value = 'hard-coded'));

    // OK: payload matches field
    createTransition<{ value: string }>()((newValue: string) => state => void (state.value = newValue));

    // Error: trying to assign to undefined field
    // @ts-expect-error
    createTransition<{ value: string }>()((newValue: string) => state => void (state.noSuchField = newValue));

    // Error: assigning number payload to string field
    // @ts-expect-error
    createTransition<{ value: string }>()((newValue: number) => state => void (state.value = newValue));

    // Error: non-void return type
    // @ts-expect-error
    createTransition<{ value: string }>()((newValue: string) => state => (state.value = newValue));
}

createTransitions: {
    // OK: everything is empty
    createTransitions<{}>()({});

    // OK: accessing existing properties with the correct payloads
    const t1 = createTransitions<{ count: number }>()({
        plus: (amount: number) => state => void (state.count += amount),
        reset: () => state => void (state.count = 0),
    });
    t1.plus(10);
    t1.reset();

    // Error: accessing non-existent property
    // @ts-expect-error
    t1.noSuchProperty();

    // Error: missing argument
    // @ts-expect-error
    t1.plus();

    // Error: wrong number of arguments
    // @ts-expect-error
    t1.plus(1, 2);

    // Error: wrong argument type
    // @ts-expect-error
    t1.plus('foobar');
}

createTransitionsWithoutHelper: {
    // OK: accessing existing properties with the correct payloads
    const t2 = {
        plus: createTransition<{ count: number }>()(
            (amount: number) => state => void (state.count += amount),
        ),
        reset: createTransition<{ count: number }>()(() => state => void (state.count = 0)),
    };
    t2.plus(10);
    t2.reset();

    // Error: accessing non-existent property
    // @ts-expect-error
    t2.noSuchProperty();

    // Error: missing argument
    // @ts-expect-error
    t2.plus();

    // Error: wrong number of arguments
    // @ts-expect-error
    t2.plus(1, 2);

    // Error: wrong argument type
    // @ts-expect-error
    t2.plus('foobar');
}

opaqueSideEffectType: {
    const s1: OpaqueSideEffectType<{}> = {
        name: 'effect',
        args: [],
        blueprint: [() => Promise.resolve([]), () => () => {}, () => () => {}],
    };

    // OK: returning something that matches an OpaqueSideEffect
    createTransition<{}>()(() => () => s1);

    // Error: returning something that does not match an OpaqueSideEffect
    // TODO: can I make it return a more helpful error message though?
    // @ts-expect-error
    createTransition<{}>()(() => () => 'foobar');
}
