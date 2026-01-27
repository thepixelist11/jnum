import { registerBinaryOp, registerBinaryOpCommutative } from "jnum-runtime";
import { NaNNum } from "numerics/nan";
import { InfinityNum, InfinityNumType } from "numerics/infinity";
import { RationalNum, RationalNumType } from "numerics/rational";
import { BigNum, BigNumType } from "numerics/bignum";
import { FixNum, FixNumType } from "numerics/fixnum";
import { ExactLike, IntegerLike, _JNum } from "jnum-base";

/* ========= Operation Names ========= */

export const OP_ADD = "add" as const;
export const OP_MUL = "mul" as const;
export const OP_SUB = "sub" as const;
export const OP_DIV = "div" as const;

/* =========== InfinityNum =========== */

// Addition

registerBinaryOp<InfinityNum, InfinityNum, _JNum>(
    OP_ADD, InfinityNumType, InfinityNumType,
    (a, b) => {
        return a.sign === b.sign
            ? a
            : NaNNum.create()
    }
);

function infiniteAddition(a: _JNum, b: _JNum): _JNum {
    if (a.type === InfinityNumType)
        return a;
    return b;
}

registerBinaryOpCommutative<InfinityNum, FixNum, _JNum>(
    OP_ADD, InfinityNumType, FixNumType, infiniteAddition
)

registerBinaryOpCommutative<InfinityNum, BigNum, _JNum>(
    OP_ADD, InfinityNumType, FixNumType, infiniteAddition
)

registerBinaryOpCommutative<InfinityNum, RationalNum, _JNum>(
    OP_ADD, InfinityNumType, FixNumType, infiniteAddition
)

// Subtraction

registerBinaryOp<InfinityNum, InfinityNum, _JNum>(
    OP_SUB, InfinityNumType, InfinityNumType,
    (a, b) => {
        return a.sign === b.sign
            ? NaNNum.create()
            : a
    }
);

registerBinaryOpCommutative<InfinityNum, FixNum, InfinityNum>(
    OP_SUB, InfinityNumType, FixNumType, (a) => a.type === InfinityNumType ? InfinityNum.pos() : InfinityNum.neg()
);

registerBinaryOpCommutative<InfinityNum, BigNum, InfinityNum>(
    OP_SUB, InfinityNumType, BigNumType, (a) => a.type === InfinityNumType ? InfinityNum.pos() : InfinityNum.neg()
);

registerBinaryOpCommutative<InfinityNum, RationalNum, InfinityNum>(
    OP_SUB, InfinityNumType, RationalNumType, (a) => a.type === InfinityNumType ? InfinityNum.pos() : InfinityNum.neg()
);

// Multiplication

registerBinaryOp<InfinityNum, InfinityNum, _JNum>(
    OP_MUL, InfinityNumType, InfinityNumType,
    (a, b) => a.sign * b.sign === 1 ? InfinityNum.pos() : InfinityNum.neg()
);

function infinityRealMultiplication(a: _JNum, b: _JNum) {
    const sign = Math.sign(+a) * Math.sign(+b);
    if (sign === 0) return NaNNum.create();
    return sign === 1 ? InfinityNum.pos() : InfinityNum.neg();
}

registerBinaryOpCommutative<InfinityNum, FixNum, _JNum>(
    OP_MUL, InfinityNumType, FixNumType, infinityRealMultiplication
);

registerBinaryOpCommutative<InfinityNum, BigNum, _JNum>(
    OP_MUL, InfinityNumType, BigNumType, infinityRealMultiplication
);

registerBinaryOpCommutative<InfinityNum, RationalNum, _JNum>(
    OP_MUL, InfinityNumType, RationalNumType, infinityRealMultiplication
);

// Division

registerBinaryOp<InfinityNum, InfinityNum, NaNNum>(
    OP_DIV, InfinityNumType, InfinityNumType, NaNNum.create
);

function infinityOverRealDivision(a: InfinityNum, b: _JNum) {
    const sign = Math.sign(+a) * Math.sign(+b);
    if (sign === 0) return NaNNum.create();
    return sign === 1 ? InfinityNum.pos() : InfinityNum.neg();
}

registerBinaryOp<InfinityNum, FixNum, _JNum>(
    OP_DIV, InfinityNumType, FixNumType, infinityOverRealDivision
);

registerBinaryOp<InfinityNum, BigNum, _JNum>(
    OP_DIV, InfinityNumType, BigNumType, infinityOverRealDivision
);

registerBinaryOp<InfinityNum, RationalNum, _JNum>(
    OP_DIV, InfinityNumType, RationalNumType, infinityOverRealDivision
);

