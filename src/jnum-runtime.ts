import type { JNumType } from "./jnum-base"
import { _JNum } from "./jnum-base";
import { MinHeap } from "./utils/min-heap";
import { OrderedMap } from "./utils/ordered-map";

/* ============== TYPES ============== */

/**
 * A numeric type registered in the JNum system.
 */
export interface RegisteredType {
    /** Unique type identifier */
    id: JNumType;

    /** Optional human-readable name for the type. If not specified,
     * Symbol.prototype.description will be used. */
    name?: string;
};

const TYPES = new Map<JNumType, RegisteredType>();

/**
 * Registers a numeric type with the JNum system.
 *
 * @param t The type to register.
 *
 * @example
 * // Register a new type in JNum with the ID of `NumberType`
 * const NumberType = Symbol("NumberType");
 * registerType({
 *    id: NumberType,
 *    name: "NumberType",
 * });
 *
 * @remarks
 * This function adds the type to the internal type registry and invalidates
 * all promotion and dispatch caches to ensure that newly registered types can
 * participate in operations and promotions.
 */
export function registerType(t: RegisteredType): void {
    TYPES.set(t.id, t);

    invalidatePromotionCache();
    invalidateReachableCache();
}

/* ======== UNARY OPERATIONS ========= */

interface UnaryDispatchPlan {
    kernel: ErasedUnaryOpKernel;
    promote: (v: _JNum) => _JNum;
    target: JNumType;
}

/**
 * Performs a unary operation on a JNum value.
 *
 * @template T Type of the input JNum.
 * @template R Type of the return value (default `_JNum`).
 * @param arg The argument to operate on.
 * @returns The result of the unary operation.
 */
export type UnaryOpKernel<T extends _JNum = _JNum, R = unknown> =
    (arg: T) => R;

type ErasedUnaryOpKernel = UnaryOpKernel<_JNum, unknown>;

const UNARY_OPS = new Map<
    Operation,
    Map<JNumType, UnaryOpKernel>
>();

const UNARY_DISPATCH_CACHE = new Map<
    Operation,
    Map<JNumType, UnaryDispatchPlan>
>();

/**
 * Registers a unary operation kernel for a specific type.
 *
 * @template T Type of the input JNum.
 * @template R The return type of the operation (default `_JNum`).
 * @param op The operation name.
 * @param type The symbol-based type the operation applies to.
 * @param kernel The function implementing the unary operation.
 *
 * @throws If the operation is already registered with a different arity.
 *
 * @example
 * // Registers a negation operation for NumberType.
 * const NumberType = Symbol("NumberType");
 * registerUnaryOp(OPS.OP_NEG, NumberType,
 *     (a) => JNum(-a.value)
 * );
 *
 * @remarks
 * Registers a unary operation for a specific type. If the operation is already
 * registered with a different arity, an error is thrown. Dispatch caches for
 * this operation are cleared and the operation is installed on the `JNum`
 * object.
 *
 * It is recommended to use standardized JNum operator names provided by OPS
 * to maximize compatibility with other JNum-based libraries, although arbitrary
 * string-based names are allowed.
 *
 * Note that while any operator can be registered, they may not be installed to
 * the JNum object if the name of the operator matches that of a member of
 * Function.prototype.
 */
export function registerUnaryOp<T extends _JNum = _JNum, R = _JNum>(
    op: Operation,
    type: JNumType,
    kernel: UnaryOpKernel<T, R>
): void {
    if (opRegistered(op, { unary: true }))
        throw new Error(`Operation ${op} already registered with another arity`);

    let map = UNARY_OPS.get(op);
    if (!map) {
        map = new Map();
        UNARY_OPS.set(op, map);
    }

    map.set(type, kernel as ErasedUnaryOpKernel);

    UNARY_DISPATCH_CACHE.delete(op);

    installUnaryOp(op);
}

