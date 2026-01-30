import { _JNum, JNumType } from "jnum-base";
import { NaNNum, NaNNumType } from "numerics/nan";
import { InfinityNum, InfinityNumType } from "numerics/infinity";
import { MinHeap } from "utils/min-heap";
import { OrderedMap } from "utils/ordered-map";

/* ============== TYPES ============== */

export interface RegisteredType {
    id: JNumType;
    name?: string;
    exact?: boolean;
    integer?: boolean;
};

const TYPES = new Map<JNumType, RegisteredType>();

export function registerType(t: RegisteredType): void {
    TYPES.set(t.id, t);

    invalidatePromotionCache();
    invalidateReachableCache();

    ensureNaNPromotionsForType(t.id);

    if (t.id === NaNNumType) {
        for (const other of TYPES.keys()) {
            ensureNaNPromotionsForType(other);
        }
    }
}

/* ======== UNARY OPERATIONS ========= */

export type UnaryOpKernel<T extends _JNum = _JNum, R = unknown> =
    (arg: T) => R;

type ErasedUnaryOpKernel = UnaryOpKernel<_JNum, unknown>;

const UNARY_OPS = new Map<
    Operation,
    Map<JNumType, UnaryOpKernel>
>();

export function registerUnaryOp<T extends _JNum = _JNum, R = _JNum>(
    op: Operation,
    type: JNumType,
    kernel: UnaryOpKernel<T, R>
): void {
    let map = UNARY_OPS.get(op);
    if (!map) {
        map = new Map();
        UNARY_OPS.set(op, map);
    }

    map.set(type, kernel as ErasedUnaryOpKernel);
    __update_JNum_registered_op_keys();
}

export function dispatchUnaryOp<R = _JNum>(
    op: Operation,
    arg: _JNum
): R {
    const map = UNARY_OPS.get(op);
    if (!map)
        throw new Error(`Operation ${op} not defined`);

    const direct = map.get(arg.type);
    if (direct)
        return direct(arg) as R;

    let best:
        | { cost: number; kernel: UnaryOpKernel; path: PromotionRule[] }
        | null = null;

    for (const [target_type, kernel] of map) {
        const pc = promotionCostAndPath(arg.type, target_type);
        if (!pc) continue;

        if (!best || pc.cost < best.cost)
            best = { cost: pc.cost, kernel, path: pc.path };
    }

    if (!best)
        throw new Error(`Operation ${op} not defined for ${arg.type.description}`);

    let v = arg;
    for (const r of best.path)
        v = r.apply(v);

    return best.kernel(v) as R;
}

/* ======= BINARY OPERATIONS ========= */

export type Operation = string;

export type BinaryOpKernel<LHS extends _JNum = _JNum, RHS extends _JNum = _JNum, R = _JNum> =
    (lhs: LHS, rhs: RHS) => R;

const BINARY_OPS = new Map<
    Operation,
    Map<JNumType, Map<JNumType, ErasedBinaryOpKernel>>
>();

type ErasedBinaryOpKernel = (lhs: _JNum, rhs: _JNum) => unknown;

export function allBinaryOperations(): Iterable<Operation> {
    return BINARY_OPS.keys();
}

export function allOperations(): Iterable<Operation> {
    return [...BINARY_OPS.keys(), ...UNARY_OPS.keys(), ...NARY_OPS.keys()];
}

function ensureNaNPromotionsForType(t: JNumType): void {
    if (t === NaNNumType) return;

    registerPromotion({
        from: t,
        to: NaNNumType,
        cost: 1,
        apply: () => NaNNum.create(),
    });
}

export function registerBinaryOp<
    LHS extends _JNum,
    RHS extends _JNum,
    R,
>(
    op: Operation,
    lhs: JNumType,
    rhs: JNumType,
    kernel: BinaryOpKernel<LHS, RHS, R>
): void {
    const is_new_op = !BINARY_OPS.has(op);

    let lhs_map = BINARY_OPS.get(op);
    if (!lhs_map) {
        lhs_map = new Map();
        BINARY_OPS.set(op, lhs_map);
    }

    let rhs_map = lhs_map.get(lhs);
    if (!rhs_map) {
        rhs_map = new Map();
        lhs_map.set(lhs, rhs_map);
    }

    rhs_map.set(rhs, kernel as ErasedBinaryOpKernel);
    invalidateDispatchTable();

    if (is_new_op) {
        registerBinaryOp(op, NaNNumType, NaNNumType, NaNNum.create);

        for (const t of TYPES.keys()) {
            if (t !== NaNNumType) {
                registerBinaryOpCommutative(op, NaNNumType, t, NaNNum.create);
            }
        }
    }
}

