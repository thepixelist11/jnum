import { OrderedMap } from "utils/ordered-map";

export type PrimitiveHint = "string" | "number" | "default";

export type JNumType = symbol;

export abstract class _JNum {
    abstract readonly type: JNumType;

    abstract isExact(): boolean;
    abstract isFinite(): boolean;
    abstract isNaN(): boolean;

    abstract normalize(): _JNum;
    abstract canDemote(): boolean;
    abstract demote(): _JNum;

    abstract [Symbol.toPrimitive](hint: string): number | string;
    abstract [Symbol.toStringTag](): string;

    toString(): string { return `${this}` };
}

export abstract class ExactLike extends _JNum {
    public override isExact() { return true; };
}

export abstract class IntegerLike extends ExactLike {
    public abstract toBigInt(): bigint;
}

export abstract class RealLike extends _JNum { }
