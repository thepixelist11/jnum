import {
    PrimitiveHint,
    _JNum,
    IntegerLike
} from "jnum-base";

import {
    registerType,
    registerPromotion,
} from "jnum-runtime";

import { FixNum, FixNumType } from "numerics/fixnum";

export const BigNumType = Symbol("BigNum");

export class BigNum extends IntegerLike {
    public readonly type = BigNumType;

    private readonly value: bigint;

    private constructor(value: bigint) {
        super();
        this.value = value;
    }

    public static create(value: bigint | number): BigNum {
        if (typeof value === "number")
            value = BigInt(Math.trunc(value));

        return new BigNum(value);
    }

    public override isExact(): boolean { return true; }
    public override isFinite(): boolean { return true; }
    public override isNaN(): boolean { return Number.isNaN(this.value); }

    public override normalize(): _JNum { return this; }
    public override canDemote(): boolean {
        return FixNum.MIN <= this.value && this.value <= FixNum.MAX;
    }
    public override demote(): _JNum {
        return this.canDemote()
            ? FixNum.create(Number(this.value))
            : this;
    }

    public override toBigInt(): bigint { return BigInt(this.value); }

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

