import { registerBinaryOp } from "jnum-runtime";
import { RationalNum, RationalNumType } from "numerics/rational";
import { BigNum, BigNumType } from "numerics/bignum";
import { FixNum, FixNumType } from "numerics/fixnum";
import { ExactLike, IntegerLike } from "jnum-base";

/* =========== RationalNum =========== */

registerBinaryOp<RationalNum, RationalNum, RationalNum>(
    "add", RationalNumType, RationalNumType,
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
    "sub", RationalNumType, RationalNumType,
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

registerBinaryOp<FixNum, FixNum, ExactLike>("div", FixNumType, FixNumType,
    (a, b) => {
        return RationalNum.create(a, b);
    }
);

registerBinaryOp<BigNum, BigNum, ExactLike>("div", BigNumType, BigNumType,
    (a, b) => {
        return RationalNum.create(a, b);
    }
);

/* ============== BigNum ============= */

function binaryOpSafe(op: (a: bigint, b: bigint) => bigint) {
    return (a: BigNum, b: BigNum) => {
        return BigNum.create(op(a.raw, b.raw))
    };
}

registerBinaryOp<BigNum, BigNum, BigNum>(
    "add", BigNumType, BigNumType, binaryOpSafe((a, b) => a + b)
);

registerBinaryOp<BigNum, BigNum, BigNum>(
    "sub", BigNumType, BigNumType, binaryOpSafe((a, b) => a - b)
);

registerBinaryOp<BigNum, BigNum, BigNum>(
    "mul", BigNumType, BigNumType, binaryOpSafe((a, b) => a * b)
);

/* ============== FixNum ============= */

registerBinaryOp<FixNum, FixNum, IntegerLike>("add", FixNumType, FixNumType,
    (a, b) => {
        const r = a.toBigInt() + b.toBigInt();

        if (r >= FixNum.MIN && r <= FixNum.MAX)
            return FixNum.create(Number(r));

        return BigNum.create(r);
    }
);

registerBinaryOp<FixNum, FixNum, IntegerLike>("sub", FixNumType, FixNumType,
    (a, b) => {
        const r = a.toBigInt() - b.toBigInt();

        if (r >= FixNum.MIN && r <= FixNum.MAX)
            return FixNum.create(Number(r));

        return BigNum.create(r);
    }
);

registerBinaryOp<FixNum, FixNum, IntegerLike>("mul", FixNumType, FixNumType,
    (a, b) => {
        const r = a.toBigInt() * b.toBigInt();

        if (r >= FixNum.MIN && r <= FixNum.MAX)
            return FixNum.create(Number(r));

        return BigNum.create(r);
    }
);
