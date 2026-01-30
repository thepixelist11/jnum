import {
    PrimitiveHint,
    _JNum,
    IntegerLike,
} from "jnum-base";

import {
    registerType,
    registerJNumConstructor,
} from "jnum-runtime";
import { NaNNum } from "numerics/nan";
import { InfinityNum } from "numerics/infinity";

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

    public static create(value: number): _JNum {
        if (Number.isNaN(value))
            return NaNNum.create();

        if (value === Infinity)
            return InfinityNum.pos();

        if (value === -Infinity)
            return InfinityNum.neg();

        value = Math.trunc(value);

        if (value < FixNum.MIN || value > FixNum.MAX)
            throw new Error(`FixNum out of range: ${value}`);

        return new FixNum(value);
    }

    public override isExact(): boolean { return true; }
    public override isFinite(): boolean { return true; }
    public override isNaN(): boolean { return false; }

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

/* ============ CONSTRUCTOR ========== */

registerJNumConstructor({
    precedence: 5,
    predicate: (x): x is number => typeof x === "number" && Number.isSafeInteger(x),
    id: Symbol("FixNum:Number"),
    constructor: (x: number) => FixNum.create(x)
});

registerJNumConstructor({
    precedence: 5,
    predicate: (x): x is bigint =>
        typeof x === "bigint" &&
        FixNum.MIN <= Number(x) && Number(x) <= FixNum.MAX,
    id: Symbol("FixNum:BigInt"),
    constructor: (x: bigint) => FixNum.create(Number(x))
});

registerJNumConstructor({
    precedence: 5,
    predicate: (x): x is string =>
        typeof x === "string" &&
        Number.isSafeInteger(Number(x)),
    id: Symbol("FixNum:String"),
    constructor: (x) => FixNum.create(Number(x))
});
