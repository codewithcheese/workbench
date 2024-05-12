export type View<T extends (...args: any) => any> = RemoveUndefined<Awaited<ReturnType<T>>>;

export type RemoveUndefined<T> = T extends undefined ? never : T;

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