export function registerBinaryOpCommutative<
    LHS extends _JNum,
    RHS extends _JNum,
    R
>(
    op: Operation,
    lhs: JNumType,
    rhs: JNumType,
    kernel: BinaryOpKernel<LHS | RHS, RHS | LHS, R>
) {
    registerBinaryOp<LHS, RHS, R>(op, lhs, rhs, kernel);
    if (lhs !== rhs)
        registerBinaryOp<RHS, LHS, R>(op, rhs, lhs, kernel);
}

export function getBinaryOp(
    op: Operation,
    lhs: JNumType,
    rhs: JNumType
): ErasedBinaryOpKernel | null {
    return BINARY_OPS.get(op)?.get(lhs)?.get(rhs) ?? null;
}

interface DispatchPlan {
    kernel: ErasedBinaryOpKernel;
    lhs_fn: (v: _JNum) => _JNum;
    rhs_fn: (v: _JNum) => _JNum;
    lhs_target: JNumType;
    rhs_target: JNumType;
};

function promotionCostAndPath(
    from: JNumType,
    to: JNumType
): { cost: number; path: PromotionRule[] } | null {
    if (from === to) return { cost: 0, path: [] };
    const inner = PRECOMPUTED_PROMOTION_PATHS.get(from);
    const pc = inner?.get(to) ?? null;
    return pc;
}

function resolveDispatchPlan(
    op: Operation,
    lhs_type: JNumType,
    rhs_type: JNumType,
): DispatchPlan | null {
    let best: {
        cost: number;
        kernel: ErasedBinaryOpKernel;
        lhs_path: PromotionRule[];
        rhs_path: PromotionRule[];
        lhs_target: JNumType;
        rhs_target: JNumType;
    } | null = null;

    if (!__promotion_paths_precomputed)
        precomputePromotionPaths();

    const lhs_targets = reachableTypes(lhs_type);
    const rhs_targets = reachableTypes(rhs_type);

    for (const lt of lhs_targets) {
        const lhs_pc = promotionCostAndPath(lhs_type, lt);
        if (!lhs_pc) continue;

        for (const rt of rhs_targets) {
            const rhs_pc = promotionCostAndPath(rhs_type, rt);
            if (!rhs_pc) continue;

            const kernel = getBinaryOp(op, lt, rt);
            if (!kernel) continue;

            const total_cost = lhs_pc.cost + rhs_pc.cost;

            if (!best || total_cost < best.cost) {
                best = {
                    cost: total_cost,
                    kernel,
                    lhs_path: lhs_pc.path,
                    rhs_path: rhs_pc.path,
                    lhs_target: lt,
                    rhs_target: rt,
                };
            }
        }
    }

    if (!best) return null;

    function composePromotion(rules: PromotionRule[]): (v: _JNum) => _JNum {
        if (!rules.length) return v => v;
        return v => rules.reduce((acc, r) => r.apply(acc), v);
    }

    const lhs_promo_fn = composePromotion(best.lhs_path);
    const rhs_promo_fn = composePromotion(best.rhs_path);

    return {
        kernel: best.kernel,
        lhs_fn: lhs_promo_fn,
        rhs_fn: rhs_promo_fn,
        lhs_target: best.lhs_target,
        rhs_target: best.rhs_target,
    };
}

const DISPATCH_CACHE = new Map<
    Operation,
    Map<JNumType, Map<JNumType, DispatchPlan>>
>();

export function dispatchBinaryOp<R = _JNum>(
    op: Operation,
    lhs: _JNum,
    rhs: _JNum,
): R {
    let lhs_map = DISPATCH_CACHE.get(op);
    if (!lhs_map) {
        lhs_map = new Map();
        DISPATCH_CACHE.set(op, lhs_map);
    }

    let rhs_map = lhs_map.get(lhs.type);
    if (!rhs_map) {
        rhs_map = new Map();
        lhs_map.set(lhs.type, rhs_map);
    }

    let plan: DispatchPlan | null = rhs_map.get(rhs.type) ?? null;
    if (!plan) {
        plan = resolveDispatchPlan(op, lhs.type, rhs.type);
        if (!plan)
            throw new Error(`Operation ${op} not defined for ${lhs.type.description} and ${rhs.type.description}`);

        rhs_map.set(rhs.type, plan);
    }

    return plan.kernel(plan.lhs_fn(lhs), plan.rhs_fn(rhs)) as R;
}

function invalidateDispatchTable(): void {
    DISPATCH_CACHE.clear();
    __update_JNum_registered_op_keys();
}

