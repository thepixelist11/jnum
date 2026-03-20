export function has<T extends PropertyKey>(
    obj: object,
    key: T,
): obj is object & Record<T, unknown> {
    return Object.hasOwn(obj, key);
}
