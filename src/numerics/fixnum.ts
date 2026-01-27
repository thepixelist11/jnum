import {
    PrimitiveHint,
    _JNum,
    IntegerLike,
} from "jnum-base";

import {
    registerType,
} from "jnum-runtime";

export const FixNumType = Symbol("FixNum");

export class FixNum extends IntegerLike {
    public readonly type = FixNumType;

    public static readonly MIN = Number.MIN_SAFE_INTEGER;
    public static readonly MAX = Number.MAX_SAFE_INTEGER;

    private readonly value: number;

    private constructor(value: number) {
        super();
        this.value = value;
    }

    public static create(value: number): FixNum {
        value = Math.trunc(value);

        if (value < FixNum.MIN || value > FixNum.MAX)
            throw new Error(`FixNum out of range: ${value}`);

        return new FixNum(value);
    }

    public override isExact(): boolean { return true; }
    public override isFinite(): boolean { return Number.isFinite(this.value); }
    public override isNaN(): boolean { return Number.isNaN(this.value); }

    public override normalize(): _JNum { return this; }
    public override canDemote(): boolean { return false; }
    public override demote(): _JNum { return this; }

    public override toBigInt(): bigint { return BigInt(this.value); }

    public get raw(): number { return this.value; }

    public override[Symbol.toPrimitive](hint: PrimitiveHint) {
        if (hint === "string") return this.value.toString();
        return this.value;
    }

    public override[Symbol.toStringTag]() {
        return "FixNum";
    }
}

registerType({
    id: FixNumType,
    name: "FixNum",
    exact: true,
    integer: true,
});

