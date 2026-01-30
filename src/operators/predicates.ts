import { registerBinaryOp, JNum } from "jnum-runtime";
import { BigNum, BigNumType } from "numerics/bignum";
import { FixNum, FixNumType } from "numerics/fixnum";
import { RationalNum, RationalNumType } from "numerics/rational";
import { InexactRealNum, InexactRealNumType } from "numerics/inexactreal";
import { ComplexNum, ComplexNumType } from "numerics/complex";
import { OP_EQ, OP_NEQ, OP_LT, OP_LTE, OP_GT, OP_GTE } from "operators/op_names";

/* =========== ComplexNum ============ */

registerBinaryOp<ComplexNum, ComplexNum, boolean>(OP_EQ, ComplexNumType, ComplexNumType,
    (a, b) => JNum.eq(a.real, b.real) && JNum.eq(a.imag, b.imag)
);

registerBinaryOp<ComplexNum, ComplexNum, boolean>(OP_EQ, ComplexNumType, ComplexNumType,
    (a, b) => !JNum.eq(a.real, b.real) || !JNum.eq(a.imag, b.imag)
);

/* ========= InexactRealNum ========== */

registerBinaryOp<InexactRealNum, InexactRealNum, boolean>(OP_LT, InexactRealNumType, InexactRealNumType,
    (a, b) => a.raw < b.raw
);

registerBinaryOp<InexactRealNum, InexactRealNum, boolean>(OP_LTE, InexactRealNumType, InexactRealNumType,
    (a, b) => a.raw <= b.raw
);

registerBinaryOp<InexactRealNum, InexactRealNum, boolean>(OP_GT, InexactRealNumType, InexactRealNumType,
    (a, b) => a.raw > b.raw
);

registerBinaryOp<InexactRealNum, InexactRealNum, boolean>(OP_GTE, InexactRealNumType, InexactRealNumType,
    (a, b) => a.raw >= b.raw
);

registerBinaryOp<InexactRealNum, InexactRealNum, boolean>(OP_EQ, InexactRealNumType, InexactRealNumType,
    (a, b) => a.raw === b.raw
);

registerBinaryOp<InexactRealNum, InexactRealNum, boolean>(OP_NEQ, InexactRealNumType, InexactRealNumType,
    (a, b) => a.raw !== b.raw
);

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
