export class MinHeap {
    heap = [];
    get size() { return this.heap.length; }
    insert(value, priority) {
        this.heap.push({ value, priority });
        this.bubbleUp(this.heap.length - 1);
    }
    extractMin() {
        if (!this.size)
            return null;
        const min = this.heap[0].value;
        const end = this.heap.pop();
        if (this.heap.length) {
            this.heap[0] = end;
            this.bubbleDown(0);
        }
        return min;
    }
    bubbleUp(idx) {
        const element = this.heap[idx];
        while (idx > 0) {
            const parent_idx = Math.floor((idx - 1) / 2);
            const parent = this.heap[parent_idx];
            if (element.priority >= parent.priority)
                break;
            this.heap[idx] = parent;
            idx = parent_idx;
        }
        this.heap[idx] = element;
    }
    bubbleDown(idx) {
        const length = this.size;
        const element = this.heap[idx];
        while (true) {
            const left_idx = 2 * idx + 1;
            const right_idx = 2 * idx + 2;
            let swap = null;
            if (left_idx < length &&
                this.heap[left_idx].priority < element.priority)
                swap = left_idx;
            if (right_idx < length &&
                this.heap[right_idx].priority < (swap === null ? element.priority : this.heap[left_idx].priority))
                swap = right_idx;
            if (swap === null)
                break;
            this.heap[idx] = this.heap[swap];
            idx = swap;
        }
        this.heap[idx] = element;
    }
}