/**
 * Dispatches a unary operation on a JNum value.
 *
 * @template R The return type of the operation.
 * @param op The operation name.
 * @param arg The input value for the operation.
 * @returns The result of the unary operation.
 *
 * @throws If the operation is not defined for the type of `arg`.
 *
 * @example
 * // Dispatches the negation operation on `4`, constructed from JNum.
 * dispatchUnaryOp(OPS.OP_NEG, JNum(4)) // => JNum(-4)
 *
 * @remarks
 * Dispatch uses cached dispatch plans when available. If no plan exists, it
 * searches for the best type promotion path to a registered kernel.
 */
export function dispatchUnaryOp<R = _JNum>(
    op: Operation,
    arg: _JNum
): R {
    let op_cache = UNARY_DISPATCH_CACHE.get(op);
    if (!op_cache) {
        op_cache = new Map();
        UNARY_DISPATCH_CACHE.set(op, op_cache);
    }

    const cached = op_cache.get(arg.type);
    if (cached)
        return cached.kernel(cached.promote(arg)) as R;

    const map = UNARY_OPS.get(op);
    if (!map)
        throw new Error(`Operation ${op} not defined`);

    const direct = map.get(arg.type);
    if (direct) {
        const plan: UnaryDispatchPlan = {
            kernel: direct as ErasedUnaryOpKernel,
            promote: v => v,
            target: arg.type
        };

        op_cache.set(arg.type, plan);
        return direct(arg) as R;
    }

    if (!__promotion_paths_precomputed)
        precomputePromotionPaths();

    let best_cost = Infinity;
    let best: UnaryDispatchPlan | null = null;

    for (const [target_type, kernel] of map) {
        const pc = promotionCostAndPath(arg.type, target_type);
        if (!pc || pc.cost >= best_cost) continue;

        best_cost = pc.cost;

        best = {
            kernel: kernel as ErasedUnaryOpKernel,
            promote: composePromotion(pc.path),
            target: target_type,
        };
    }

    if (!best)
        throw new Error(`Operation ${op} not defined for ${arg.type.description}`);

    op_cache.set(arg.type, best);
    return best.kernel(best.promote(arg)) as R;
}

/* ======= BINARY OPERATIONS ========= */

/** An operation identifier for JNum - a semantic alias for a string */
export type Operation = string;

/**
 * A function that performs a binary operation on two JNum values.
 *
 * @template LHS Type of the left-hand operand.
 * @template RHS Type of the right-hand operand.
 * @template R Return type (default `_JNum`).
 * @param lhs The left-hand operand.
 * @param rhs The right-hand operand.
 * @returns The result of the binary operation.
 */
export type BinaryOpKernel<LHS extends _JNum = _JNum, RHS extends _JNum = _JNum, R = _JNum> =
    (lhs: LHS, rhs: RHS) => R;

const BINARY_OPS = new Map<
    Operation,
    Map<JNumType, Map<JNumType, ErasedBinaryOpKernel>>
>();

const BINARY_LHS_TYPES = new Map<Operation, Set<JNumType>>();
const BINARY_RHS_TYPES = new Map<Operation, Set<JNumType>>();

type ErasedBinaryOpKernel = (lhs: _JNum, rhs: _JNum) => unknown;

/**
 * Returns an iterable of all registered unary operation names.
 */
export function allUnaryOperations(): Iterable<Operation> {
    return UNARY_OPS.keys();
}

/**
 * Returns an iterable of all registered binary operation names.
 */
export function allBinaryOperations(): Iterable<Operation> {
    return BINARY_OPS.keys();
}

/**
 * Returns an iterable of all registered n-ary operation names.
 */
export function allNAryOperations(): Iterable<Operation> {
    return NARY_OPS.keys();
}

/**
 * Returns an iterable of all registered operation names.
 */
export function allOperations(): Iterable<Operation> {
    return [...BINARY_OPS.keys(), ...UNARY_OPS.keys(), ...NARY_OPS.keys()];
}

