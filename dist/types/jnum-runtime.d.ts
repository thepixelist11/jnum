import { _JNum, JNumType } from "jnum-base";
export interface RegisteredType {
    id: JNumType;
    name?: string;
    exact?: boolean;
    integer?: boolean;
}
export declare function registerType(t: RegisteredType): void;
export type Operation = string;
export type BinaryOpKernel<LHS extends _JNum = _JNum, RHS extends _JNum = _JNum, R = _JNum> = (lhs: LHS, rhs: RHS) => R;
type ErasedBinaryOpKernel = (lhs: _JNum, rhs: _JNum) => unknown;
export declare function allOperations(): Iterable<Operation>;
export declare function registerBinaryOp<LHS extends _JNum, RHS extends _JNum, R>(op: Operation, lhs: JNumType, rhs: JNumType, kernel: BinaryOpKernel<LHS, RHS, R>): void;
export declare function registerBinaryOpCommutative<LHS extends _JNum, RHS extends _JNum, R>(op: Operation, lhs: JNumType, rhs: JNumType, kernel: BinaryOpKernel<LHS | RHS, RHS | LHS, R>): void;
export declare function getBinaryOp(op: Operation, lhs: JNumType, rhs: JNumType): ErasedBinaryOpKernel | null;
export declare function dispatchBinaryOp<R = _JNum>(op: Operation, lhs: _JNum, rhs: _JNum): R;
export declare function precomputeAllDispatchPlans(): void;
export interface PromotionRule {
    from: JNumType;
    to: JNumType;
    cost: number;
    apply(v: _JNum): _JNum;
}
export declare function registerPromotion(rule: PromotionRule): void;
export declare function promoteValue(v: _JNum, target: JNumType): _JNum;
export declare function precomputeReachableTypes(): void;
export declare function precomputePromotionPaths(): void;
type TypePredicate<T> = (x: unknown) => x is T;
type GuardedType<Pred> = Pred extends (x: unknown) => x is infer U ? U : never;
type GuardedTypeFn<Pred> = (x: GuardedType<Pred>) => _JNum;
export interface JNumConstructor<T, Pred extends TypePredicate<T>> {
    predicate: Pred;
    precedence: number;
    id: symbol;
    constructor: GuardedTypeFn<Pred>;
}
export declare function registerJNumConstructor<T>(constructor: JNumConstructor<T, TypePredicate<T>>): void;
export declare function getJNumConstructors(): JNumConstructor<unknown, TypePredicate<unknown>>[];
export declare const JNum: (x: unknown) => _JNum;
export {};
//# sourceMappingURL=jnum-runtime.d.ts.map