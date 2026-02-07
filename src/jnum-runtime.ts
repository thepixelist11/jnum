import type { JNumType } from "./jnum-base"
import { _JNum } from "./jnum-base";
import { MinHeap } from "./utils/min-heap";
import { OrderedMap } from "./utils/ordered-map";

/**
 * A type registered in the JNum system.
 */
export interface RegisteredType {
    /** Unique type identifier */
    id: symbol;
};

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

type ErasedBinaryOpKernel = (lhs: _JNum, rhs: _JNum) => unknown;

interface DispatchPlan {
    kernel: ErasedBinaryOpKernel;
    lhs_fn: (v: _JNum) => _JNum;
    rhs_fn: (v: _JNum) => _JNum;
    lhs_target: JNumType;
    rhs_target: JNumType;
};

/**
 * A function that performs an n-ary operation on an array of JNum values.
 *
 * @template R Return type of the operation (default `_JNum`).
 * @param args Array of input JNum values.
 * @returns The result of the n-ary operation.
 */
export type NAryKernel<R = _JNum> =
    (args: readonly _JNum[]) => R;

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

type JNumObj<T = _JNum> = ((x: unknown) => T);

type JNumOp<T> = (...args: _JNum[]) => T;
type JNumWithOps<T = unknown> = Record<string, JNumOp<T>> & JNumObj;

export class JNum {
    private readonly TYPES = new Map<JNumType, RegisteredType>();
    private readonly TYPE_STR_SYM_MAP = new Map<string, JNumType>();

    private readonly UNARY_OPS = new Map<
        Operation,
        Map<JNumType, UnaryOpKernel>
    >();

    private readonly UNARY_DISPATCH_CACHE = new Map<
        Operation,
        Map<JNumType, UnaryDispatchPlan>
    >();

    private readonly BINARY_OPS = new Map<
        Operation,
        Map<JNumType, Map<JNumType, ErasedBinaryOpKernel>>
    >();

    private readonly BINARY_LHS_TYPES = new Map<Operation, Set<JNumType>>();
    private readonly BINARY_RHS_TYPES = new Map<Operation, Set<JNumType>>();

    private readonly BINARY_DISPATCH_CACHE = new Map<
        Operation,
        Map<JNumType, Map<JNumType, DispatchPlan>>
    >();

    private readonly NARY_OPS = new Map<Operation, NAryKernel<unknown>>();

    private readonly PROMOTIONS: PromotionRule[] = [];
    private readonly PROMOTION_ADJ = new Map<JNumType, PromotionRule[]>();

    private readonly PRECOMPUTED_PROMOTION_PATHS = new Map<JNumType, Map<JNumType, { cost: number, path: PromotionRule[] }>>();
    private readonly PRECOMPUTED_REACHABLE_CACHE = new Map<JNumType, JNumType[]>();

    private __promotion_paths_precomputed = false;
    private __reachable_paths_precomputed = false;

    private readonly JNUM_CONSTRUCTORS = new OrderedMap<JNumConstructor<unknown, TypePredicate<unknown>>>();

    /**
     * Gets the JNumType symbol associated with a given string, or creates it
     * if it does not exist.
     *
     * @param id The string to use as the symbol description.
     * @returns The generated JNumType symbol.
     *
     * @remarks
     * It is strongly recommended to use this function to create symbols used
     * as JNumTypes as opposed to the `Symbol` function, as repeated runs of
     * `Symbol` will produce unique symbols, and thus unique types. Repeated
     * runs of `JNumType` will return a new symbol only if the symbol does not
     * already exist.
     *
     * This is functionally equivalent to using a string-based
     * type, though symbol-based hashmap lookups are measurably faster than
     * string-based ones.
     *
     * If a symbol is created through this function, it will not automatically
     * be registered.
     */
    public JNumType(id: string): JNumType {
        if (!this.TYPE_STR_SYM_MAP.has(id))
            this.TYPE_STR_SYM_MAP.set(id, Symbol(id));

        return this.TYPE_STR_SYM_MAP.get(id)!;
    }

