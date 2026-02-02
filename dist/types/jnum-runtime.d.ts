import { _JNum, JNumType } from "./jnum-base";
export interface RegisteredType {
    id: JNumType;
    name?: string;
    exact?: boolean;
    integer?: boolean;
}
export declare function registerType(t: RegisteredType): void;
export type UnaryOpKernel<T extends _JNum = _JNum, R = unknown> = (arg: T) => R;
export declare function registerUnaryOp<T extends _JNum = _JNum, R = _JNum>(op: Operation, type: JNumType, kernel: UnaryOpKernel<T, R>): void;
export declare function dispatchUnaryOp<R = _JNum>(op: Operation, arg: _JNum): R;
export type Operation = string;
export type BinaryOpKernel<LHS extends _JNum = _JNum, RHS extends _JNum = _JNum, R = _JNum> = (lhs: LHS, rhs: RHS) => R;
type ErasedBinaryOpKernel = (lhs: _JNum, rhs: _JNum) => unknown;
export declare function allBinaryOperations(): Iterable<Operation>;
export declare function allOperations(): Iterable<Operation>;
export declare function registerBinaryOp<LHS extends _JNum, RHS extends _JNum, R>(op: Operation, lhs: JNumType, rhs: JNumType, kernel: BinaryOpKernel<LHS, RHS, R>): void;
export declare function registerBinaryOpCommutative<LHS extends _JNum, RHS extends _JNum, R>(op: Operation, lhs: JNumType, rhs: JNumType, kernel: BinaryOpKernel<LHS | RHS, RHS | LHS, R>): void;
export declare function getBinaryOp(op: Operation, lhs: JNumType, rhs: JNumType): ErasedBinaryOpKernel | null;
export declare function dispatchBinaryOp<R = _JNum>(op: Operation, lhs: _JNum, rhs: _JNum): R;
export declare function precomputeAllDispatchPlans(): void;
export type NAryKernel<R = _JNum> = (args: readonly _JNum[]) => R;
export declare function registerNAryOp<R = _JNum>(op: Operation, kernel: NAryKernel<R>): void;
export declare function registerNAryOpOnType<R = _JNum>(op: Operation, target: JNumType, kernel: (args: readonly _JNum[]) => R): void;
export declare function reduceBinary(op: Operation, args: readonly _JNum[], reverse?: boolean): _JNum;
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
type JNumObj<T = _JNum> = ((x: unknown) => T);
type JNumOp<T> = (...args: _JNum[]) => T;
type JNumWithOps<T = unknown> = Record<string, JNumOp<T>> & JNumObj;
export declare const JNum: JNumWithOps;
export {};
//# sourceMappingURL=jnum-runtime.d.ts.map