/**
 * Registers a binary operation kernel for a specific pair of types.
 *
 * @template LHS Type of the left-hand operand.
 * @template RHS Type of the right-hand operand.
 * @template R Return type of the operation.
 * @param op The operation name.
 * @param lhs The type of the left-hand operand.
 * @param rhs The type of the right-hand operand.
 * @param kernel The function implementing the binary operation
 *
 * @throws If the operation has already been registered with a different arity.
 *
 * @example
 * // Registers the `add` binary operation between numbers.
 * const NumberType = Symbol("NumberType");
 * registerBinaryOp(OPS.OP_ADD, NumberType, NumberType,
 *     (a, b) => JNum(a.value + b.value)
 * );
 *
 * @remarks
 * Registers a binary operation for a specific LHS/RHS type pair. If the
 * operation is already registered with a different arity, an error is thrown.
 * Dispatch caches are invalidated, and the operation is installed on the
 * `JNum` object.
 */
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

    rhs_map.set(rhs, kernel as ErasedBinaryOpKernel);

    if (!BINARY_LHS_TYPES.has(op))
        BINARY_LHS_TYPES.set(op, new Set());

    if (!BINARY_RHS_TYPES.has(op))
        BINARY_RHS_TYPES.set(op, new Set());

    BINARY_LHS_TYPES.get(op)!.add(lhs);
    BINARY_RHS_TYPES.get(op)!.add(rhs);

    installBinaryOp(op);

    invalidateBinaryDispatchTable();
}

/**
 * Registers a commutative binary operation kernel for a pair of types.
 *
 * @template LHS Type of the left-hand operand.
 * @template RHS Type of the right-hand operand.
 * @template R Return type of the operation.
 * @param op The operation name.
 * @param lhs The type of the left-hand operand.
 * @param rhs The type of the right-hand operand.
 * @param kernel The function implementing the binary operation.
 *
 * @example
 * // Registers a commutative `add` between both finite NumberType and InfinityType
 * const NumberType = Symbol("NumberType");
 * const InfinityType = Symbol("InfinityType");
 * registerBinaryOpCommutative(OPS.OP_ADD, NumberType, InfinityType,
 *     (a, b) => a.type === InfinityType ? a : b
 * );
 *
 * // This is equivalent to:
 * registerBinaryOp(OPS.OP_ADD, NumberType, InfinityType,
 *     (a, b) => a.type === InfinityType ? a : b
 * );
 *
 * registerBinaryOp(OPS.OP_ADD, InfinityType, NumberType,
 *     (a, b) => a.type === InfinityType ? a : b
 * );
 *
 * @remarks
 * For commutative operations, this automatically registers the operation for
 * both (lhs, rhs) and (rhs, lhs) if the types differ. This function is a
 * shorthand for two separate registerBinaryOp calls.
 *
 * It is recommended to use standardized JNum operator names provided by OPS
 * to maximize compatibility with other JNum-based libraries, although arbitrary
 * string-based names are allowed.
 *
 * Note that while any operator can be registered, they may not be installed to
 * the JNum object if the name of the operator matches that of a member of
 * Function.prototype.
 */
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

/**
 * Retrieves the registered binary operation kernel for a specific pair of
 * types.
 *
 * @param op The operation name.
 * @param lhs The left-hand operand type.
 * @param rhs The right-hand operand type.
 * @returns The kernel function if registered, otherwise `null`.
 */
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

function composePromotion(rules: PromotionRule[]): (v: _JNum) => _JNum {
    if (!rules.length) return v => v;
    return v => rules.reduce((acc, r) => r.apply(acc), v);
}