    /**
     * Registers a type with the JNum system.
     *
     * @param t The type to register.
     *
     * @example
     * // Register a new type in JNum with the ID of `NumberType`
     * J.registerType("NumberType");
     *
     * @remarks
     * This function adds the type to the internal type registry and invalidates
     * all promotion and dispatch caches to ensure that newly registered types can
     * participate in operations and promotions.
     */
    public registerType(t: string): void {
        const sym = this.JNumType(t);
        this.TYPES.set(sym, { id: sym });

        this.invalidatePromotionCache();
        this.invalidateReachableCache();
    }

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
     * J.registerUnaryOp(OPS.OP_NEG, NumberType,
     *     (a) => J.Num(-a.value)
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
    public registerUnaryOp<T extends _JNum = _JNum, R = _JNum>(
        op: Operation,
        type: JNumType,
        kernel: UnaryOpKernel<T, R>
    ): void {
        if (this.opRegistered(op, { unary: true }))
            throw new Error(`Operation ${op} already registered with another arity`);

        let map = this.UNARY_OPS.get(op);
        if (!map) {
            map = new Map();
            this.UNARY_OPS.set(op, map);
        }

        map.set(type, kernel as ErasedUnaryOpKernel);

        this.UNARY_DISPATCH_CACHE.delete(op);

        this.installUnaryOp(op);
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
     * J.dispatchUnaryOp(OPS.OP_NEG, J.Num(4)) // => J.Num(-4)
     *
     * @remarks
     * Dispatch uses cached dispatch plans when available. If no plan exists, it
     * searches for the best type promotion path to a registered kernel.
     */
    public dispatchUnaryOp<R = _JNum>(
        op: Operation,
        arg: _JNum
    ): R {
        let op_cache = this.UNARY_DISPATCH_CACHE.get(op);
        if (!op_cache) {
            op_cache = new Map();
            this.UNARY_DISPATCH_CACHE.set(op, op_cache);
        }

        const cached = op_cache.get(arg.type);
        if (cached)
            return cached.kernel(cached.promote(arg)) as R;

        const map = this.UNARY_OPS.get(op);
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

        if (!this.__promotion_paths_precomputed)
            this.precomputePromotionPaths();

        let best_cost = Infinity;
        let best: UnaryDispatchPlan | null = null;

        for (const [target_type, kernel] of map) {
            const pc = this.promotionCostAndPath(arg.type, target_type);
            if (!pc || pc.cost >= best_cost) continue;

            best_cost = pc.cost;

            best = {
                kernel: kernel as ErasedUnaryOpKernel,
                promote: this.composePromotion(pc.path),
                target: target_type,
            };
        }

        if (!best)
            throw new Error(`Operation ${op} not defined for ${arg.type.description}`);

        op_cache.set(arg.type, best);
        return best.kernel(best.promote(arg)) as R;
    }

    /**
     * Returns an iterable of all registered unary operation names.
     */
    public allUnaryOperations(): Iterable<Operation> {
        return this.UNARY_OPS.keys();
    }

    /**
     * Returns an iterable of all registered binary operation names.
     */
    public allBinaryOperations(): Iterable<Operation> {
        return this.BINARY_OPS.keys();
    }

    /**
     * Returns an iterable of all registered n-ary operation names.
     */
    public allNAryOperations(): Iterable<Operation> {
        return this.NARY_OPS.keys();
    }

    /**
     * Returns an iterable of all registered operation names.
     */
    public allOperations(): Iterable<Operation> {
        return [...this.BINARY_OPS.keys(), ...this.UNARY_OPS.keys(), ...this.NARY_OPS.keys()];
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
     * J.registerBinaryOp(OPS.OP_ADD, NumberType, NumberType,
     *     (a, b) => J.Num(a.value + b.value)
     * );
     *
     * @remarks
     * Registers a binary operation for a specific LHS/RHS type pair. If the
     * operation is already registered with a different arity, an error is thrown.
     * Dispatch caches are invalidated, and the operation is installed on the
     * `JNum` object.
     */
    public registerBinaryOp<
        LHS extends _JNum,
        RHS extends _JNum,
        R,
    >(
        op: Operation,
        lhs: JNumType,
        rhs: JNumType,
        kernel: BinaryOpKernel<LHS, RHS, R>
    ): void {
        if (this.opRegistered(op, { binary: true }))
            throw new Error(`Operation ${op} already registered with another arity`);

        let lhs_map = this.BINARY_OPS.get(op);
        if (!lhs_map) {
            lhs_map = new Map();
            this.BINARY_OPS.set(op, lhs_map);
        }

        let rhs_map = lhs_map.get(lhs);
        if (!rhs_map) {
            rhs_map = new Map();
            lhs_map.set(lhs, rhs_map);
        }

        rhs_map.set(rhs, kernel as ErasedBinaryOpKernel);

        if (!this.BINARY_LHS_TYPES.has(op))
            this.BINARY_LHS_TYPES.set(op, new Set());

        if (!this.BINARY_RHS_TYPES.has(op))
            this.BINARY_RHS_TYPES.set(op, new Set());

        this.BINARY_LHS_TYPES.get(op)!.add(lhs);
        this.BINARY_RHS_TYPES.get(op)!.add(rhs);

        this.installBinaryOp(op);

        this.invalidateBinaryDispatchTable();
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
     * J.registerBinaryOpCommutative(OPS.OP_ADD, NumberType, InfinityType,
     *     (a, b) => a.type === InfinityType ? a : b
     * );
     *
     * // This is equivalent to:
     * J.registerBinaryOp(OPS.OP_ADD, NumberType, InfinityType,
     *     (a, b) => a.type === InfinityType ? a : b
     * );
     *
     * J.registerBinaryOp(OPS.OP_ADD, InfinityType, NumberType,
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
    public registerBinaryOpCommutative<
        LHS extends _JNum,
        RHS extends _JNum,
        R
    >(
        op: Operation,
        lhs: JNumType,
        rhs: JNumType,
        kernel: BinaryOpKernel<LHS | RHS, RHS | LHS, R>
    ) {
        this.registerBinaryOp<LHS, RHS, R>(op, lhs, rhs, kernel);
        if (lhs !== rhs)
            this.registerBinaryOp<RHS, LHS, R>(op, rhs, lhs, kernel);
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
    public getBinaryOp(
        op: Operation,
        lhs: JNumType,
        rhs: JNumType
    ): ErasedBinaryOpKernel | null {
        return this.BINARY_OPS.get(op)?.get(lhs)?.get(rhs) ?? null;
    }

    private promotionCostAndPath(
        from: JNumType,
        to: JNumType
    ): { cost: number; path: PromotionRule[] } | null {
        if (from === to) return { cost: 0, path: [] };
        const inner = this.PRECOMPUTED_PROMOTION_PATHS.get(from);
        const pc = inner?.get(to) ?? null;
        return pc;
    }

    private composePromotion(rules: PromotionRule[]): (v: _JNum) => _JNum {
        if (!rules.length) return v => v;
        return v => rules.reduce((acc, r) => r.apply(acc), v);
    }

    private resolveDispatchPlan(
        op: Operation,
        lhs_type: JNumType,
        rhs_type: JNumType,
    ): DispatchPlan | null {
        const direct = this.getBinaryOp(op, lhs_type, rhs_type);
        if (direct) {
            return {
                kernel: direct,
                lhs_fn: v => v,
                rhs_fn: v => v,
                lhs_target: lhs_type,
                rhs_target: rhs_type,
            };
        }

        if (!this.__promotion_paths_precomputed)
            this.precomputePromotionPaths();

        const lhs_targets = this.reachableTypesFiltered(op, lhs_type, true);
        const rhs_targets = this.reachableTypesFiltered(op, rhs_type, false);

        let best_cost = Infinity;
        let best: DispatchPlan | null = null;

        for (const lt of lhs_targets) {
            const lhs_pc = this.promotionCostAndPath(lhs_type, lt);
            if (!lhs_pc || lhs_pc.cost >= best_cost) continue;

            for (const rt of rhs_targets) {
                const rhs_pc = this.promotionCostAndPath(rhs_type, rt);
                if (!rhs_pc) continue;

                const total = lhs_pc.cost + rhs_pc.cost;
                if (total >= best_cost) continue;

                const kernel = this.getBinaryOp(op, lt, rt);
                if (!kernel) continue;

                best_cost = total;

                best = {
                    kernel,
                    lhs_fn: this.composePromotion(lhs_pc.path),
                    rhs_fn: this.composePromotion(rhs_pc.path),
                    lhs_target: lt,
                    rhs_target: rt,
                };
            }
        }

        return best;
    }

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
     * J.dispatchBinaryOp(OPS.OP_ADD, J.Num(2), J.Num(3)); // => J.Num(5)
     *
     * @remarks
     * Dispatch uses cached plans when available. if no plan exists, the function
     * resolves the best LHS and RHS promotion paths and selects the kernel with
     * minimal total promotion cost. The resulting plan is cached for subsequent
     * calls.
     */
    public dispatchBinaryOp<R = _JNum>(
        op: Operation,
        lhs: _JNum,
        rhs: _JNum,
    ): R {
        let lhs_map = this.BINARY_DISPATCH_CACHE.get(op);
        if (!lhs_map) {
            lhs_map = new Map();
            this.BINARY_DISPATCH_CACHE.set(op, lhs_map);
        }

        let rhs_map = lhs_map.get(lhs.type);
        if (!rhs_map) {
            rhs_map = new Map();
            lhs_map.set(lhs.type, rhs_map);
        }

        let plan: DispatchPlan | null = rhs_map.get(rhs.type) ?? null;
        if (!plan) {
            plan = this.resolveDispatchPlan(op, lhs.type, rhs.type);
            if (!plan)
                throw new Error(`Operation ${op} not defined for ${lhs.type.description} and ${rhs.type.description}`);

            rhs_map.set(rhs.type, plan);
        }

        return plan.kernel(plan.lhs_fn(lhs), plan.rhs_fn(rhs)) as R;
    }

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
     * J.registerNAryOp(OPS.OP_ADD, (...nums) => J.reduceBinary(OPS.OP_ADD, nums));
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
    public registerNAryOp<R = _JNum>(
        op: Operation,
        kernel: NAryKernel<R>
    ): void {
        if (this.opRegistered(op, { nary: true }))
            throw new Error(`Operation ${op} already registered with another arity`);

        this.NARY_OPS.set(op, kernel);

        this.installNAryOp(op, kernel);
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
     * J.registerNAryOpOnType(OPS.OP_ADD, NumberType,
     *     (...nums) => {
     *         const sum = nums.reduce((acc, x) => x.value + acc, 0);
     *         return J.Num(sum);
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
    public registerNAryOpOnType<R = _JNum>(
        op: Operation,
        target: JNumType,
        kernel: (args: readonly _JNum[]) => R
    ): void {
        this.registerNAryOp(op, args => {
            const promoted = args.map(a =>
                a.type === target ? a : this.promoteValue(a, target)
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
     * J.reduceBinary(OPS.OP_ADD, [J.Num(1), J.Num(2), J.Num(3), J.Num(4), J.Num(5)]); // => J.Num(15)
     *
     * // Computes the difference of elements in an array of JNum numbers of type
     * // NumberType from right to left. i.e. (1 - (2 - (3 - (4 - 5))))
     * J.reduceBinary(OPS.OP_SUB, [J.Num(1), J.Num(2), J.Num(3), J.Num(4), J.Num(5)], true); // => J.Num(3)
     *
     * // Computes the difference of elements in an array of JNum numbers of type
     * // NumberType from left to right. i.e. ((((1 - 2) - 3) - 4) - 5)
     * J.reduceBinary(OPS.OP_SUB, [J.Num(1), J.Num(2), J.Num(3), J.Num(4), J.Num(5)], false); // => J.Num(-13)
     *
     * @remarks
     * Uses `dispatchBinaryOp` internally. Supports reduction of arbitrary-length
     * arrays with proper promotion between elements as needed.
     */
    public reduceBinary(
        op: Operation,
        args: readonly _JNum[],
        reverse = false
    ): _JNum {
        if (args.length < 2)
            throw new Error(`Operation ${op} requires at least two arguments`);

        if (!reverse) {
            let acc = args[0];
            for (let i = 1; i < args.length; i++)
                acc = this.dispatchBinaryOp(op, acc, args[i]);
            return acc;
        } else {
            let acc = args[args.length - 1];
            for (let i = args.length - 2; i >= 0; i--)
                acc = this.dispatchBinaryOp(op, args[i], acc);
            return acc;
        }
    }

    private opRegistered(op: string, allowed: { unary?: boolean; binary?: boolean; nary?: boolean } = {}): boolean {
        return (
            (!allowed.unary && this.UNARY_OPS.has(op)) ||
            (!allowed.binary && this.BINARY_OPS.has(op)) ||
            (!allowed.nary && this.NARY_OPS.has(op))
        );
    }

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
     * registerPromotion({
     *     from: NumberType,
     *     to: NumberType,
     *     cost: 1,               // The cost is 1, as this promotion is cheap.
     *     apply: v => J.Num({num: v.value, den: JNum(1)});
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
    public registerPromotion(rule: PromotionRule): void {
        if (rule.cost < 1)
            throw new Error("Attempted to register a promotion rule with non-positive cost; zero or negative cost rules may cause cycles in promotion path lookups");

        this.PROMOTIONS.push(rule);

        let list = this.PROMOTION_ADJ.get(rule.from);
        if (!list) {
            list = [];
            this.PROMOTION_ADJ.set(rule.from, list);
        }
        list.push(rule);

        this.invalidateBinaryDispatchTable();
        this.invalidatePromotionCache();
        this.invalidateReachableCache();
    }

    private findPromotionPath(
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

            const edges = this.PROMOTION_ADJ.get(cur);
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
     * Promotes a J.Num value to a target type.
     *
     * @param v The value to promote;
     * @param target The type to promote to.
     * @returns The promoted value.
     *
     * @throws If no promotion path exists from the value's type to the target type.
     */
    public promoteValue(v: _JNum, target: JNumType): _JNum {
        if (v.type === target) return v;

        const path = this.findPromotionPath(v.type, target);
        if (!path)
            throw new Error(`No promotion path from ${v.type.description} to ${target.description}`);

        let out = v;
        for (const rule of path)
            out = rule.apply(out);

        return out;
    }

    private reachableTypes(from: JNumType): JNumType[] {
        if (!this.__reachable_paths_precomputed)
            this.precomputeReachableTypes();
        return this.PRECOMPUTED_REACHABLE_CACHE.get(from) ?? [];
    }

    private reachableTypesFiltered(op: Operation, from: JNumType, is_lhs: boolean): JNumType[] {
        const base = this.reachableTypes(from);
        const allowed = is_lhs
            ? this.BINARY_LHS_TYPES.get(op)
            : this.BINARY_RHS_TYPES.get(op);

        if (!allowed) return [];
        return base.filter(t => allowed.has(t));
    }

    /**
     * Registers a J.Num constructor.
     *
     * @param constructor The constructor to register.
     *
     * @example
     * // Registers a string-based constructor for a number. A precedence of 1 is
     * considered to be high. This will come before any constructor with a
     * precedence value > 1.
     * J.registerJNumConstructor({
     *     predicate: (x): x is number => typeof x === "number",
     *     precedence: 1,
     *     id: Symbol("NumberType:Number"),
     *     constructor: x => JNumNumber.create(x),
     * });
     *
     * // Once this constructor is registered, we can use it with:
     * J.Num(43) // => JNumNumber(43)
     *
     * @remarks
     * Constructors are stores in an ordered map by precedence. The lowest
     * precedence matching constructor will be used when creating a JNum from a
     * value.
     */
    public registerJNumConstructor<T>(constructor: JNumConstructor<T, TypePredicate<T>>) {
        this.JNUM_CONSTRUCTORS.insert(constructor.precedence, constructor, constructor.id);
    }

    /**
     * Returns an array of all registered JNum constructors in precedence order
     * from lowest (highest priority) to highest (lowest priority).
     */
    public getJNumConstructors() {
        return [...this.JNUM_CONSTRUCTORS];
    }

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
     * const x = J.Num(5); // => JNumNumber(5)
     * const y = J.Num(3); // => JNumNumber(3)
     * const z = J.Num.add(x, y); // => JNumNumber(8)
     */
    public Num: JNumWithOps = (() => {
        const JNumFn: JNumObj = (x: unknown): _JNum => {
            for (const cstr of this.getJNumConstructors()) {
                try {
                    if (!cstr.predicate(x)) continue;
                    return cstr.constructor(x);
                } catch {
                    continue;
                }
            }

            throw new Error(`Invalid JNum constructor of type ${typeof x}`);
        }

        const Num = JNumFn as unknown as JNumWithOps;

        Num["typeof"] = (x: _JNum): JNumType => {
            return x.type;
        };

        return Num;
    })();

    private installUnaryOp(op: Operation) {
        this.Num[op] ??= (a: _JNum) => this.dispatchUnaryOp(op, a);
    }

    private installBinaryOp(op: Operation) {
        this.Num[op] ??= (a: _JNum, b: _JNum) => this.dispatchBinaryOp(op, a, b);
    }

    private installNAryOp(op: Operation, kernel: NAryKernel<unknown>) {
        this.Num[op] ??= (...args: _JNum[]) => kernel(args);
    }

    /* ======= Cache Invalidation and Precomputation ======== */

    /** Clears all cached binary dispatch plans. */
    public invalidateBinaryDispatchTable(): void {
        this.BINARY_DISPATCH_CACHE.clear();
    }

    /** Clears all cached promotion plans. */
    public invalidatePromotionCache() {
        this.PRECOMPUTED_PROMOTION_PATHS.clear();
        this.__promotion_paths_precomputed = false;
        this.UNARY_DISPATCH_CACHE.clear();
    }

    /** Clears all cached reachable types. */
    public invalidateReachableCache(): void {
        this.PRECOMPUTED_REACHABLE_CACHE.clear();
        this.__reachable_paths_precomputed = false;
    }

    /** Precomputes dispatch plans for all unary operators. */
    public precomputeAllUnaryDispatchPlans(): void {
        if (!this.__promotion_paths_precomputed)
            this.precomputePromotionPaths();

        for (const [op, kernels] of this.UNARY_OPS) {
            let cache = this.UNARY_DISPATCH_CACHE.get(op);
            if (!cache) {
                cache = new Map();
                this.UNARY_DISPATCH_CACHE.set(op, cache);
            }

            for (const from of this.TYPES.keys()) {
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
                    const pc = this.promotionCostAndPath(from, to);
                    if (!pc || pc.cost >= best_cost) continue;

                    best_cost = pc.cost;
                    best = {
                        kernel: kernel as ErasedUnaryOpKernel,
                        promote: this.composePromotion(pc.path),
                        target: to
                    };
                }

                if (best)
                    cache.set(from, best);
            }
        }
    }

    /** Precomputes dispatch plans for all binary operators. */
    public precomputeAllBinaryDispatchPlans(): void {
        for (const op of this.allBinaryOperations()) {
            for (const lhs of this.TYPES.keys()) {
                for (const rhs of this.TYPES.keys()) {
                    let lhs_map = this.BINARY_DISPATCH_CACHE.get(op);
                    if (!lhs_map) {
                        lhs_map = new Map();
                        this.BINARY_DISPATCH_CACHE.set(op, lhs_map);
                    }

                    let rhs_map = lhs_map.get(lhs);
                    if (!rhs_map) {
                        rhs_map = new Map();
                        lhs_map.set(lhs, rhs_map);
                    }

                    if (!rhs_map.has(rhs)) {
                        const plan = this.resolveDispatchPlan(op, lhs, rhs);
                        if (plan) rhs_map.set(rhs, plan);
                    }
                }
            }
        }
    }

    /** Precomputes all reachable types. */
    public precomputeReachableTypes() {
        for (const t of this.TYPES.keys()) {
            const seen = new Set<JNumType>();
            const stack = [t];
            while (stack.length) {
                const cur = stack.pop()!;
                if (seen.has(cur)) continue;
                seen.add(cur);
                for (const r of this.PROMOTIONS)
                    if (r.from === cur)
                        stack.push(r.to);
            }
            this.PRECOMPUTED_REACHABLE_CACHE.set(t, [...seen]);
        }
        this.__reachable_paths_precomputed = true;
    }

    /** Precomputes all promotion plans. */
    public precomputePromotionPaths() {
        this.invalidatePromotionCache();
        for (const from of this.TYPES.keys()) {
            const inner = new Map<JNumType, { cost: number; path: PromotionRule[] }>();
            for (const to of this.TYPES.keys()) {
                const path = this.findPromotionPath(from, to);
                if (path) {
                    const cost = path.reduce((s, r) => s + r.cost, 0);
                    inner.set(to, { cost, path });
                }
            }
            this.PRECOMPUTED_PROMOTION_PATHS.set(from, inner);
        }

        this.__promotion_paths_precomputed = true;
    }
}

