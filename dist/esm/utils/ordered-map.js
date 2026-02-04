export class OrderedMap {
    entries = [];
    entry_ids = new Set;
    insert(rank, value, id) {
        if (id && this.entry_ids.has(id))
            return false;
        const index = this.findInsertIndex(rank);
        this.entries.splice(index, 0, { rank, value, id });
        if (id)
            this.entry_ids.add(id);
        return true;
    }
    *[Symbol.iterator]() {
        for (const entry of this.entries) {
            yield entry.value;
        }
    }
    findInsertIndex(rank) {
        let low = 0;
        let high = this.entries.length;
        while (low < high) {
            const mid = (low + high) >>> 1;
            if (this.entries[mid].rank < rank) {
                low = mid + 1;
            }
            else {
                high = mid;
            }
        }
        return low;
    }
}
