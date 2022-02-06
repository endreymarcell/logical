# logical.ts

logical.ts is a state management library written in TypeScript in which I try to collect the good ideas I've seen in codebases and reproduce only few of the bad ones.  

The basic pattern is based on [redux](https://redux.js.org/) with [Immer](https://immerjs.github.io/immer/) (so like the [redux-toolkit](https://redux-toolkit.js.org/)). Side-effects mostly resemble [redux-loop](https://redux-loop.js.org/), itself based on [Elm](https://elm-lang.org/), but with a custom layer of helpers originally authored by [@laszlopandy](https://github.com/laszlopandy) (not released publicly). 

⚠️ This is as WIP as it gets, don't even think about using it in production!

## Usage

### Simple state transitions

#### Definitions

```typescript
// Define the shape of your application state...
type State = {
    count: number;
}
// ...along with your initial state.
const initialState: State = {
    count: 0,
}

// Describe the events that can happen - these are like redux 'actions'...
// (these can take 0, 1, or more arguments, and should return void)
type AppEvents = {
    increase: (amount: number) => void;
    decrease: (amount: number) => void;
    reset: () => void;
    multiplyThenAdd: (mult: number, add: number) => void;
};

// ...and the state transitions that follows them.
// (These look like: payload => state => <modify the state here, do not return anything>)
const transitions: Transitions<State, AppEvents> = {
    increase: amount => state => void (state.count += amount),
    decrease: amount => state => void (state.count -= amount),
    reset: () => state => void (state.count = 0),
    multiplyThenAdd: (mult, add) => state => void (state.count = state.count * mult + add),
};
```

#### Usage
```typescript
// Create your store...
const store = new Store(initialState, transactions);

// ...and subscribe to its changed...
store.subscribe(newValue => console.log(`The latest store value is ${newValue}`));

// ...or grab the contents directly.
console.log(`The value of the store is: ${store.get()}`);

// Dispatch events by calling them on the store's synthetic `dispatch` object:
store.dispatch.increase(10);
console.log(store.get().count);    // 10

store.dispatch.decrease(3);
console.log(store.get().count);    // 7

store.dispatch.multiplyThenAdd(3, 5);
console.log(store.get().count);    // 26

store.dispatch.reset();
console.log(store.get().count);    // 0
```

### Side effects

#### Definitions

```typescript
// Define your state as usual
type State = {
    value: string;
}

const initialState: State = {
    value: "initial",
}

// Side effects can be triggered by returing them from transitions...
type AppEvents = {
    setValuePurely: (value: string) => void;
    setValueWithSideEffect: (value: string) => any;    // TODO
    onlySideEffect: (value: string) => any;    // TODO
    noop: () => void;
};

const transitions: Transitions<State, AppEvents> = {
    setValuePurely: value => state => void (state.value = value),
    setValueWithSideEffect: value => state => {
        state.value = value;
        return sideEffects.consoleLogFoo();
    },
    onlySideEffect: () => () => sideEffects.consoleLogFoo(),
    zero: () => () => {},
};

// ...and need to be defined as functions that take 0, 1, or more arguments, return a promise,
// and specify a success and a failure event to be triggered on resolution/rejection.
const sideEffects = {
    consoleLogFoo: createSideEffect<[], void, AppEvents>(
        'consoleLogFoo',
        () => Promise.resolve(),
        transitions.zero,
        transitions.zero,
    ),
};
```

#### Usage

The same, really