export function precomputeAllDispatchPlans(): void {
    for (const op of allBinaryOperations()) {
        for (const lhs of TYPES.keys()) {
            for (const rhs of TYPES.keys()) {
                let lhs_map = DISPATCH_CACHE.get(op);
                if (!lhs_map) {
                    lhs_map = new Map();
                    DISPATCH_CACHE.set(op, lhs_map);
                }

                let rhs_map = lhs_map.get(lhs);
                if (!rhs_map) {
                    rhs_map = new Map();
                    lhs_map.set(lhs, rhs_map);
                }

                if (!rhs_map.has(rhs)) {
                    const plan = resolveDispatchPlan(op, lhs, rhs);
                    if (plan) rhs_map.set(rhs, plan);
                }
            }
        }
    }
}

/* ======== N-ARY OPERATIONS ========= */

export type NAryKernel<R = _JNum> =
    (args: readonly _JNum[]) => R;

const NARY_OPS = new Map<Operation, NAryKernel<unknown>>();

export function registerNAryOp<R = _JNum>(
    op: Operation,
    kernel: NAryKernel<R>
): void {
    if (BINARY_OPS.has(op))
        throw new Error(`Operation ${op} already registeed as binary`);

    NARY_OPS.set(op, kernel);
    __update_JNum_registered_op_keys();
}

export function registerNAryOpOnType<R = _JNum>(
    op: Operation,
    target: JNumType,
    kernel: (args: readonly _JNum[]) => R
): void {
    registerNAryOp(op, args => {
        const promoted = args.map(a =>
            a.type === target ? a : promoteValue(a, target)
        );
        return kernel(promoted);
    });
}

export function reduceBinary(
    op: Operation,
    args: readonly _JNum[],
    reverse = false
): _JNum {
    if (args.length < 2)
        throw new Error(`Operation ${op} requires at least two arguments`);

    if (!reverse) {
        let acc = args[0];
        for (let i = 1; i < args.length; i++)
            acc = dispatchBinaryOp(op, acc, args[i]);
        return acc;
    } else {
        let acc = args[args.length - 1];
        for (let i = args.length - 2; i >= 0; i--)
            acc = dispatchBinaryOp(op, args[i], acc);
        return acc;
    }
}

/* ============ PROMOTIONS =========== */

export interface PromotionRule {
    from: JNumType;
    to: JNumType;
    cost: number;
    apply(v: _JNum): _JNum;
};

const PROMOTIONS: PromotionRule[] = [];

export function registerPromotion(rule: PromotionRule): void {
    if (rule.cost < 1)
        throw new Error("Attempted to register a promotion rule with non-positive cost; zero or negative cost rules may cause cycles in promotion path lookups");
    PROMOTIONS.push(rule);

    invalidateDispatchTable();
    invalidatePromotionCache();
    invalidateReachableCache();
}

function findPromotionPath(
    from: JNumType,
    to: JNumType,
): PromotionRule[] | null {
    const dist = new Map<JNumType, number>();
    const prev = new Map<JNumType, PromotionRule | null>();
    const heap = new MinHeap<JNumType>();

    dist.set(from, 0);
    prev.set(from, null);
    heap.insert(from, 0);

    while (heap.size > 0) {
        const cur = heap.extractMin()!;
        if (cur === to) break;

        for (const rule of PROMOTIONS) {
            if (rule.from !== cur) continue;

            const next = rule.to;
            const alt = dist.get(cur)! + rule.cost;

            if (!dist.has(next) || alt < dist.get(next)!) {
                dist.set(next, alt);
                prev.set(next, rule);
                heap.insert(next, alt);
            }
        }
    }

    if (!dist.has(to)) return null;

    const path: PromotionRule[] = [];
    let cur: JNumType = to;

    while (prev.get(cur)) {
        const rule = prev.get(cur)!;
        path.unshift(rule);
        cur = rule.from;
    }

    return path;
}

export function promoteValue(v: _JNum, target: JNumType): _JNum {
    if (v.type === target) return v;

    const path = findPromotionPath(v.type, target);
    if (!path)
        throw new Error(`No promotion path from ${v.type.description} to ${target.description}`);

    let out = v;
    for (const rule of path)
        out = rule.apply(out);

    return out;
}

const PRECOMPUTED_PROMOTION_PATHS = new Map<JNumType, Map<JNumType, { cost: number, path: PromotionRule[] }>>();
const PRECOMPUTED_REACHABLE_CACHE = new Map<JNumType, JNumType[]>();

let __promotion_paths_precomputed = false;
let __reachable_paths_precomputed = false;

function invalidatePromotionCache() {
    PRECOMPUTED_PROMOTION_PATHS.clear();
    __promotion_paths_precomputed = false;
}

