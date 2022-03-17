type Subscriber<T> = (value: T) => void;

export abstract class BaseStore<ValueType> {
    protected value: ValueType;
    protected subscribers: Subscriber<ValueType>[];

    protected constructor(initialValue: ValueType) {
        this.value = initialValue;
        this.subscribers = [];
    }

    get() {
        return this.value;
    }

    subscribe(subscriber: Subscriber<ValueType>) {
        this.addSubscriber(subscriber);
        subscriber(this.value);
        return () => this.removeSubscriber(subscriber);
    }

    protected broadcast() {
        this.subscribers.forEach(subscriber => subscriber(this.value));
    }

    private addSubscriber(subscriber: Subscriber<ValueType>) {
        this.subscribers.push(subscriber);
    }

    private removeSubscriber(subscriber: Subscriber<ValueType>) {
        const subscriberIndex = this.subscribers.findIndex(item => item === subscriber);
        if (subscriberIndex !== -1) {
            this.subscribers.splice(subscriberIndex, 1);
        }
    }
}