function resolveDispatchPlan(
    op: Operation,
    lhs_type: JNumType,
    rhs_type: JNumType,
): DispatchPlan | null {
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
    let best: DispatchPlan | null = null;

    for (const lt of lhs_targets) {
        const lhs_pc = promotionCostAndPath(lhs_type, lt);
        if (!lhs_pc || lhs_pc.cost >= best_cost) continue;

        for (const rt of rhs_targets) {
            const rhs_pc = promotionCostAndPath(rhs_type, rt);
            if (!rhs_pc) continue;

            const total = lhs_pc.cost + rhs_pc.cost;
            if (total >= best_cost) continue;

            const kernel = getBinaryOp(op, lt, rt);
            if (!kernel) continue;

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

const BINARY_DISPATCH_CACHE = new Map<
    Operation,
    Map<JNumType, Map<JNumType, DispatchPlan>>
>();

/**
 * Dispatches a binary operation for two JNum operands.
 *
 * @template R Return type of the operation
 * @param op The operation name.
 * @param lhs Left-hand operand.
 * @param rhs Right-hand operand.
 * @returns The result of the operation.
 *
 * @throws If no compatible kernel exists for the operand types, even after
 * promotion.
 *
 * @example
 * // Adds JNum numbers 2 and 3.
 * dispatchBinaryOp(OPS.OP_ADD, JNum(2), JNum(3)); // => JNum(5)
 *
 * @remarks
 * Dispatch uses cached plans when available. if no plan exists, the function
 * resolves the best LHS and RHS promotion paths and selects the kernel with
 * minimal total promotion cost. The resulting plan is cached for subsequent
 * calls.
 */
export function dispatchBinaryOp<R = _JNum>(
    op: Operation,
    lhs: _JNum,
    rhs: _JNum,
): R {
    let lhs_map = BINARY_DISPATCH_CACHE.get(op);
    if (!lhs_map) {
        lhs_map = new Map();
        BINARY_DISPATCH_CACHE.set(op, lhs_map);
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

/* ======== N-ARY OPERATIONS ========= */

/**
 * A function that performs an n-ary operation on an array of JNum values.
 *
 * @template R Return type of the operation (default `_JNum`).
 * @param args Array of input JNum values.
 * @returns The result of the n-ary operation.
 */
export type NAryKernel<R = _JNum> =
    (args: readonly _JNum[]) => R;

const NARY_OPS = new Map<Operation, NAryKernel<unknown>>();

/**
 * Registers an n-ary operation with the JNum system.
 *
 * @template R Return type of the operation.
 * @param op The operation name.
 * @param kernel The function implementing the n-ary operation.
 *
 * @throws If the operation is already defined with a different arity.
 *
 * @example
 * // Registers a variadic addition operation.
 * // This assumes that a binary addition operator has been defined.
 * registerNAryOp(OPS.OP_ADD, (...nums) => reduceBinary(OPS.OP_ADD, nums));
 *
 * // An implementation that does not rely on a binary OP_ADD may be
 * // written, though it is recommended to use `registerNAryOpOnType`
 * // in such cases to ensure type safety and promotion.
 *
 * @remarks
 * Registers an operation that accepts an arbitrary number of arguments. Throws
 * an error if the operation is already registered with a different arity. The
 * operation is installed on the `JNum` object.
 *
 * It is recommended to use standardized JNum operator names provided by OPS
 * to maximize compatibility with other JNum-based libraries, although arbitrary
 * string-based names are allowed.
 *
 * Note that while any operator can be registered, they may not be installed to
 * the JNum object if the name of the operator matches that of a member of
 * Function.prototype.
 */
export function registerNAryOp<R = _JNum>(
    op: Operation,
    kernel: NAryKernel<R>
): void {
    if (opRegistered(op, { nary: true }))
        throw new Error(`Operation ${op} already registered with another arity`);

    NARY_OPS.set(op, kernel);

    installNAryOp(op, kernel);
}

/**
 * Registers an n-ary operation restricted to a specific target type, handling
 * promotion accordingly.
 *
 * @template R Return type of the operation.
 * @param op The operation name.
 * @param target The target type to which all arguments will be promoted.
 * @param kernel The function implementing the operation on the values of the target type.
 *
 * @example
 * // Registers a variadic addition operation.
 * const NumberType = Symbol("NumberType");
 * registerNAryOpOnType(OPS.OP_ADD, NumberType,
 *     (...nums) => {
 *         const sum = nums.reduce((acc, x) => x.value + acc, 0);
 *         return JNum(sum);
 *     }
 * );
 *
 * @remarks
 * Promotes all arguments to the target type before applying the kernel. Useful
 * when an n-ary operation is only defined for one specific type.
 *
 * It is recommended to use standardized JNum operator names provided by OPS
 * to maximize compatibility with other JNum-based libraries, although arbitrary
 * string-based names are allowed.
 *
 * Note that while any operator can be registered, they may not be installed to
 * the JNum object if the name of the operator matches that of a member of
 * Function.prototype.
 */
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

/**
 * Reduces an array of JNum values by repeatedly applying a binary operation.
 *
 * @param op The binary operation name.
 * @param args Array of JNum values to reduce.
 * @param reverse If true, reduces right to left; otherwise left to right.
 * @returns The result of reducing the array.
 *
 * @throws If `args` has fewer than two elements or `op` is not a registered
 * binary operation.
 *
 * @example
 * // Computes the sum of an array of JNum numbers of type NumberType.
 * reduceBinary(OPS.OP_ADD, [JNum(1), JNum(2), JNum(3), JNum(4), JNum(5)]); // => JNum(15)
 *
 * // Computes the difference of elements in an array of JNum numbers of type
 * // NumberType from right to left. i.e. (1 - (2 - (3 - (4 - 5))))
 * reduceBinary(OPS.OP_SUB, [JNum(1), JNum(2), JNum(3), JNum(4), JNum(5)], true); // => JNum(3)
 *
 * // Computes the difference of elements in an array of JNum numbers of type
 * // NumberType from left to right. i.e. ((((1 - 2) - 3) - 4) - 5)
 * reduceBinary(OPS.OP_SUB, [JNum(1), JNum(2), JNum(3), JNum(4), JNum(5)], false); // => JNum(-13)
 *
 * @remarks
 * Uses `dispatchBinaryOp` internally. Supports reduction of arbitrary-length
 * arrays with proper promotion between elements as needed.
 */
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

function opRegistered(op: string, allowed: { unary?: boolean; binary?: boolean; nary?: boolean } = {}): boolean {
    return (
        (!allowed.unary && UNARY_OPS.has(op)) ||
        (!allowed.binary && BINARY_OPS.has(op)) ||
        (!allowed.nary && NARY_OPS.has(op))
    );
}

/* ============ PROMOTIONS =========== */

/**
 * A promotion rule from one JNum type to another.
 */
export interface PromotionRule {
    /** Source type. */
    from: JNumType;

    /** Target type. */
    to: JNumType;

    /** The cost of the promotion; must be positive. */
    cost: number;

    /** Applies the promotion to a value. */
    apply(v: _JNum): _JNum;
};

const PROMOTIONS: PromotionRule[] = [];
const PROMOTION_ADJ = new Map<JNumType, PromotionRule[]>();

/**
 * Registers a promotion rule.
 *
 * @param rule The promotion rule to register.
 *
 * @throws If the cost of a promotion is zero or negative.
 *
 * @example
 * // Registers a promotion from a Number (NumberType) to a Rational
 * // (RationalType).
 * const NumberType = Symbol("NumberType");
 * const RationalType = Symbol("RationalType");
 * registerPromotion({
 *     from: NumberType,
 *     to: NumberType,
 *     cost: 1,               // The cost is 1, as this promotion is cheap.
 *     apply: v => JNum({num: v.value, den: JNum(1)});
 * });
 *
 * @remarks
 * The cost of a promotion must be positive. Zero or negative cost rules may
 * cause cycles in promotion path lookups. Registering a new rule invalidates
 * all promotion and dispatch caches.
 *
 * A promotion must produce a JNum with the type of `rule.from`. Any demotions
 * or simplifications must be applied later. These promotions are used to convert
 * from one object to another for dispatching operations, which may require
 * specific object members that may not exist on a reduced type.
 */
export function registerPromotion(rule: PromotionRule): void {
    if (rule.cost < 1)
        throw new Error("Attempted to register a promotion rule with non-positive cost; zero or negative cost rules may cause cycles in promotion path lookups");

    PROMOTIONS.push(rule);

    let list = PROMOTION_ADJ.get(rule.from);
    if (!list) {
        list = [];
        PROMOTION_ADJ.set(rule.from, list);
    }
    list.push(rule);

    invalidateBinaryDispatchTable();
    invalidatePromotionCache();
    invalidateReachableCache();
}

function findPromotionPath(
    from: JNumType,
    to: JNumType,
): PromotionRule[] | null {
    if (from === to) return [];

    const dist = new Map<JNumType, number>();
    const prev = new Map<JNumType, PromotionRule | null>();
    const heap = new MinHeap<JNumType>();

    dist.set(from, 0);
    prev.set(from, null);
    heap.insert(from, 0);

    while (heap.size > 0) {
        const cur = heap.extractMin()!;
        const cur_cost = dist.get(cur)!;

        if (cur === to) break;

        const edges = PROMOTION_ADJ.get(cur);
        if (!edges) continue;

        for (const rule of edges) {
            const next = rule.to;
            const alt = cur_cost + rule.cost;

            if (!dist.has(next) || alt < dist.get(next)!) {
                dist.set(next, alt);
                prev.set(next, rule);
                heap.insert(next, alt);
            }
        }
    }

    if (!dist.has(to)) return null;

    const path: PromotionRule[] = [];
    let cur = to;

    while (prev.get(cur)) {
        const rule = prev.get(cur)!;
        path.unshift(rule);
        cur = rule.from;
    }

    return path;
}

/**
 * Promotes a JNum value to a target type.
 *
 * @param v The value to promote;
 * @param target The type to promote to.
 * @returns The promoted value.
 *
 * @throws If no promotion path exists from the value's type to the target type.
 */
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

function reachableTypes(from: JNumType): JNumType[] {
    if (!__reachable_paths_precomputed)
        precomputeReachableTypes();
    return PRECOMPUTED_REACHABLE_CACHE.get(from) ?? [];
}

function reachableTypesFiltered(op: Operation, from: JNumType, is_lhs: boolean): JNumType[] {
    const base = reachableTypes(from);
    const allowed = is_lhs
        ? BINARY_LHS_TYPES.get(op)
        : BINARY_RHS_TYPES.get(op);

    if (!allowed) return [];
    return base.filter(t => allowed.has(t));
}

/* ================ JNum Constructors =================== */

type TypePredicate<T> = (x: unknown) => x is T;
type GuardedType<Pred> = Pred extends (x: unknown) => x is infer U ? U : never;
type GuardedTypeFn<Pred> = (x: GuardedType<Pred>) => _JNum;

/**
 * A JNum constructor for a specific type.
 *
 * @template T The type the constructor accepts.
 * @template Pred The type predicate associated with the constructor.
 */
export interface JNumConstructor<T, Pred extends TypePredicate<T>> {
    /** The predicate used to identify values this constructor can handle */
    predicate: Pred;

    /** Precedence for selection when multiple constructors match. Lower precedence is preferred. */
    precedence: number;

    /** Unique identifier for the constructor */
    id: symbol;

    /** Function that converts a JNum from a value of the given type. */
    constructor: GuardedTypeFn<Pred>;
};

const JNUM_CONSTRUCTORS = new OrderedMap<JNumConstructor<unknown, TypePredicate<unknown>>>();

/**
 * Registers a JNum constructor.
 *
 * @param constructor The constructor to register.
 *
 * @example
 * // Registers a string-based constructor for a number. A precedence of 1 is
 * considered to be high. This will come before any constructor with a
 * precedence value > 1.
 * registerJNumConstructor({
 *     predicate: (x): x is number => typeof x === "number",
 *     precedence: 1,
 *     id: Symbol("NumberType:Number"),
 *     constructor: x => JNumNumber.create(x),
 * });
 *
 * // Once this constructor is registered, we can use it with:
 * JNum(43) // => JNumNumber(43)
 *
 * @remarks
 * Constructors are stores in an ordered map by precedence. The lowest
 * precedence matching constructor will be used when creating a JNum from a
 * value.
 */
export function registerJNumConstructor<T>(constructor: JNumConstructor<T, TypePredicate<T>>) {
    JNUM_CONSTRUCTORS.insert(constructor.precedence, constructor, constructor.id);
}

/**
 * Returns an array of all registered JNum constructors in precedence order
 * from lowest (highest priority) to highest (lowest priority).
 */
export function getJNumConstructors() {
    return [...JNUM_CONSTRUCTORS];
}

type JNumObj<T = _JNum> = ((x: unknown) => T);

type JNumOp<T> = (...args: _JNum[]) => T;
type JNumWithOps<T = unknown> = Record<string, JNumOp<T>> & JNumObj;

/**
 * The primary JNum factory and operation container.
 *
 * @remarks
 * Can be called as a function to construct a JNum from an arbitrary value,
 * or used as a namespace for unary, binary, and n-ary operations installed
 * via `registerUnaryOp`, `registerBinaryOp`, and `registerNAryOp`, as well
 * as any related registration functions.
 *
 * @example
 * // Assuming JNumNumber exists and is registered, as well as the `add`
 * // operation:
 * const x = JNum(5); // => JNumNumber(5)
 * const y = JNum(3); // => JNumNumber(3)
 * const z = JNum.add(x, y); // => JNumNumber(8)
 */
export const JNum: JNumWithOps = (function () {
    const JNumFn: JNumObj = (x: unknown): _JNum => {
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

    const JNum = JNumFn as unknown as JNumWithOps;

    return JNum;
})();

function installUnaryOp(op: Operation) {
    JNum[op] ??= (a: _JNum) => dispatchUnaryOp(op, a);
}

function installBinaryOp(op: Operation) {
    JNum[op] ??= (a: _JNum, b: _JNum) => dispatchBinaryOp(op, a, b);
}

function installNAryOp(op: Operation, kernel: NAryKernel<unknown>) {
    JNum[op] ??= (...args: _JNum[]) => kernel(args);
}

/* ======= Cache Invalidation and Precomputation ======== */

/** Clears all cached binary dispatch plans. */
export function invalidateBinaryDispatchTable(): void {
    BINARY_DISPATCH_CACHE.clear();
}

/** Clears all cached promotion plans. */
export function invalidatePromotionCache() {
    PRECOMPUTED_PROMOTION_PATHS.clear();
    __promotion_paths_precomputed = false;
    UNARY_DISPATCH_CACHE.clear();
}

/** Clears all cached reachable types. */
export function invalidateReachableCache(): void {
    PRECOMPUTED_REACHABLE_CACHE.clear();
    __reachable_paths_precomputed = false;
}

/** Precomputes dispatch plans for all unary operators. */
export function precomputeAllUnaryDispatchPlans(): void {
    if (!__promotion_paths_precomputed)
        precomputePromotionPaths();

    for (const [op, kernels] of UNARY_OPS) {
        let cache = UNARY_DISPATCH_CACHE.get(op);
        if (!cache) {
            cache = new Map();
            UNARY_DISPATCH_CACHE.set(op, cache);
        }

        for (const from of TYPES.keys()) {
            if (cache.has(from)) continue;

            const direct = kernels.get(from);
            if (direct) {
                cache.set(from, {
                    kernel: direct as ErasedUnaryOpKernel,
                    promote: v => v,
                    target: from
                });
                continue;
            }

            let best_cost = Infinity;
            let best: UnaryDispatchPlan | null = null;

            for (const [to, kernel] of kernels) {
                const pc = promotionCostAndPath(from, to);
                if (!pc || pc.cost >= best_cost) continue;

                best_cost = pc.cost;
                best = {
                    kernel: kernel as ErasedUnaryOpKernel,
                    promote: composePromotion(pc.path),
                    target: to
                };
            }

            if (best)
                cache.set(from, best);
        }
    }
}

/** Precomputes dispatch plans for all binary operators. */
export function precomputeAllBinaryDispatchPlans(): void {
    for (const op of allBinaryOperations()) {
        for (const lhs of TYPES.keys()) {
            for (const rhs of TYPES.keys()) {
                let lhs_map = BINARY_DISPATCH_CACHE.get(op);
                if (!lhs_map) {
                    lhs_map = new Map();
                    BINARY_DISPATCH_CACHE.set(op, lhs_map);
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

/** Precomputes all reachable types. */
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

/** Precomputes all promotion plans. */
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