function infinityUnderRealDivision(a: _JNum, b: InfinityNum) {
    const sign = Math.sign(+a) * Math.sign(+b);
    if (sign === 0) return NaNNum.create();
    return sign === 1 ? FixNum.create(0) : FixNum.create(-0);
}

registerBinaryOp<FixNum, InfinityNum, _JNum>(
    OP_DIV, FixNumType, InfinityNumType, infinityUnderRealDivision
);

registerBinaryOp<BigNum, InfinityNum, _JNum>(
    OP_DIV, BigNumType, InfinityNumType, infinityUnderRealDivision
);

registerBinaryOp<RationalNum, InfinityNum, _JNum>(
    OP_DIV, RationalNumType, InfinityNumType, infinityUnderRealDivision
);

/* =========== RationalNum =========== */

registerBinaryOp<RationalNum, RationalNum, RationalNum>(
    OP_ADD, RationalNumType, RationalNumType,
    (a, b) => {
        const n =
            a.num.toBigInt() * b.den.toBigInt() +
            b.num.toBigInt() * a.den.toBigInt();

        const d = a.den.toBigInt() * b.den.toBigInt();

        return RationalNum.create(
            BigNum.create(n),
            BigNum.create(d),
            false,
        ) as RationalNum;
    }
);

registerBinaryOp<RationalNum, RationalNum, RationalNum>(
    OP_SUB, RationalNumType, RationalNumType,
    (a, b) => {
        const n =
            a.num.toBigInt() * b.den.toBigInt() -
            b.num.toBigInt() * a.den.toBigInt();

        const d = a.den.toBigInt() * b.den.toBigInt();

        return RationalNum.create(
            BigNum.create(n),
            BigNum.create(d),
            false,
        ) as RationalNum;
    }
);

registerBinaryOp<RationalNum, RationalNum, RationalNum>(
    OP_MUL, RationalNumType, RationalNumType,
    (a, b) => {
        const n = a.num.toBigInt() * b.num.toBigInt();
        const d = a.den.toBigInt() * b.den.toBigInt();

        return RationalNum.create(
            BigNum.create(n),
            BigNum.create(d),
            false
        ) as RationalNum;
    }
);

registerBinaryOp<RationalNum, RationalNum, RationalNum>(
    OP_DIV, RationalNumType, RationalNumType,
    (a, b) => {
        const n = a.num.toBigInt() * b.den.toBigInt();
        const d = a.den.toBigInt() * b.num.toBigInt();

        return RationalNum.create(
            BigNum.create(n),
            BigNum.create(d),
            false
        ) as RationalNum;
    }
);

/* ============== BigNum ============= */

function binaryOpSafe(op: (a: bigint, b: bigint) => bigint) {
    return (a: BigNum, b: BigNum) => {
        return BigNum.create(op(a.raw, b.raw))
    };
}

registerBinaryOp<BigNum, BigNum, BigNum>(
    OP_ADD, BigNumType, BigNumType, binaryOpSafe((a, b) => a + b)
);

registerBinaryOp<BigNum, BigNum, BigNum>(
    OP_SUB, BigNumType, BigNumType, binaryOpSafe((a, b) => a - b)
);

registerBinaryOp<BigNum, BigNum, BigNum>(
    OP_MUL, BigNumType, BigNumType, binaryOpSafe((a, b) => a * b)
);

registerBinaryOp<BigNum, BigNum, ExactLike>(OP_DIV, BigNumType, BigNumType,
    (a, b) => {
        return RationalNum.create(a, b);
    }
);

/* ============== FixNum ============= */

registerBinaryOp<FixNum, FixNum, IntegerLike>(OP_ADD, FixNumType, FixNumType,
    (a, b) => {
        const r = a.toBigInt() + b.toBigInt();

        if (r >= FixNum.MIN && r <= FixNum.MAX)
            return FixNum.create(Number(r));

        return BigNum.create(r);
    }
);

registerBinaryOp<FixNum, FixNum, IntegerLike>(OP_SUB, FixNumType, FixNumType,
    (a, b) => {
        const r = a.toBigInt() - b.toBigInt();

        if (r >= FixNum.MIN && r <= FixNum.MAX)
            return FixNum.create(Number(r));

        return BigNum.create(r);
    }
);

registerBinaryOp<FixNum, FixNum, IntegerLike>(OP_MUL, FixNumType, FixNumType,
    (a, b) => {
        const r = a.toBigInt() * b.toBigInt();

        if (r >= FixNum.MIN && r <= FixNum.MAX)
            return FixNum.create(Number(r));

        return BigNum.create(r);
    }
);

registerBinaryOp<FixNum, FixNum, ExactLike>(OP_DIV, FixNumType, FixNumType,
    (a, b) => {
        return RationalNum.create(a, b);
    }
);

