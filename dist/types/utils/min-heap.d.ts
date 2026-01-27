export declare class MinHeap<T> {
    private heap;
    get size(): number;
    insert(value: T, priority: number): void;
    extractMin(): T | null;
    private bubbleUp;
    private bubbleDown;
}
//# sourceMappingURL=min-heap.d.ts.map