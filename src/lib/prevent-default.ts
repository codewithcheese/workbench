export function preventDefault(fn: any) {
  return function (event: any) {
    event.preventDefault();
    // @ts-expect-error TS2683: this implicitly has type any because it does not have a type annotation.
    fn.call(this as any, event);
  };
}
