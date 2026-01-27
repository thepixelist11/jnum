import { registerBinaryOp } from "jnum-runtime";
import { BigNum, BigNumType } from "numerics/bignum";
import { FixNum, FixNumType } from "numerics/fixnum";
import { RationalNum, RationalNumType } from "numerics/rational";

export const OP_LT = "lt" as const;
export const OP_LTE = "lte" as const;
export const OP_GT = "gt" as const;
export const OP_GTE = "gte" as const;
export const OP_EQ = "eq" as const;
export const OP_NEQ = "neq" as const;

/* =========== RationalNum =========== */

function rationalCompare(a: RationalNum, b: RationalNum): number {
    const lhs = a.num.toBigInt() * b.den.toBigInt();
    const rhs = b.num.toBigInt() * a.den.toBigInt();
    if (lhs < rhs) return -1;
    if (lhs > rhs) return 1;
    return 0;
}

registerBinaryOp<RationalNum, RationalNum, boolean>(OP_LT, RationalNumType, RationalNumType,
    (a, b) => rationalCompare(a, b) < 0
);

registerBinaryOp<RationalNum, RationalNum, boolean>(OP_LTE, RationalNumType, RationalNumType,
    (a, b) => rationalCompare(a, b) <= 0
);

registerBinaryOp<RationalNum, RationalNum, boolean>(OP_GT, RationalNumType, RationalNumType,
    (a, b) => rationalCompare(a, b) > 0
);

registerBinaryOp<RationalNum, RationalNum, boolean>(OP_GTE, RationalNumType, RationalNumType,
    (a, b) => rationalCompare(a, b) >= 0
);

registerBinaryOp<RationalNum, RationalNum, boolean>(OP_EQ, RationalNumType, RationalNumType,
    (a, b) => rationalCompare(a, b) === 0
);

registerBinaryOp<RationalNum, RationalNum, boolean>(OP_NEQ, RationalNumType, RationalNumType,
    (a, b) => rationalCompare(a, b) !== 0
);

/* ============== BigNum ============= */

registerBinaryOp<BigNum, BigNum, boolean>(OP_LT, BigNumType, BigNumType,
    (a, b) => a.raw < b.raw
);

registerBinaryOp<BigNum, BigNum, boolean>(OP_LTE, BigNumType, BigNumType,
    (a, b) => a.raw <= b.raw
);

registerBinaryOp<BigNum, BigNum, boolean>(OP_GT, BigNumType, BigNumType,
    (a, b) => a.raw > b.raw
);

registerBinaryOp<BigNum, BigNum, boolean>(OP_GTE, BigNumType, BigNumType,
    (a, b) => a.raw >= b.raw
);

registerBinaryOp<BigNum, BigNum, boolean>(OP_EQ, BigNumType, BigNumType,
    (a, b) => a.raw === b.raw
);

registerBinaryOp<BigNum, BigNum, boolean>(OP_NEQ, BigNumType, BigNumType,
    (a, b) => a.raw !== b.raw
);

/* ============== FixNum ============= */

registerBinaryOp<FixNum, FixNum, boolean>(OP_LT, FixNumType, FixNumType,
    (a, b) => a.raw < b.raw
);

registerBinaryOp<FixNum, FixNum, boolean>(OP_LTE, FixNumType, FixNumType,
    (a, b) => a.raw <= b.raw
);

registerBinaryOp<FixNum, FixNum, boolean>(OP_GT, FixNumType, FixNumType,
    (a, b) => a.raw > b.raw
);

registerBinaryOp<FixNum, FixNum, boolean>(OP_GTE, FixNumType, FixNumType,
    (a, b) => a.raw >= b.raw
);

registerBinaryOp<FixNum, FixNum, boolean>(OP_EQ, FixNumType, FixNumType,
    (a, b) => a.raw === b.raw
);

registerBinaryOp<FixNum, FixNum, boolean>(OP_NEQ, FixNumType, FixNumType,
    (a, b) => a.raw !== b.raw
);
