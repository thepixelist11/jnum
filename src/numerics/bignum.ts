import {
    PrimitiveHint,
    _JNum,
    IntegerLike,
} from "jnum-base";

import {
    registerType,
    registerPromotion,
    registerJNumConstructor,
} from "jnum-runtime";

import { NaNNum } from "numerics/nan";
import { InfinityNum } from "numerics/infinity";
import { FixNum, FixNumType } from "numerics/fixnum";

export const BigNumType = Symbol("BigNum");

export class BigNum extends IntegerLike {
    public readonly type = BigNumType;

    private readonly value: bigint;

    private constructor(value: bigint) {
        super();
        this.value = value;
    }

    public static create(value: bigint | number): _JNum {
        if (Number.isNaN(value))
            return NaNNum.create();

        if (value === Infinity)
            return InfinityNum.pos();

        if (value === -Infinity)
            return InfinityNum.neg();

        if (typeof value === "number" && !Number.isInteger(value))
            throw new Error("Expected an integer for BigNum");

        return new BigNum(BigInt(value));
    }

    public override isExact(): boolean { return true; }
    public override isFinite(): boolean { return true; }
    public override isNaN(): boolean { return false; }

    public override normalize(): _JNum { return this; }
    public override canDemote(): boolean {
        return FixNum.MIN <= this.value && this.value <= FixNum.MAX;
    }
    public override demote(): _JNum {
        return this.canDemote()
            ? FixNum.create(Number(this.value))
            : this;
    }

    public override toBigInt(): bigint { return this.value; }

    public get raw(): bigint { return this.value; }

    public override[Symbol.toPrimitive](hint: PrimitiveHint) {
        if (hint === "string") return this.value.toString();
        return Number(this.value);
    }

    public override[Symbol.toStringTag]() {
        return "BigNum";
    }
}

registerType({
    id: BigNumType,
    name: "BigNum",
    exact: true,
    integer: true,
});

/* ============ PROMOTIONS =========== */

registerPromotion({
    from: FixNumType,
    to: BigNumType,
    cost: 1,
    apply: (v: _JNum) => {
        if (!(v instanceof FixNum)) throw new Error("Expected FixNum for promotion");
        return BigNum.create(v.toBigInt());
    }
});

/* ============ CONSTRUCTOR ========== */

// FIXME: Precision loss at 1e23

registerJNumConstructor({
    precedence: 10,
    predicate: (x): x is number =>
        typeof x === "number" &&
        Number.isInteger(x),
    id: Symbol("BigNum:Number"),
    constructor: (x: number) => BigNum.create(BigInt(x))
});

registerJNumConstructor({
    precedence: 10,
    predicate: (x): x is bigint =>
        typeof x === "bigint",
    id: Symbol("BigNum:BigInt"),
    constructor: (x: bigint) => BigNum.create(x)
});

registerJNumConstructor({
    precedence: 10,
    predicate: (x): x is string =>
        typeof x === "string" &&
        /^\d+n?$/.test(x) &&
        Number.isInteger(BigInt(x)),
    id: Symbol("BigNum:String"),
    constructor: (x) => BigNum.create(BigInt(x))
});
