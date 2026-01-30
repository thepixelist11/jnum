import {
    PrimitiveHint,
    _JNum,
    IntegerLike,
    ExactLike,
} from "jnum-base";

import {
    registerType,
    registerPromotion,
    JNum,
    promoteValue,
    registerJNumConstructor,
} from "jnum-runtime";

import { FixNum, FixNumType } from "numerics/fixnum";
import { BigNum, BigNumType } from "numerics/bignum";
import { InfinityNum } from "numerics/infinity";
import { NaNNum } from "numerics/nan";
import { has } from "utils/utils";

export const RationalNumType = Symbol("RationalNum");

export class RationalNum extends ExactLike {
    public readonly type = RationalNumType;

    public readonly num: IntegerLike;
    public readonly den: IntegerLike;

    private constructor(num: IntegerLike, den: IntegerLike) {
        super();
        this.num = num;
        this.den = den;
    }

    public static create(num: IntegerLike, den: IntegerLike, demote = true): _JNum {
        if (!den.isFinite()) throw new Error("Expected Rational denominator to be finite");

        const n = num.toBigInt();
        const d = den.toBigInt();

        if (d === 0n) throw new Error("Rational denominator must be non-zero");

        let nn = n;
        let dd = d;
        if (dd < 0n) {
            nn = -nn;
            dd = -dd;
        }

        const g = RationalNum.gcd(nn < 0n ? -nn : nn, dd);
        nn /= g;
        dd /= g;

        if (demote && dd === 1n)
            return BigNum.create(nn);

        return new RationalNum(
            BigNum.create(nn) as IntegerLike,
            BigNum.create(dd) as IntegerLike,
        )
    }

    public static createFromDecimal(x: number | bigint) {
        if (typeof x === "bigint") return BigNum.create(x);

        if (Number.isNaN(x))
            return NaNNum.create();

        if (x === Infinity)
            return InfinityNum.pos();

        if (x === -Infinity)
            return InfinityNum.neg();

        const s = x.toString();

        if (!s.includes("."))
            return BigNum.create(BigInt(s));

        const [int_part, frac_part] = s.split(".");
        const scale = 10n ** BigInt(frac_part.length);

        const num = BigInt(int_part) * scale + BigInt(frac_part);

        return RationalNum.create(
            BigNum.create(num) as IntegerLike,
            BigNum.create(scale) as IntegerLike,
        );
    }

    public override isExact(): boolean { return true; }
    public override isFinite(): boolean { return this.num.isFinite(); }
    public override isNaN(): boolean { return this.num.isNaN() || this.den.isNaN(); }

    public override normalize(): _JNum { return RationalNum.create(this.num, this.den); }
    public override canDemote(): boolean {
        return (
            this.num.canDemote() ||
            this.den.canDemote() ||
            this.den.toBigInt() === 1n ||
            this.num.toBigInt() === this.den.toBigInt()
        );
    }

    public override demote(): _JNum {
        if (!this.canDemote()) return this;

        const num = this.num.demote() as IntegerLike;
        const den = this.den.demote() as IntegerLike;

        if (den.toBigInt() === 1n)
            return num;

        return RationalNum.create(num, den);
    }

    public static gcd(a: bigint, b: bigint): bigint {
        let x = a;
        let y = b;
        while (y !== 0n) {
            [x, y] = [y, x % y];
        }

        return x;
    }

    public override[Symbol.toPrimitive](hint: PrimitiveHint) {
        const raw = Number(this.num.toBigInt()) / Number(this.den.toBigInt());

        if (hint === "string")
            return `${this.num}/${this.den}`;

        return raw;
    }

    public override[Symbol.toStringTag]() {
        return "RationalNum";
    }
}

registerType({
    id: RationalNumType,
    name: "RationalNum",
    exact: true,
    integer: true,
});

/* ============ PROMOTIONS =========== */

registerPromotion({
    from: BigNumType,
    to: RationalNumType,
    cost: 1,
    apply: (v: BigNum) => {
        if (!(v instanceof BigNum))
            throw new Error("Expected a BigNum");

        return RationalNum.create(
            BigNum.create(v.toBigInt()) as IntegerLike,
            BigNum.create(1n) as IntegerLike,
            false,
        );
    }
});

registerPromotion({
    from: FixNumType,
    to: RationalNumType,
    cost: 1,
    apply: (v: FixNum) => {
        if (!(v instanceof FixNum))
            throw new Error("Expected a FixNum");

        return RationalNum.create(
            BigNum.create(v.toBigInt()) as IntegerLike,
            BigNum.create(1n) as IntegerLike,
            false,
        );
    }
});

/* ============ CONSTRUCTOR ========== */

registerJNumConstructor({
    precedence: 10,
    predicate: (x): x is number =>
        typeof x === "number" &&
        !Number.isInteger(x),
    id: Symbol("RationalNum:Number"),
    constructor: (x: number) => RationalNum.createFromDecimal(x)
});

registerJNumConstructor({
    precedence: 10,
    predicate: (x): x is string =>
        typeof x === "string" &&
        !Number.isInteger(Number(x)) &&
        !Number.isNaN(Number(x)),
    id: Symbol("RationalNum:StringDec"),
    constructor: (x: string) => RationalNum.createFromDecimal(Number(x))
});

registerJNumConstructor({
    precedence: 10,
    predicate: (x): x is string =>
        typeof x === "string" &&
        /^[\d.]+\/[\d.]+$/.test(x),
    id: Symbol("RationalNum:StringFrac"),
    constructor: (x: string) => {
        const [num, den] = /^([\d.])+\/([\d.])+$/.exec(x)!.slice(1);
        const nnum = Number(num);
        const nden = Number(den);
        return RationalNum.create(
            BigNum.create(nnum) as IntegerLike,
            BigNum.create(nden) as IntegerLike,
        )
    }
});

registerJNumConstructor({
    precedence: 10,
    predicate: (x): x is { num: unknown, den: unknown } =>
        x !== null &&
        typeof x === "object" &&
        has(x, "num") &&
        has(x, "den"),
    id: Symbol("RationalNum:ObjFrac"),
    constructor: (x: { num: unknown, den: unknown }) => {
        return RationalNum.create(
            promoteValue(JNum(x.num), BigNumType) as IntegerLike,
            promoteValue(JNum(x.den), BigNumType) as IntegerLike,
        )
    }
});
