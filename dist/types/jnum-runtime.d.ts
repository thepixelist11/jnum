import { _JNum, JNumType } from "jnum-base";
export type RegisteredType = {
    id: JNumType;
    name?: string;
    exact?: boolean;
    integer?: boolean;
};
export declare function registerType(t: RegisteredType): void;
export type Operation = "add" | "sub" | "mul" | "div" | "pow" | "lt" | "lte" | "gt" | "gte" | "eq";
export type BinaryOpKernel<LHS extends _JNum = _JNum, RHS extends _JNum = _JNum, R = _JNum> = (lhs: LHS, rhs: RHS) => R;
type ErasedBinaryOpKernel = (lhs: _JNum, rhs: _JNum) => unknown;
export declare function registerBinaryOp<LHS extends _JNum, RHS extends _JNum, R>(op: Operation, lhs: JNumType, rhs: JNumType, kernel: BinaryOpKernel<LHS, RHS, R>): void;
export declare function getBinaryOp(op: Operation, lhs: JNumType, rhs: JNumType): ErasedBinaryOpKernel | null;
export declare function dispatchBinaryOp<R = _JNum>(op: Operation, lhs: _JNum, rhs: _JNum): R;
export declare function precomputeAllDispatchPlans(): void;
export type PromotionRule = {
    from: JNumType;
    to: JNumType;
    cost: number;
    apply(v: _JNum): _JNum;
};
export declare function registerPromotion(rule: PromotionRule): void;
export declare function promoteValue(v: _JNum, target: JNumType): _JNum;
export declare function precomputeReachableTypes(): void;
export declare function precomputePromotionPaths(): void;
export {};
//# sourceMappingURL=jnum-runtime.d.ts.map