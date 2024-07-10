import { resolveRoute } from "$app/paths";
import type RouteMetadata from "$lib/../../.svelte-kit/types/route_meta_data.json";
type RouteMetadata = typeof RouteMetadata;

// eslint-disable-next-line @typescript-eslint/ban-types
type Prettify<T> = { [K in keyof T]: T[K] } & {};
type ParseParam<T extends string> = T extends `...${infer Name}` ? Name : T;

type ParseParams<T extends string> = T extends `${infer A}[[${infer Param}]]${infer B}`
  ? ParseParams<A> & { [K in ParseParam<Param>]?: string } & ParseParams<B>
  : T extends `${infer A}[${infer Param}]${infer B}`
    ? ParseParams<A> & { [K in ParseParam<Param>]: string } & ParseParams<B>
    : // eslint-disable-next-line @typescript-eslint/ban-types
      {};

type RemoveGroups<T> = T extends `${infer A}/(${string})${infer B}` ? `${A}${RemoveGroups<B>}` : T;

export type RouteId = RemoveGroups<keyof RouteMetadata>;
// export type RouteId = keyof RouteMetadata;

export type Routes = {
  [K in RouteId]: Prettify<ParseParams<K>>;
};

type RouteParams<T extends RouteId> = Pick<Routes[T], RequiredKeys<Routes[T]>> &
  Partial<Pick<Routes[T], OptionalKeys<Routes[T]>>>;

type RequiredKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? never : K }[keyof T];
type OptionalKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? K : never }[keyof T];

type ExtraOptions = {
  $query?: Record<string, string | number | boolean>;
  $hash?: string;
};

type RouteOptions<T extends RouteId> = RouteParams<T> & ExtraOptions;

// Helper type to determine if options are required
type HasRequiredParams<T extends RouteId> = RequiredKeys<Routes[T]> extends never ? false : true;

// Overloaded function signatures
export function route<T extends RouteId>(routeId: T): string;
export function route<T extends RouteId>(
  routeId: T,
  options: HasRequiredParams<T> extends true ? RouteOptions<T> : RouteOptions<T> | ExtraOptions,
): string;

// Implementation
export function route<T extends RouteId>(
  routeId: T,
  options?: RouteOptions<T> | ExtraOptions,
): string {
  if (!options) {
    return resolveRoute(routeId, {});
  }

  const { $query, $hash, ...params } = options;

  // Use type assertion to ensure params matches what resolveRoute expects
  const path = resolveRoute(routeId, params as Record<string, string>);

  // @ts-expect-error allow for type casting in $query
  const search = $query && new URLSearchParams($query).toString();
  return path + (search ? `?${search}` : "") + ($hash ? `#${$hash}` : "");
}

export function match(pattern: RouteId, routeId: string): boolean {
  // Remove group prefixes from the routeId
  const cleanRouteId = routeId.replace(/\/\([^)]+\)/g, "");

  const patternParts = pattern.split("/").filter(Boolean);
  const routeParts = cleanRouteId.split("/").filter(Boolean);

  let patternIndex = 0;
  let routeIndex = 0;

  while (patternIndex < patternParts.length && routeIndex < routeParts.length) {
    const patternPart = patternParts[patternIndex];
    const routePart = routeParts[routeIndex];

    if (patternPart === "[...rest]") {
      patternIndex++;
      if (patternIndex === patternParts.length) return true;
      while (
        routeIndex < routeParts.length &&
        routeParts[routeIndex] !== patternParts[patternIndex]
      ) {
        routeIndex++;
      }
    } else if (patternPart.startsWith("[") && patternPart.endsWith("]")) {
      patternIndex++;
      routeIndex++;
    } else if (patternPart === routePart) {
      patternIndex++;
      routeIndex++;
    } else {
      return false;
    }
  }

  return patternIndex === patternParts.length && routeIndex === routeParts.length;
}

export function extractParams(pattern: RouteId, routeId: string): Record<string, string> | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const routeParts = routeId.split("/").filter(Boolean);
  const params: Record<string, string> = {};

  let patternIndex = 0;
  let routeIndex = 0;

  while (patternIndex < patternParts.length && routeIndex < routeParts.length) {
    const patternPart = patternParts[patternIndex];
    const routePart = routeParts[routeIndex];

    if (patternPart === "[...rest]") {
      const restParts = [];
      while (
        routeIndex < routeParts.length &&
        (patternIndex === patternParts.length - 1 ||
          routeParts[routeIndex] !== patternParts[patternIndex + 1])
      ) {
        restParts.push(routeParts[routeIndex++]);
      }
      params["rest"] = restParts.join("/");
      patternIndex++;
    } else if (patternPart.startsWith("[") && patternPart.endsWith("]")) {
      params[patternPart.slice(1, -1)] = routePart;
      patternIndex++;
      routeIndex++;
    } else if (patternPart === routePart) {
      patternIndex++;
      routeIndex++;
    } else {
      return null;
    }
  }

  return patternIndex === patternParts.length && routeIndex === routeParts.length ? params : null;
}
