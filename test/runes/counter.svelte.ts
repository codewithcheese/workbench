export class Counter {
  count = $state(0);
  doubleCount = $derived(this.count * 2);

  constructor(initial: number = 0) {
    this.count = initial;
  }

  increment() {
    this.count++;
  }

  decrement() {
    this.count--;
  }
}
