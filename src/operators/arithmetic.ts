import { JNum, reduceBinary, registerBinaryOp, registerBinaryOpCommutative, registerNAryOp, registerUnaryOp } from "jnum-runtime";
import { NaNNum } from "numerics/nan";
import { InfinityNum, InfinityNumType } from "numerics/infinity";
import { ComplexNum, ComplexNumType } from "numerics/complex";
import { InexactRealNum, InexactRealNumType } from "numerics/inexactreal";
import { RationalNum, RationalNumType } from "numerics/rational";
import { BigNum, BigNumType } from "numerics/bignum";
import { FixNum, FixNumType } from "numerics/fixnum";
import { ExactLike, IntegerLike, _JNum } from "jnum-base";
import { OP_ABS, OP_ADD, OP_DIV, OP_MUL, OP_NEG, OP_SUB } from "operators/op_names";

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

registerBinaryOpCommutative<InfinityNum, InexactRealNum, _JNum>(
    OP_ADD, InfinityNumType, InexactRealNumType, infiniteAddition
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

registerBinaryOpCommutative<InfinityNum, InexactRealNum, InfinityNum>(
    OP_SUB, InfinityNumType, InexactRealNumType, (a) => a.type === InfinityNumType ? InfinityNum.pos() : InfinityNum.neg()
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

registerBinaryOpCommutative<InfinityNum, InexactRealNum, _JNum>(
    OP_MUL, InfinityNumType, InexactRealNumType, infinityRealMultiplication
);

registerBinaryOpCommutative<InfinityNum, InexactRealNum, _JNum>(
    OP_MUL, InfinityNumType, ComplexNumType, infinityRealMultiplication
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

registerBinaryOp<InfinityNum, InexactRealNum, _JNum>(
    OP_DIV, InfinityNumType, InexactRealNumType, infinityOverRealDivision
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

registerBinaryOp<InexactRealNum, InfinityNum, _JNum>(
    OP_DIV, InexactRealNumType, InfinityNumType, infinityUnderRealDivision
);

// Unary Operations

registerUnaryOp<InfinityNum, InfinityNum>(OP_NEG, InfinityNumType,
    (a) => a.sign === 1 ? InfinityNum.neg() : InfinityNum.pos()
);

registerUnaryOp<InfinityNum, InfinityNum>(OP_ABS, InfinityNumType,
    () => InfinityNum.pos()
);

/* ============ ComplexNum =========== */

registerBinaryOp<ComplexNum, ComplexNum, _JNum>(
    OP_ADD, ComplexNumType, ComplexNumType, (a, b) => {
        return ComplexNum.create(
            JNum.add(a.real, b.real) as _JNum,
            JNum.add(a.imag, b.imag) as _JNum,
        );
    }
);

registerBinaryOp<ComplexNum, ComplexNum, _JNum>(
    OP_SUB, ComplexNumType, ComplexNumType, (a, b) => {
        return ComplexNum.create(
            JNum.sub(a.real, b.real) as _JNum,
            JNum.sub(a.imag, b.imag) as _JNum,
        );
    }
);

registerBinaryOp<ComplexNum, ComplexNum, _JNum>(
    OP_MUL, ComplexNumType, ComplexNumType, (a, b) => {
        const re = JNum.sub(
            JNum.mul(a.real, b.real) as _JNum,
            JNum.mul(a.imag, b.imag) as _JNum
        ) as _JNum;

        const im = JNum.add(
            JNum.mul(a.real, b.imag) as _JNum,
            JNum.mul(a.imag, b.real) as _JNum
        ) as _JNum;

        return ComplexNum.create(re, im);
    }
);

registerBinaryOp<ComplexNum, ComplexNum, _JNum>(
    OP_DIV, ComplexNumType, ComplexNumType, (a, b) => {
        const den = JNum.add(
            JNum.mul(b.real, b.real) as _JNum,
            JNum.mul(b.imag, b.imag) as _JNum,
        ) as _JNum;

        const re = JNum.div(
            JNum.add(
                JNum.mul(a.real, b.real) as _JNum,
                JNum.mul(a.imag, b.imag) as _JNum,
            ) as _JNum,
            den
        ) as _JNum;

        const im = JNum.div(
            JNum.sub(
                JNum.mul(a.imag, b.real) as _JNum,
                JNum.mul(a.real, b.imag) as _JNum,
            ) as _JNum,
            den
        ) as _JNum;

        return ComplexNum.create(re, im);
    }
);

/* =========== InexactRealNum ======== */

registerBinaryOp<InexactRealNum, InexactRealNum, _JNum>(
    OP_ADD, InexactRealNumType, InexactRealNumType, (a, b) => InexactRealNum.create(+a + +b)
);

registerBinaryOp<InexactRealNum, InexactRealNum, _JNum>(
    OP_SUB, InexactRealNumType, InexactRealNumType, (a, b) => InexactRealNum.create(+a - +b)
);

registerBinaryOp<InexactRealNum, InexactRealNum, _JNum>(
    OP_MUL, InexactRealNumType, InexactRealNumType, (a, b) => InexactRealNum.create(+a * +b)
);

registerBinaryOp<InexactRealNum, InexactRealNum, _JNum>(
    OP_DIV, InexactRealNumType, InexactRealNumType, (a, b) => {
        if (+b === 0)
            throw new Error("Attempted to divide by zero");
        return InexactRealNum.create(+a / +b)
    }
);

registerUnaryOp<InexactRealNum, _JNum>(OP_NEG, InexactRealNumType,
    (a) => InexactRealNum.create(-a.raw)
);

registerUnaryOp<InexactRealNum, _JNum>(OP_ABS, InexactRealNumType,
    (a) => InexactRealNum.create(Math.abs(a.raw))
);

/* =========== RationalNum =========== */

registerBinaryOp<RationalNum, RationalNum, _JNum>(
    OP_ADD, RationalNumType, RationalNumType,
    (a, b) => {
        const n =
            a.num.toBigInt() * b.den.toBigInt() +
            b.num.toBigInt() * a.den.toBigInt();

        const d = a.den.toBigInt() * b.den.toBigInt();

        return RationalNum.create(
            BigNum.create(n) as IntegerLike,
            BigNum.create(d) as IntegerLike,
            false,
        ) as RationalNum;
    }
);

registerBinaryOp<RationalNum, RationalNum, _JNum>(
    OP_SUB, RationalNumType, RationalNumType,
    (a, b) => {
        const n =
            a.num.toBigInt() * b.den.toBigInt() -
            b.num.toBigInt() * a.den.toBigInt();

        const d = a.den.toBigInt() * b.den.toBigInt();

        return RationalNum.create(
            BigNum.create(n) as IntegerLike,
            BigNum.create(d) as IntegerLike,
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
            BigNum.create(n) as IntegerLike,
            BigNum.create(d) as IntegerLike,
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
            BigNum.create(n) as IntegerLike,
            BigNum.create(d) as IntegerLike,
            false
        ) as RationalNum;
    }
);

registerUnaryOp<RationalNum, RationalNum>(OP_NEG, RationalNumType,
    (a) => RationalNum.create(
        BigNum.create(-a.num.toBigInt()) as IntegerLike,
        BigNum.create(-a.den.toBigInt()) as IntegerLike,
    ) as RationalNum
);

registerUnaryOp<RationalNum, RationalNum>(OP_ABS, RationalNumType,
    (a) => {
        const num = a.num.toBigInt();
        const den = a.den.toBigInt();
        return RationalNum.create(
            BigNum.create(num >= 0 ? num : -num) as IntegerLike,
            BigNum.create(den > 0 ? den : -den) as IntegerLike,
        ) as RationalNum
    }
);

/* ============== BigNum ============= */

function binaryOpSafe(op: (a: bigint, b: bigint) => bigint) {
    return (a: BigNum, b: BigNum) => {
        return BigNum.create(op(a.raw, b.raw))
    };
}

registerBinaryOp<BigNum, BigNum, _JNum>(
    OP_ADD, BigNumType, BigNumType, binaryOpSafe((a, b) => a + b)
);

registerBinaryOp<BigNum, BigNum, _JNum>(
    OP_SUB, BigNumType, BigNumType, binaryOpSafe((a, b) => a - b)
);

registerBinaryOp<BigNum, BigNum, _JNum>(
    OP_MUL, BigNumType, BigNumType, binaryOpSafe((a, b) => a * b)
);

registerBinaryOp<BigNum, BigNum, ExactLike>(OP_DIV, BigNumType, BigNumType,
    (a, b) => {
        return RationalNum.create(a, b);
    }
);

registerUnaryOp<BigNum, ExactLike>(OP_NEG, BigNumType,
    (a) => BigNum.create(-a.raw)
);

registerUnaryOp<BigNum, ExactLike>(OP_ABS, BigNumType,
    (a) => BigNum.create(a.raw > 0 ? a.raw : -a.raw)
);

/* ============== FixNum ============= */

registerBinaryOp<FixNum, FixNum, _JNum>(OP_ADD, FixNumType, FixNumType,
    (a, b) => {
        const r = a.toBigInt() + b.toBigInt();

        if (r >= FixNum.MIN && r <= FixNum.MAX)
            return FixNum.create(Number(r));

        return BigNum.create(r);
    }
);

registerBinaryOp<FixNum, FixNum, _JNum>(OP_SUB, FixNumType, FixNumType,
    (a, b) => {
        const r = a.toBigInt() - b.toBigInt();

        if (r >= FixNum.MIN && r <= FixNum.MAX)
            return FixNum.create(Number(r));

        return BigNum.create(r);
    }
);

registerBinaryOp<FixNum, FixNum, _JNum>(OP_MUL, FixNumType, FixNumType,
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

registerUnaryOp<FixNum, ExactLike>(OP_NEG, FixNumType,
    (a) => FixNum.create(-a.raw)
);

registerUnaryOp<FixNum, ExactLike>(OP_ABS, FixNumType,
    (a) => FixNum.create(Math.abs(a.raw))
);
