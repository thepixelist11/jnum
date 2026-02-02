export { NaNNum, NaNNumType } from "numerics/nan";
export { InfinityNum, InfinityNumType } from "numerics/infinity";

export {
    allBinaryOperations,
    allOperations,
    dispatchBinaryOp,
    dispatchUnaryOp,
    getBinaryOp,
    getJNumConstructors,
    JNum,
    precomputeAllDispatchPlans,
    precomputePromotionPaths,
    precomputeReachableTypes,
    promoteValue,
    reduceBinary,
    registerBinaryOp,
    registerBinaryOpCommutative,
    registerJNumConstructor,
    registerNAryOp,
    registerNAryOpOnType,
    registerPromotion,
    registerType,
    registerUnaryOp,
    registerNaNPromotionsForType,
    registerNaNOperator,
} from "jnum-runtime";

export {
    _JNum,
    ExactLike,
    IntegerLike
} from "jnum-base";

import {
    OP_ADD,
    OP_SUB,
    OP_MUL,
    OP_DIV,
    OP_LT,
    OP_LTE,
    OP_GT,
    OP_GTE,
    OP_EQ,
    OP_NEQ,
    OP_ABS,
    OP_NEG
} from "operators/op_names";

export const OPS = {
    OP_ADD,
    OP_SUB,
    OP_MUL,
    OP_DIV,
    OP_LT,
    OP_LTE,
    OP_GT,
    OP_GTE,
    OP_EQ,
    OP_NEQ,
    OP_ABS,
    OP_NEG
} as const;
