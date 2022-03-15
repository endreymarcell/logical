# logical

**Predictable yet Expressive State Management for TypeScript Applications**

⚠️ logical is in ALPHA stage, use at your own risk.

## Docs

First, define what your application state looks like.

```typescript
type State = {
    count: number;
};

const initialState: State = {
    count: 0,
};
```

Then, list all the events that can happen in your app, and how they change the state.  
(If you're coming from redux, these are your actions and your reducer in one.)

```typescript
const logic = createLogic<State>()({
    increase: (amount: number) => state => void (state.count += amount),
    decrease: (amount: number) => state => void (state.count -= amount),
    reset: () => state => void (state.count = 0),
    multiplyThenAdd: (mult: number, add: number) => state => void (state.count = state.count * mult + add),
});
```

<details>
<summary>Why the deal with the `void` prefix?</summary>
It ensures that the assignment following it does not return a value. You could also wrap the assignment in curly braces if you prefer:

```typescript
const logic = createLogic<State>()({
    increase: (amount: number) => state => {
        state.count += amount;
    },
    // ...
});
```

</details>
<br/>

<details>
<summary>Why the double parentheses?</summary>
That's the only way I could get TypeScript to properly infer but not constrain the type you're passing to `createLogic()` here (ie. 'partial type argument inference'). See https://stackoverflow.com/questions/62490272/how-can-i-have-typescript-infer-the-value-for-a-constrained-generic-type-when-sp for example.
</details>
<br/>

Finally, create your store and start dispatching events.

```typescript
const store = new Store<State>(initialState);
const dispatcher = store.getDispatcher()(logic);

dispatcher.increase(10);
console.log(store.get().count); // 10

dispatcher.decrease(3);
console.log(store.get().count); // 7

dispatcher.multiplyThenAdd(3, 5);
console.log(store.get().count); // 26

dispatcher.reset();
console.log(store.get().count); // 0
```

Of course, you can also subscribe to the store's changes:

```typescript
store.subscribe(newValue => console.log(`The latest store value is ${newValue}`));
```

This also means you can use it as a Svelte store:

```html
<script lang="ts">
    import { store } from './app.ts';
</script>

<div>The current count is: {$store.count}</div>
```

**What about side effects?** ⚡️

Right. Remember how you weren't supposed to return anything in your logic's event handlers? That's because with `logical`, that is reserved for side effects!

First, define your state as usual:

```typescript
type State = {
    value: number;
    status: 'initial' | 'pending' | 'finished' | `failed: ${string}`;
};

const initialState: State = {
    value: 0,
    status: 'initial',
};
```

Then describe your side effects, along with their success and failure event handlers:

```typescript
const sideEffects = createSideEffects<State>()({
    // Each side effect consists of...
    fetchRandomNumber: [
        // a function returning a promise,
        () =>
            fetch('https://www.randomnumberapi.com/api/v1.0/random/')
                .then(response => response.json())
                .then(results => results[0]),

        // a success event handler,
        randomNumber => state => {
            state.value = randomNumber;
            state.status = 'finished';
        },

        // and a failure event handler.
        exception => state => void (state.status = `failed: ${exception.message}`),
    ],
});
```

You can trigger the side effect by returning it from an event handler:

```typescript
const logic = createLogic<State>()({
    onButtonClicked: () => state => {
        state.status = 'pending';
        return sideEffects.fetchRandomNumber();
    },
});
```

Make sure to pass your side effects to `getDispatcher()`:

```typescript
const dispatcher = store.getDispatcher()(logic, sideEffects);
button.addEventListener('click', () => dispatcher.onButtonClicked());
```

You can even await the dispatching of events that run side effects:

```typescript
const store = new Store(initialState);
console.log(store.get().value); // 0

const dispatcher = store.getDispatcher()(logic, sideEffects);

await dispatcher.onButtonClicked();
console.log(store.get().value); // 42 if I am really lucky
```
