type Entry<T> = {
    rank: number;
    value: T;
    id?: symbol;
}

export class OrderedMap<T> {
    private entries: Entry<T>[] = [];
    private entry_ids = new Set<symbol>;

    insert(rank: number, value: T, id?: symbol): boolean {
        if (id && this.entry_ids.has(id))
            return false;

        const index = this.findInsertIndex(rank);
        this.entries.splice(index, 0, { rank, value, id });

        if (id) this.entry_ids.add(id);

        return true;
    }

    *[Symbol.iterator](): IterableIterator<T> {
        for (const entry of this.entries) {
            yield entry.value;
        }
    }

    private findInsertIndex(rank: number): number {
        let low = 0;
        let high = this.entries.length;

        while (low < high) {
            const mid = (low + high) >>> 1;
            if (this.entries[mid].rank < rank) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }

        return low;
    }
}

