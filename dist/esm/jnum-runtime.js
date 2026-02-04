import { _JNum } from "./jnum-base";
import { MinHeap } from "./utils/min-heap";
import { OrderedMap } from "./utils/ordered-map";
;
const TYPES = new Map();
export function registerType(t) {
    TYPES.set(t.id, t);
    invalidatePromotionCache();
    invalidateReachableCache();
}
const UNARY_OPS = new Map();
const UNARY_DISPATCH_CACHE = new Map();
export function registerUnaryOp(op, type, kernel) {
    if (opRegistered(op, { unary: true }))
        throw new Error(`Operation ${op} already registered with another arity`);
    let map = UNARY_OPS.get(op);
    if (!map) {
        map = new Map();
        UNARY_OPS.set(op, map);
    }
    map.set(type, kernel);
    UNARY_DISPATCH_CACHE.delete(op);
    installUnaryOp(op);
}
export function dispatchUnaryOp(op, arg) {
    let op_cache = UNARY_DISPATCH_CACHE.get(op);
    if (!op_cache) {
        op_cache = new Map();
        UNARY_DISPATCH_CACHE.set(op, op_cache);
    }
    const cached = op_cache.get(arg.type);
    if (cached)
        return cached.kernel(cached.promote(arg));
    const map = UNARY_OPS.get(op);
    if (!map)
        throw new Error(`Operation ${op} not defined`);
    const direct = map.get(arg.type);
    if (direct) {
        const plan = {
            kernel: direct,
            promote: v => v,
            target: arg.type
        };
        op_cache.set(arg.type, plan);
        return direct(arg);
    }
    if (!__promotion_paths_precomputed)
        precomputePromotionPaths();
    let best_cost = Infinity;
    let best = null;
    for (const [target_type, kernel] of map) {
        const pc = promotionCostAndPath(arg.type, target_type);
        if (!pc || pc.cost >= best_cost)
            continue;
        best_cost = pc.cost;
        best = {
            kernel: kernel,
            promote: composePromotion(pc.path),
            target: target_type,
        };
    }
    if (!best)
        throw new Error(`Operation ${op} not defined for ${arg.type.description}`);
    op_cache.set(arg.type, best);
    return best.kernel(best.promote(arg));
}
const BINARY_OPS = new Map();
const BINARY_LHS_TYPES = new Map();
const BINARY_RHS_TYPES = new Map();
export function allBinaryOperations() {
    return BINARY_OPS.keys();
}
export function allOperations() {
    return [...BINARY_OPS.keys(), ...UNARY_OPS.keys(), ...NARY_OPS.keys()];
}
export function registerBinaryOp(op, lhs, rhs, kernel) {
    if (opRegistered(op, { binary: true }))
        throw new Error(`Operation ${op} already registered with another arity`);
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
    rhs_map.set(rhs, kernel);
    if (!BINARY_LHS_TYPES.has(op))
        BINARY_LHS_TYPES.set(op, new Set());
    if (!BINARY_RHS_TYPES.has(op))
        BINARY_RHS_TYPES.set(op, new Set());
    BINARY_LHS_TYPES.get(op).add(lhs);
    BINARY_RHS_TYPES.get(op).add(rhs);
    installBinaryOp(op);
    invalidateDispatchTable();
}
export function registerBinaryOpCommutative(op, lhs, rhs, kernel) {
    registerBinaryOp(op, lhs, rhs, kernel);
    if (lhs !== rhs)
        registerBinaryOp(op, rhs, lhs, kernel);
}
export function getBinaryOp(op, lhs, rhs) {
    return BINARY_OPS.get(op)?.get(lhs)?.get(rhs) ?? null;
}
;
function promotionCostAndPath(from, to) {
    if (from === to)
        return { cost: 0, path: [] };
    const inner = PRECOMPUTED_PROMOTION_PATHS.get(from);
    const pc = inner?.get(to) ?? null;
    return pc;
}
function composePromotion(rules) {
    if (!rules.length)
        return v => v;
    return v => rules.reduce((acc, r) => r.apply(acc), v);
}
function resolveDispatchPlan(op, lhs_type, rhs_type) {
    const direct = getBinaryOp(op, lhs_type, rhs_type);
    if (direct) {
        return {
            kernel: direct,
            lhs_fn: v => v,
            rhs_fn: v => v,
            lhs_target: lhs_type,
            rhs_target: rhs_type,
        };
    }
    if (!__promotion_paths_precomputed)
        precomputePromotionPaths();
    const lhs_targets = reachableTypesFiltered(op, lhs_type, true);
    const rhs_targets = reachableTypesFiltered(op, rhs_type, false);
    let best_cost = Infinity;
    let best = null;
    for (const lt of lhs_targets) {
        const lhs_pc = promotionCostAndPath(lhs_type, lt);
        if (!lhs_pc || lhs_pc.cost >= best_cost)
            continue;
        for (const rt of rhs_targets) {
            const rhs_pc = promotionCostAndPath(rhs_type, rt);
            if (!rhs_pc)
                continue;
            const total = lhs_pc.cost + rhs_pc.cost;
            if (total >= best_cost)
                continue;
            const kernel = getBinaryOp(op, lt, rt);
            if (!kernel)
                continue;
            best_cost = total;
            best = {
                kernel,
                lhs_fn: composePromotion(lhs_pc.path),
                rhs_fn: composePromotion(rhs_pc.path),
                lhs_target: lt,
                rhs_target: rt,
            };
        }
    }
    return best;
}
const DISPATCH_CACHE = new Map();
export function dispatchBinaryOp(op, lhs, rhs) {
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
    let plan = rhs_map.get(rhs.type) ?? null;
    if (!plan) {
        plan = resolveDispatchPlan(op, lhs.type, rhs.type);
        if (!plan)
            throw new Error(`Operation ${op} not defined for ${lhs.type.description} and ${rhs.type.description}`);
        rhs_map.set(rhs.type, plan);
    }
    return plan.kernel(plan.lhs_fn(lhs), plan.rhs_fn(rhs));
}
function invalidateDispatchTable() {
    DISPATCH_CACHE.clear();
}
export function precomputeAllUnaryDispatchPlans() {
    if (!__promotion_paths_precomputed)
        precomputePromotionPaths();
    for (const [op, kernels] of UNARY_OPS) {
        let cache = UNARY_DISPATCH_CACHE.get(op);
        if (!cache) {
            cache = new Map();
            UNARY_DISPATCH_CACHE.set(op, cache);
        }
        for (const from of TYPES.keys()) {
            if (cache.has(from))
                continue;
            const direct = kernels.get(from);
            if (direct) {
                cache.set(from, {
                    kernel: direct,
                    promote: v => v,
                    target: from
                });
                continue;
            }
            let best_cost = Infinity;
            let best = null;
            for (const [to, kernel] of kernels) {
                const pc = promotionCostAndPath(from, to);
                if (!pc || pc.cost >= best_cost)
                    continue;
                best_cost = pc.cost;
                best = {
                    kernel: kernel,
                    promote: composePromotion(pc.path),
                    target: to
                };
            }
            if (best)
                cache.set(from, best);
        }
    }
}
export function precomputeAllBinaryDispatchPlans() {
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
                    if (plan)
                        rhs_map.set(rhs, plan);
                }
            }
        }
    }
}
const NARY_OPS = new Map();
export function registerNAryOp(op, kernel) {
    if (opRegistered(op, { nary: true }))
        throw new Error(`Operation ${op} already registered with another arity`);
    NARY_OPS.set(op, kernel);
    installNAryOp(op, kernel);
}
export function registerNAryOpOnType(op, target, kernel) {
    registerNAryOp(op, args => {
        const promoted = args.map(a => a.type === target ? a : promoteValue(a, target));
        return kernel(promoted);
    });
}
export function reduceBinary(op, args, reverse = false) {
    if (args.length < 2)
        throw new Error(`Operation ${op} requires at least two arguments`);
    if (!reverse) {
        let acc = args[0];
        for (let i = 1; i < args.length; i++)
            acc = dispatchBinaryOp(op, acc, args[i]);
        return acc;
    }
    else {
        let acc = args[args.length - 1];
        for (let i = args.length - 2; i >= 0; i--)
            acc = dispatchBinaryOp(op, args[i], acc);
        return acc;
    }
}
function opRegistered(op, allowed = {}) {
    return ((!allowed.unary && UNARY_OPS.has(op)) ||
        (!allowed.binary && BINARY_OPS.has(op)) ||
        (!allowed.nary && NARY_OPS.has(op)));
}
;
const PROMOTIONS = [];
const PROMOTION_ADJ = new Map();
export function registerPromotion(rule) {
    if (rule.cost < 1)
        throw new Error("Attempted to register a promotion rule with non-positive cost; zero or negative cost rules may cause cycles in promotion path lookups");
    PROMOTIONS.push(rule);
    let list = PROMOTION_ADJ.get(rule.from);
    if (!list) {
        list = [];
        PROMOTION_ADJ.set(rule.from, list);
    }
    list.push(rule);
    invalidateDispatchTable();
    invalidatePromotionCache();
    invalidateReachableCache();
}
function findPromotionPath(from, to) {
    if (from === to)
        return [];
    const dist = new Map();
    const prev = new Map();
    const heap = new MinHeap();
    dist.set(from, 0);
    prev.set(from, null);
    heap.insert(from, 0);
    while (heap.size > 0) {
        const cur = heap.extractMin();
        const cur_cost = dist.get(cur);
        if (cur === to)
            break;
        const edges = PROMOTION_ADJ.get(cur);
        if (!edges)
            continue;
        for (const rule of edges) {
            const next = rule.to;
            const alt = cur_cost + rule.cost;
            if (!dist.has(next) || alt < dist.get(next)) {
                dist.set(next, alt);
                prev.set(next, rule);
                heap.insert(next, alt);
            }
        }
    }
    if (!dist.has(to))
        return null;
    const path = [];
    let cur = to;
    while (prev.get(cur)) {
        const rule = prev.get(cur);
        path.unshift(rule);
        cur = rule.from;
    }
    return path;
}
export function promoteValue(v, target) {
    if (v.type === target)
        return v;
    const path = findPromotionPath(v.type, target);
    if (!path)
        throw new Error(`No promotion path from ${v.type.description} to ${target.description}`);
    let out = v;
    for (const rule of path)
        out = rule.apply(out);
    return out;
}
const PRECOMPUTED_PROMOTION_PATHS = new Map();
const PRECOMPUTED_REACHABLE_CACHE = new Map();
let __promotion_paths_precomputed = false;
let __reachable_paths_precomputed = false;
function invalidatePromotionCache() {
    PRECOMPUTED_PROMOTION_PATHS.clear();
    __promotion_paths_precomputed = false;
    UNARY_DISPATCH_CACHE.clear();
}
function invalidateReachableCache() {
    PRECOMPUTED_REACHABLE_CACHE.clear();
    __reachable_paths_precomputed = false;
}
export function precomputeReachableTypes() {
    for (const t of TYPES.keys()) {
        const seen = new Set();
        const stack = [t];
        while (stack.length) {
            const cur = stack.pop();
            if (seen.has(cur))
                continue;
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
        const inner = new Map();
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
function reachableTypes(from) {
    if (!__reachable_paths_precomputed)
        precomputeReachableTypes();
    return PRECOMPUTED_REACHABLE_CACHE.get(from) ?? [];
}
function reachableTypesFiltered(op, from, is_lhs) {
    const base = reachableTypes(from);
    const allowed = is_lhs
        ? BINARY_LHS_TYPES.get(op)
        : BINARY_RHS_TYPES.get(op);
    if (!allowed)
        return [];
    return base.filter(t => allowed.has(t));
}
;
const JNUM_CONSTRUCTORS = new OrderedMap();
export function registerJNumConstructor(constructor) {
    JNUM_CONSTRUCTORS.insert(constructor.precedence, constructor, constructor.id);
}
export function getJNumConstructors() {
    return [...JNUM_CONSTRUCTORS];
}
export const JNum = (function () {
    const JNumFn = (x) => {
        for (const cstr of getJNumConstructors()) {
            try {
                if (!cstr.predicate(x))
                    continue;
                return cstr.constructor(x);
            }
            catch {
                continue;
            }
        }
        throw new Error(`Invalid JNum constructor of type ${typeof x}`);
    };
    const JNum = JNumFn;
    return JNum;
})();
function installUnaryOp(op) {
    JNum[op] ??= (a) => dispatchUnaryOp(op, a);
}
function installBinaryOp(op) {
    JNum[op] ??= (a, b) => dispatchBinaryOp(op, a, b);
}
function installNAryOp(op, kernel) {
    JNum[op] ??= (...args) => kernel(args);
}
