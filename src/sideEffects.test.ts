import { createSideEffectInstanceCreator, createSideEffectInstanceCreators } from './sideEffects';

const noop = () => () => {};
const sum = (nums: Array<number>) => nums.reduce((a, b) => a + b, 0);

createSideEffectInstance: {
    // OK: empty case
    createSideEffectInstanceCreator<{}>()('name', [() => Promise.resolve(), noop, noop]);

    // OK: resolved value matches event payload
    createSideEffectInstanceCreator<{ count: number }>()('name', [
        () => Promise.resolve(99),
        value => state => void (state.count = value),
        () => () => {},
    ]);

    // OK: resolving with array
    createSideEffectInstanceCreator<{ count: number }>()('name', [
        () => Promise.resolve([1, 2, 3]),
        value => state => void (state.count = sum(value)),
        noop,
    ]);

    // Error: resolved value does not match event payload
    createSideEffectInstanceCreator<{ count: number }>()('name', [
        () => Promise.resolve('some text'),
        // @ts-expect-error
        value => state => void (state.count = value),
        noop,
    ]);

    // Error: resolving with void while event expects payload
    createSideEffectInstanceCreator<{ count: number }>()('name', [
        () => Promise.resolve(),
        // @ts-expect-error
        value => state => void (state.count = value),
        noop,
    ]);
}

sideEffectInstance: {
    // OK: no params
    const e1 = createSideEffectInstanceCreator<{}>()('name', [() => Promise.resolve(), noop, noop]);
    e1();

    // OK: matching param
    const e2 = createSideEffectInstanceCreator<{}>()('name', [
        (count: number) => Promise.resolve(count),
        noop,
        noop,
    ]);
    e2(99);

    // Error: non-matching param
    // @ts-expect-error
    e2('foobar');

    // Error: missing param
    // @ts-expect-error
    e2();
}

createSideEffects: {
    const e = createSideEffectInstanceCreators<{ count: number }>()({
        noParams: [() => Promise.resolve(), noop, noop],
        takesNumber: [(count: number) => Promise.resolve(count), noop, noop],
        takesString: [(text: string) => Promise.resolve(text), noop, noop],
    });

    // OK: calling no params
    e.noParams();

    // Error: trying to pass unexpected param
    // @ts-expect-error
    e.noParams(10);

    // OK: calling with number
    e.takesNumber(99);

    // OK: calling with string
    e.takesString('foo');

    // Error: calling with wrong type
    // @ts-expect-error
    e.takesNumber('string');

    // Error: omitting argument
    // @ts-expect-error
    e.takesNumber();

    // Error: too many arguments
    // @ts-expect-error
    e.takesNumber(1, 2, 3);

    // Error: no such side effect was created
    // @ts-expect-error
    e.noSuchProperty();
}
