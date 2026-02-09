export const JIT_ITERS = 1000;
export const TIMER_FN: "process.hrtime.bigint()" | "performance.now()" = "process.hrtime.bigint()";

const now = TIMER_FN === "process.hrtime.bigint()" ? process.hrtime.bigint : () => BigInt(performance.now());

export function ns(start: bigint, end: bigint): number {
    return Number(end - start);
}

export type Benchmark<N extends 0 | 1 | 2 | 3 | 4 = 0 | 1 | 2 | 3 | 4> = {
    name: string;
    iters: number;
    repeat_full_test: number;
    setup?: () => unknown[] | void;
    run: N extends 0 ? () => void
    : N extends 1 ? (a0: unknown) => void
    : N extends 2 ? (a0: unknown, a1: unknown) => void
    : N extends 3 ? (a0: unknown, a1: unknown, a2: unknown) => void
    : N extends 4 ? (a0: unknown, a1: unknown, a2: unknown, a3: unknown) => void
    : never;
    baseline?: N extends 0 ? () => void
    : N extends 1 ? (a0: unknown) => void
    : N extends 2 ? (a0: unknown, a1: unknown) => void
    : N extends 3 ? (a0: unknown, a1: unknown, a2: unknown) => void
    : N extends 4 ? (a0: unknown, a1: unknown, a2: unknown, a3: unknown) => void
    : never;
    teardown?: () => void;
}

export interface BenchmarkResult {
    name: string;
    total: number;
    avg: number;
    iters: number;
    runs: number;
    delta: number;
    min: number;
    p25: number;
    p75: number;
    p95: number;
    max: number;
    rcv: number;
    ops: number;
}

export function runBenchmark<N extends 0 | 1 | 2 | 3 | 4>(b: Benchmark<N>): BenchmarkResult {
    const times: number[] = [];

    for (let i = 0; i < b.repeat_full_test; i++) {

        /* ============= SETUP =============== */

        let args: unknown[] = [];
        if (b.setup)
            args = b.setup() ?? [];

        const arity = args.length;

        if (arity !== (b.run as Function).length) {
            throw new Error(
                `Arity mismatch: run expects ${((b.run as Function).length)} arguments, got ${arity} (${b.name})`
            );
        }

        // The duplicated switch statement is necessary to ensure separate call sites
        // for V8. TurboFan will optimize these independently to avoid introducing
        // an extra call boundary or polymorphism, which would prevent stable inlining.
        // For nanosecond-scale measurements, this can make a measurable difference.

        /* ============ WARM_UP ============== */

        switch (arity) {
            case 0: { const fn = b.run as () => void; for (let i = 0; i < JIT_ITERS; i++) fn(); break; }
            case 1: { const fn = b.run as (a0: unknown) => void; const [a0] = args; for (let i = 0; i < JIT_ITERS; i++) fn(a0); break; }
            case 2: { const fn = b.run as (a0: unknown, a1: unknown) => void; const [a0, a1] = args; for (let i = 0; i < JIT_ITERS; i++) fn(a0, a1); break; }
            case 3: { const fn = b.run as (a0: unknown, a1: unknown, a2: unknown) => void; const [a0, a1, a2] = args; for (let i = 0; i < JIT_ITERS; i++) fn(a0, a1, a2); break; }
            case 4: { const fn = b.run as (a0: unknown, a1: unknown, a2: unknown, a3: unknown) => void; const [a0, a1, a2, a3] = args; for (let i = 0; i < JIT_ITERS; i++) fn(a0, a1, a2, a3); break; }
            default: throw new Error("Unsupported arity");
        }

        /* ============= TIMED =============== */

        const t0 = now();
        switch (arity) {
            case 0: { const fn = b.run as () => void; for (let i = 0; i < b.iters; i++) fn(); break; }
            case 1: { const fn = b.run as (a0: unknown) => void; const [a0] = args; for (let i = 0; i < b.iters; i++) fn(a0); break; }
            case 2: { const fn = b.run as (a0: unknown, a1: unknown) => void; const [a0, a1] = args; for (let i = 0; i < b.iters; i++) fn(a0, a1); break; }
            case 3: { const fn = b.run as (a0: unknown, a1: unknown, a2: unknown) => void; const [a0, a1, a2] = args; for (let i = 0; i < b.iters; i++) fn(a0, a1, a2); break; }
            case 4: { const fn = b.run as (a0: unknown, a1: unknown, a2: unknown, a3: unknown) => void; const [a0, a1, a2, a3] = args; for (let i = 0; i < b.iters; i++) fn(a0, a1, a2, a3); break; }
            default: throw new Error("Unsupported arity");
        }
        const t1 = now();

        /* ============ TEARDOWN ============= */

        if (b.teardown) b.teardown();

        times.push(ns(t0, t1));
    }

    times.sort((a, b) => a - b);

    const median = times[Math.floor(times.length / 2)];
    const abs_devs = times.map(t => Math.abs(t - median)).sort((a, b) => a - b);
    const mad = abs_devs[Math.floor(abs_devs.length / 2)];

    const min = times[0];
    const p25 = times[Math.floor(times.length * 0.25)];
    const p75 = times[Math.floor(times.length * 0.75)];
    const p95 = times[Math.floor(times.length * 0.95)];
    const max = times[times.length - 1];

    const rcv = mad / median;

    const avg = Math.max(0, median / b.iters);
    const delta = Math.max(0, mad / b.iters);
    const min_iter = Math.max(0, min / b.iters);
    const p25_iter = Math.max(0, p25 / b.iters);
    const p75_iter = Math.max(0, p75 / b.iters);
    const p95_iter = Math.max(0, p95 / b.iters);
    const max_iter = Math.max(0, max / b.iters);

    return {
        name: b.name,
        total: times.reduce((a, b) => a + b, 0),
        iters: b.iters * times.length,
        runs: b.repeat_full_test,
        avg,
        delta,
        min: min_iter,
        p25: p25_iter,
        p75: p75_iter,
        p95: p95_iter,
        max: max_iter,
        rcv,
        ops: Math.floor(1e9 / Math.max(1, avg)),
    };
}

