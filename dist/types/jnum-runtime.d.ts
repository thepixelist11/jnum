import type { JNumType } from "./jnum-base";
import { _JNum } from "./jnum-base";
/**
 * A type registered in the JNum system.
 */
export interface RegisteredType {
    /** Unique type identifier */
    id: symbol;
}
/**
 * Performs a unary operation on a JNum value.
 *
 * @template T Type of the input JNum.
 * @template R Type of the return value (default `_JNum`).
 * @param arg The argument to operate on.
 * @returns The result of the unary operation.
 */
export type UnaryOpKernel<T extends _JNum = _JNum, R = unknown> = (arg: T) => R;
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
export type BinaryOpKernel<LHS extends _JNum = _JNum, RHS extends _JNum = _JNum, R = _JNum> = (lhs: LHS, rhs: RHS) => R;
type ErasedBinaryOpKernel = (lhs: _JNum, rhs: _JNum) => unknown;
/**
 * A function that performs an n-ary operation on an array of JNum values.
 *
 * @template R Return type of the operation (default `_JNum`).
 * @param args Array of input JNum values.
 * @returns The result of the n-ary operation.
 */
export type NAryKernel<R = _JNum> = (args: readonly _JNum[]) => R;
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
}
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
}
type JNumObj<T = _JNum> = ((x: unknown) => T);
type JNumOp<T> = (...args: _JNum[]) => T;
type JNumWithOps<T = unknown> = Record<string, JNumOp<T>> & JNumObj;
export declare class JNum {
    private readonly TYPES;
    private readonly TYPE_STR_SYM_MAP;
    private readonly UNARY_OPS;
    private readonly UNARY_DISPATCH_CACHE;
    private readonly BINARY_OPS;
    private readonly BINARY_LHS_TYPES;
    private readonly BINARY_RHS_TYPES;
    private readonly BINARY_DISPATCH_CACHE;
    private readonly NARY_OPS;
    private readonly PROMOTIONS;
    private readonly PROMOTION_ADJ;
    private readonly PRECOMPUTED_PROMOTION_PATHS;
    private readonly PRECOMPUTED_REACHABLE_CACHE;
    private __promotion_paths_precomputed;
    private __reachable_paths_precomputed;
    private readonly JNUM_CONSTRUCTORS;
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
    JNumType(id: string): JNumType;
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
    registerType(t: string): void;
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
    registerUnaryOp<T extends _JNum = _JNum, R = _JNum>(op: Operation, type: JNumType, kernel: UnaryOpKernel<T, R>): void;
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
    dispatchUnaryOp<R = _JNum>(op: Operation, arg: _JNum): R;
    /**
     * Returns an iterable of all registered unary operation names.
     */
    allUnaryOperations(): Iterable<Operation>;
    /**
     * Returns an iterable of all registered binary operation names.
     */
    allBinaryOperations(): Iterable<Operation>;
    /**
     * Returns an iterable of all registered n-ary operation names.
     */
    allNAryOperations(): Iterable<Operation>;
    /**
     * Returns an iterable of all registered operation names.
     */
    allOperations(): Iterable<Operation>;
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
    registerBinaryOp<LHS extends _JNum, RHS extends _JNum, R>(op: Operation, lhs: JNumType, rhs: JNumType, kernel: BinaryOpKernel<LHS, RHS, R>): void;
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
    registerBinaryOpCommutative<LHS extends _JNum, RHS extends _JNum, R>(op: Operation, lhs: JNumType, rhs: JNumType, kernel: BinaryOpKernel<LHS | RHS, RHS | LHS, R>): void;
    /**
     * Retrieves the registered binary operation kernel for a specific pair of
     * types.
     *
     * @param op The operation name.
     * @param lhs The left-hand operand type.
     * @param rhs The right-hand operand type.
     * @returns The kernel function if registered, otherwise `null`.
     */
    getBinaryOp(op: Operation, lhs: JNumType, rhs: JNumType): ErasedBinaryOpKernel | null;
    private promotionCostAndPath;
    private composePromotion;
    private resolveDispatchPlan;
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
    dispatchBinaryOp<R = _JNum>(op: Operation, lhs: _JNum, rhs: _JNum): R;
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
    registerNAryOp<R = _JNum>(op: Operation, kernel: NAryKernel<R>): void;
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
    registerNAryOpOnType<R = _JNum>(op: Operation, target: JNumType, kernel: (args: readonly _JNum[]) => R): void;
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
    reduceBinary(op: Operation, args: readonly _JNum[], reverse?: boolean): _JNum;
    private opRegistered;
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
    registerPromotion(rule: PromotionRule): void;
    private findPromotionPath;
    /**
     * Promotes a J.Num value to a target type.
     *
     * @param v The value to promote;
     * @param target The type to promote to.
     * @returns The promoted value.
     *
     * @throws If no promotion path exists from the value's type to the target type.
     */
    promoteValue(v: _JNum, target: JNumType): _JNum;
    private reachableTypes;
    private reachableTypesFiltered;
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
    registerJNumConstructor<T>(constructor: JNumConstructor<T, TypePredicate<T>>): void;
    /**
     * Returns an array of all registered JNum constructors in precedence order
     * from lowest (highest priority) to highest (lowest priority).
     */
    getJNumConstructors(): JNumConstructor<unknown, TypePredicate<unknown>>[];
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
    Num: JNumWithOps;
    private installUnaryOp;
    private installBinaryOp;
    private installNAryOp;
    /** Clears all cached binary dispatch plans. */
    invalidateBinaryDispatchTable(): void;
    /** Clears all cached promotion plans. */
    invalidatePromotionCache(): void;
    /** Clears all cached reachable types. */
    invalidateReachableCache(): void;
    /** Precomputes dispatch plans for all unary operators. */
    precomputeAllUnaryDispatchPlans(): void;
    /** Precomputes dispatch plans for all binary operators. */
    precomputeAllBinaryDispatchPlans(): void;
    /** Precomputes all reachable types. */
    precomputeReachableTypes(): void;
    /** Precomputes all promotion plans. */
    precomputePromotionPaths(): void;
}
export {};
//# sourceMappingURL=jnum-runtime.d.ts.map