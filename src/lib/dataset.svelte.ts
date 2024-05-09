export class Dataset<Item extends { id: string }> {
  name: string;
  #data: Item[] = $state([]);
  #lookup: Record<string, number> = {};
  // #foreignKeys: string[] = [];
  // // lookup to get item by foreign key
  // #foreign: Record<string, Record<string, number>> = {};

  constructor(name: string, data = [], foreignKeys: string[] = []) {
    this.name = name;
    this.#data.push(...data);
    this.#lookup = this.#data.reduce<Record<string, number>>((acc, item, index) => {
      acc[item.id] = index;
      return acc;
    }, {});
    // this.#foreignKeys = foreignKeys;
    // foreignKeys.forEach((key) => {
    //   this.#foreign[key] = this.#data.reduce<Record<string, number>>((acc, item, index) => {
    //     acc[item[key]] = index;
    //     return acc;
    //   }, {});
    // });
    $effect.root(() => {
      $effect(() => this.save());
    });
  }

  push(item: Item) {
    if (!item.id) {
      item.id = crypto.randomUUID();
    }
    const state = $state(item);
    const length = this.#data.push(state);
    this.#lookup[item.id] = length - 1;
  }

  remove(id: string) {
    const index = this.#lookup[id];
    this.#data.splice(index, 1);
    delete this.#lookup[id];
    const lookup = this.#lookup;
    Object.keys(lookup).forEach((key) => {
      if (lookup[key] > index) {
        lookup[key]--;
      }
    });
  }

  get(id: string) {
    const index = this.#lookup[id];
    return this.#data[index];
  }

  filter(predicate: (item: Item) => boolean) {
    return this.#data.filter(predicate);
  }

  get items() {
    return this.#data;
  }

  get length() {
    return this.#data.length;
  }

  [Symbol.iterator]() {
    let index = 0;
    const data = this.#data;

    return {
      next(): { value: Item; done: false } | { done: true; value: any } {
        if (index < data.length) {
          return { value: data[index++], done: false };
        } else {
          return { done: true, value: undefined };
        }
      },
    };
  }

  toJSON() {
    return this.#data;
  }

  static load<Item extends { id: string }>(name: string, defaultItems: Item[] = []) {
    const json = localStorage.getItem(name);
    return new Dataset<Item>(name, json ? JSON.parse(json) : defaultItems);
  }

  save() {
    localStorage.setItem(this.name, JSON.stringify($state.snapshot(this.#data)));
  }
}
