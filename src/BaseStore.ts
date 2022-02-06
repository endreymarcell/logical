type Subscriber<T> = (value: T) => void;

export abstract class BaseStore<ValueType> {
    protected value: ValueType;
    protected subscribers: Subscriber<ValueType>[];

    constructor(initialValue: ValueType) {
        this.value = initialValue;
        this.subscribers = [];
    }

    get() {
        return this.value;
    }

    subscribe(subscriber: Subscriber<ValueType>) {
        this.subscribers.push(subscriber);
        subscriber(this.value);
    }

    protected broadcast() {
        this.subscribers.forEach(subscriber => subscriber(this.value));
    }
}
