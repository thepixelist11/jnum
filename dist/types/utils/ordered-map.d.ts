export declare class OrderedMap<T> {
    private entries;
    private entry_ids;
    insert(rank: number, value: T, id?: symbol): boolean;
    [Symbol.iterator](): IterableIterator<T>;
    private findInsertIndex;
}
//# sourceMappingURL=ordered-map.d.ts.map