import {
    PrimitiveHint,
    _JNum,
    RealLike,
} from "jnum-base";

import {
    registerType,
    registerPromotion,
    registerJNumConstructor,
} from "jnum-runtime";

import { FixNum, FixNumType } from "numerics/fixnum";
import { BigNum, BigNumType } from "numerics/bignum";
import { InfinityNum } from "numerics/infinity";
import { NaNNum } from "numerics/nan";
import { RationalNumType } from "./rational";

export const InexactRealNumType = Symbol("InexactRealNum");

export class InexactRealNum extends RealLike {
    public readonly type = InexactRealNumType;

    private readonly value: number;

    private constructor(value: number) {
        super();
        this.value = value;
    }

    public static create(value: number): _JNum {
        if (Number.isNaN(value))
            return NaNNum.create();

        if (value === Infinity)
            return InfinityNum.pos();

        if (value === -Infinity)
            return InfinityNum.neg();

        return new InexactRealNum(value);
    }

    public override isExact(): boolean { return true; }
    public override isFinite(): boolean { return true; }
    public override isNaN(): boolean { return Number.isNaN(this.value); }

    public override normalize(): _JNum { return this; }
    public override canDemote(): boolean {
        return (
            Number.isFinite(this.value) &&
            Number.isInteger(this.value)
        );
    }
    public override demote(): _JNum {
        return this.canDemote()
            ? BigNum.create(BigInt(this.value))
            : this;
    }

    public get raw(): number { return this.value; }

    public override[Symbol.toPrimitive](hint: PrimitiveHint) {
        if (hint === "string") return this.value.toString();
        return this.value;
    }

    public override[Symbol.toStringTag]() {
        return "InexactRealNum";
    }
}

registerType({
    id: InexactRealNumType,
    name: "InexactRealNum",
    exact: false,
    integer: false,
});

/* ============ CONSTRUCTOR ========== */

registerJNumConstructor({
    precedence: 100,
    predicate: (x): x is number =>
        typeof x === "number",
    id: Symbol("InexactRealNum:Number"),
    constructor: (x: number) => {
        return InexactRealNum.create(x);
    }
});

registerJNumConstructor({
    precedence: 100,
    predicate: (x): x is string =>
        typeof x === "string" &&
        !Number.isNaN(Number(x)),
    id: Symbol("InexactRealNum:String"),
    constructor: (x) => {
        const num = Number(x);
        if (Number.isNaN(num))
            return NaNNum.create();

        if (!Number.isFinite(num))
            return InfinityNum.create(Math.sign(num) as 1 | -1);

        return InexactRealNum.create(num);
    }
});

/* ============ PROMOTIONS =========== */

// WARN: Promotions of exact to inexact numbers may lose precision.

registerPromotion({
    from: FixNumType,
    to: InexactRealNumType,
    cost: 1,
    apply: (v: _JNum) => {
        if (!(v instanceof FixNum)) throw new Error("Expected FixNum for promotion");
        return InexactRealNum.create(+v);
    }
});

registerPromotion({
    from: BigNumType,
    to: InexactRealNumType,
    cost: 1,
    apply: (v: _JNum) => {
        if (!(v instanceof BigNum)) throw new Error("Expected BigNum for promotion");
        return InexactRealNum.create(+v);
    }
});

registerPromotion({
    from: RationalNumType,
    to: InexactRealNumType,
    cost: 1,
    apply: (v: _JNum) => {
        if (!(v instanceof BigNum)) throw new Error("Expected RationalNum for promotion");
        return InexactRealNum.create(+v);
    }
});
