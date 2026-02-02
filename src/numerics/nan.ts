import {
    PrimitiveHint,
    _JNum,
} from "../jnum-base";

export const NaNNumType = Symbol("NaNNum");

export class NaNNum extends _JNum {
    public readonly type = NaNNumType;

    private constructor() { super(); }

    public static create(): NaNNum { return new NaNNum(); }

    public override isExact(): boolean { return false; }
    public override isFinite(): boolean { return false; }
    public override isNaN(): boolean { return true; }

    public override normalize(): _JNum { return this; }
    public override canDemote(): boolean { return false; }
    public override demote(): _JNum { return this; }

    public get raw(): number { return NaN; }

    public override[Symbol.toPrimitive](hint: PrimitiveHint) {
        if (hint === "string") return "NaN";
        return NaN;
    }

    public override[Symbol.toStringTag]() {
        return "NaNNum";
    }
}