function invalidateReachableCache(): void {
    PRECOMPUTED_REACHABLE_CACHE.clear();
    __reachable_paths_precomputed = false;
}

export function precomputeReachableTypes() {
    for (const t of TYPES.keys()) {
        const seen = new Set<JNumType>();
        const stack = [t];
        while (stack.length) {
            const cur = stack.pop()!;
            if (seen.has(cur)) continue;
            seen.add(cur);
            for (const r of PROMOTIONS)
                if (r.from === cur)
                    stack.push(r.to);
        }
        PRECOMPUTED_REACHABLE_CACHE.set(t, [...seen]);
    }
    __reachable_paths_precomputed = true;
}

export function precomputePromotionPaths() {
    invalidatePromotionCache();
    for (const from of TYPES.keys()) {
        const inner = new Map<JNumType, { cost: number; path: PromotionRule[] }>();
        for (const to of TYPES.keys()) {
            const path = findPromotionPath(from, to);
            if (path) {
                const cost = path.reduce((s, r) => s + r.cost, 0);
                inner.set(to, { cost, path });
            }
        }
        PRECOMPUTED_PROMOTION_PATHS.set(from, inner);
    }

    __promotion_paths_precomputed = true;
}

function reachableTypes(from: JNumType): JNumType[] {
    if (!__reachable_paths_precomputed)
        precomputeReachableTypes();
    return PRECOMPUTED_REACHABLE_CACHE.get(from) ?? [];
}

/* ================ JNum Constructors =================== */

type TypePredicate<T> = (x: unknown) => x is T;
type GuardedType<Pred> = Pred extends (x: unknown) => x is infer U ? U : never;
type GuardedTypeFn<Pred> = (x: GuardedType<Pred>) => _JNum;
export interface JNumConstructor<T, Pred extends TypePredicate<T>> {
    predicate: Pred;
    precedence: number;
    id: symbol;
    constructor: GuardedTypeFn<Pred>;
};

const JNUM_CONSTRUCTORS = new OrderedMap<JNumConstructor<unknown, TypePredicate<unknown>>>();
export function registerJNumConstructor<T>(constructor: JNumConstructor<T, TypePredicate<T>>) {
    JNUM_CONSTRUCTORS.insert(constructor.precedence, constructor, constructor.id);
}

export function getJNumConstructors() {
    return [...JNUM_CONSTRUCTORS];
}

type JNumOp<T> = (...args: _JNum[]) => T;
type JNumWithOps<T = any> = Record<string, JNumOp<T>> & ((x: unknown) => T);

let __update_JNum_registered_op_keys: () => void = () => { return; };
export const JNum: JNumWithOps = (function () {
    function JNum(x: unknown): _JNum {
        for (const cstr of getJNumConstructors()) {
            try {
                if (!cstr.predicate(x)) continue;
                return cstr.constructor(x);
            } catch {
                continue;
            }
        }

        throw new Error(`Invalid JNum constructor of type ${typeof x}`);
    }

    (__update_JNum_registered_op_keys = () => {
        for (const [op] of UNARY_OPS)
            (JNum as unknown as JNumWithOps)[op] ??=
                (a: _JNum) => dispatchUnaryOp(op, a);

        for (const op of allBinaryOperations())
            (JNum as unknown as JNumWithOps)[op] ??=
                (a: _JNum, b: _JNum) => dispatchBinaryOp(op, a, b);

        for (const [op, kernel] of NARY_OPS) {
            (JNum as unknown as JNumWithOps)[op] ??=
                (...args: _JNum[]) => kernel(args);
        }
    })();

    return JNum as unknown as JNumWithOps;
})();

// TODO: Store multiple kernels rather than a single one, each optionally
// containing a predicate and precedence, with the one lacking a pred acting as
// the default case.

/* ====== Registering Specials ======= */

registerType({
    id: NaNNumType,
    name: "NaNNum",
    exact: false,
    integer: false,
});

registerType({
    id: InfinityNumType,
    name: "InfinityNum",
    exact: false,
    integer: false,
});

registerJNumConstructor({
    precedence: 50,
    predicate: (x): x is string =>
        typeof x === "string" &&
        x.toLowerCase() === "inf",
    id: Symbol("InfinityNum:StringPos"),
    constructor: () => {
        return InfinityNum.pos();
    }
});

registerJNumConstructor({
    precedence: 50,
    predicate: (x): x is string =>
        typeof x === "string" &&
        x.toLowerCase() === "-inf",
    id: Symbol("InfinityNum:StringNeg"),
    constructor: () => {
        return InfinityNum.neg();
    }
});