function formatNanoseconds(ns: number): string {
    if (!Number.isFinite(ns))
        throw new Error("Input must be a finite number");

    const abs = Math.abs(ns);

    if (abs < 1_000) {
        return `${ns.toFixed(3)} ns`;
    }

    if (abs < 1_000_000) {
        return `${(ns / 1_000).toFixed(3)} µs`;
    }

    if (abs < 1_000_000_000) {
        return `${(ns / 1_000_000).toFixed(3)} ms`;
    }

    return `${(ns / 1_000_000_000).toFixed(3)} s`;
}

function formatLargeInt(num: number): string {
    if (!Number.isFinite(num))
        throw new Error("Input must be a finite number");

    const abs = Math.abs(num);

    if (abs < 1_000) {
        return `${num.toFixed(3)}`;
    }

    if (abs < 1_000_000) {
        return `${(num / 1_000).toFixed(3)} K`;
    }

    if (abs < 1_000_000_000) {
        return `${(num / 1_000_000).toFixed(3)} M`;
    }

    return `${(num / 1_000_000_000).toFixed(3)} B`;
}

export function printResult(result: BenchmarkResult, baseline?: BenchmarkResult) {
    process.stdout.write(`=== ${result.name}\n`);
    process.stdout.write(` median     : ${formatNanoseconds(result.avg)}\n`);

    if (baseline) {
        const corrected = Math.max(0, result.avg - baseline.avg);
        process.stdout.write(` median_cor : ${formatNanoseconds(corrected)}\n`);
    }

    process.stdout.write(` delta      : ${formatNanoseconds(result.delta)}\n`);
    process.stdout.write(` total      : ${formatNanoseconds(result.total)}\n`);
    process.stdout.write(` iters      : ${result.iters}\n`);
    process.stdout.write(` runs       : ${result.runs}\n`);
    process.stdout.write(` ops/sec    : ${formatLargeInt(result.ops)}\n`);

    if (baseline)
        process.stdout.write(` baseline   : ${formatNanoseconds(baseline.avg)}\n`);

    process.stdout.write(`---\n`);
    process.stdout.write(` min        : ${formatNanoseconds(result.min)}\n`);
    process.stdout.write(` p25        : ${formatNanoseconds(result.p25)}\n`);
    process.stdout.write(` p75        : ${formatNanoseconds(result.p75)}\n`);
    process.stdout.write(` p95        : ${formatNanoseconds(result.p95)}\n`);
    process.stdout.write(` max        : ${formatNanoseconds(result.max)}\n`);
    process.stdout.write(` rcv        : ${(result.rcv * 100).toFixed(2)}%\n`);
    process.stdout.write("\n");
}

export function runSuite(tests: Benchmark[]) {
    for (const t of tests) {
        let baseline_result: BenchmarkResult | undefined = undefined;

        if (t.baseline) {
            baseline_result = runBenchmark({
                ...t,
                name: `${t.name} (baseline)`,
                run: t.baseline,
                baseline: undefined,
            });
        }

        const result = runBenchmark(t);
        printResult(result, baseline_result);
    }
}
