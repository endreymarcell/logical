# logical.ts

__Predictable and Expressive State Management for TypeScript__

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

// Describe the events that can happen - these are like redux 'actions'
// (these can take 0, 1, or more arguments, and should return void)
// and the state transitions that follow them
// (these look like: payload => state => { modify the state here, do not return anything })
const logic = createLogic<State>({
    increase: (amount: number) => state => void (state.count += amount),
    decrease: (amount: number) => state => void (state.count -= amount),
    reset: () => state => void (state.count = 0),
    multiplyThenAdd: (mult: number, add: number) => state => void (state.count = state.count * mult + add),
});
```

#### Usage
```typescript
// Create your store...
const store = new Store(initialState, logic);

// ...and subscribe to its changes...
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
    value: number;
    status: "initial" | "pending" | "error";
}

const initialState: State = {
    value: 0,
    status: "initial",
}

// Side effects can be triggered by returing them from transitions...
const logic = createLogic<State>({
    fetchValue: () => state => {
        state.status = "pending";
        return sideEffects.fetchValue();
    },
    success: (value: number) => state => {
        state.value = value;
        state.status = "initial";
    },
    failure: () => state => void (state.status = "error"),
});

// ...and need to be defined as functions that take 0, 1, or more arguments, return a Promise,
// and specify a success and a failure event to be triggered on resolution/rejection.
const sideEffects = createSideEffects(logic, {
    fetchValue: [
        () => fetch('https://www.randomnumberapi.com/api/v1.0/random/')
            .then(response => response.json())
            .then(results => results[0]),
        logic.success,
        logic.failure,
    ],
});
```

#### Usage

```typescript
const store = new Store(initialState, logic);
console.log(store.get().value);      // 0

await store.dispatch.fetchValue();   // you can await events if they trigger a side-effect
console.log(store.get().value);      // 42 if I am really lucky
```
