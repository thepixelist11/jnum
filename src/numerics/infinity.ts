import {
    PrimitiveHint,
    _JNum,
} from "jnum-base";

export const InfinityNumType = Symbol("InfinityNum");

export class InfinityNum extends _JNum {
    public readonly type = InfinityNumType;

    public readonly sign: 1 | -1;

    private constructor(sign: 1 | -1) {
        super();
        this.sign = sign;
    }

    public static create(sign: 1 | -1): InfinityNum { return new InfinityNum(sign); }
    public static pos() { return new InfinityNum(1); }
    public static neg() { return new InfinityNum(-1); }

    public override isExact(): boolean { return false; }
    public override isFinite(): boolean { return false; }
    public override isNaN(): boolean { return false; }

    public override normalize(): _JNum { return this; }
    public override canDemote(): boolean { return false; }
    public override demote(): _JNum { return this; }

    public get raw(): number { return NaN; }

    public override[Symbol.toPrimitive](hint: PrimitiveHint) {
        if (hint === "string") return `${this.sign === 1 ? "" : "-"}Infinity`;
        return this.sign === 1 ? Infinity : -Infinity;
    }

    public override[Symbol.toStringTag]() {
        return "InfinityNum";
    }
}
