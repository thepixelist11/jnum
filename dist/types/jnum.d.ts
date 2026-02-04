export { allBinaryOperations, allOperations, dispatchBinaryOp, dispatchUnaryOp, getBinaryOp, getJNumConstructors, JNum, precomputeAllUnaryDispatchPlans, precomputeAllBinaryDispatchPlans, precomputePromotionPaths, precomputeReachableTypes, promoteValue, reduceBinary, registerBinaryOp, registerBinaryOpCommutative, registerJNumConstructor, registerNAryOp, registerNAryOpOnType, registerPromotion, registerType, registerUnaryOp, } from "./jnum-runtime";
export type { Operation } from "./jnum-runtime";
export { _JNum, } from "./jnum-base";
export type { PrimitiveHint, JNumType, } from "./jnum-base";
export declare const OPS: {
    readonly OP_ADD: "add";
    readonly OP_SUB: "sub";
    readonly OP_MUL: "mul";
    readonly OP_DIV: "div";
    readonly OP_LT: "lt";
    readonly OP_LTE: "lte";
    readonly OP_GT: "gt";
    readonly OP_GTE: "gte";
    readonly OP_EQ: "eq";
    readonly OP_NEQ: "neq";
    readonly OP_ABS: "abs";
    readonly OP_NEG: "neg";
};
//# sourceMappingURL=jnum.d.ts.map