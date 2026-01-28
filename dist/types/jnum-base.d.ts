export type PrimitiveHint = "string" | "number" | "default";
export type JNumType = symbol;
export declare abstract class _JNum {
    abstract readonly type: JNumType;
    abstract isExact(): boolean;
    abstract isFinite(): boolean;
    abstract isNaN(): boolean;
    abstract normalize(): _JNum;
    abstract canDemote(): boolean;
    abstract demote(): _JNum;
    abstract [Symbol.toPrimitive](hint: string): number | string;
    abstract [Symbol.toStringTag](): string;
    toString(): string;
}
export declare abstract class ExactLike extends _JNum {
    isExact(): boolean;
}
export declare abstract class IntegerLike extends ExactLike {
    abstract toBigInt(): bigint;
}
export declare abstract class RealLike extends _JNum {
}
//# sourceMappingURL=jnum-base.d.ts.map