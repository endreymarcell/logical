import { createSideEffectInstance } from './sideEffects';

const noop = () => () => {};
const sum = (nums: Array<number>) => nums.reduce((a, b) => a + b, 0);

createSideEffectInstance: {
    // OK: empty case
    createSideEffectInstance<{}>()('name', [() => Promise.resolve(), noop, noop]);

    // OK: resolved value matches event payload
    createSideEffectInstance<{ count: number }>()('name', [
        () => Promise.resolve(99),
        value => state => void (state.count = value),
        () => () => {},
    ]);

    // OK: resolving with array
    createSideEffectInstance<{ count: number }>()('name', [
        () => Promise.resolve([1, 2, 3]),
        value => state => void (state.count = sum(value)),
        noop,
    ]);

    // Error: resolved value does not match event payload
    createSideEffectInstance<{ count: number }>()('name', [
        () => Promise.resolve('some text'),
        // @ts-expect-error
        value => state => void (state.count = value),
        noop,
    ]);

    // Error: resolving with void while event expects payload
    createSideEffectInstance<{ count: number }>()('name', [
        () => Promise.resolve(),
        // @ts-expect-error
        value => state => void (state.count = value),
        noop,
    ]);
}
