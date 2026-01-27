import { PrimitiveHint, _JNum, IntegerLike, ExactLike } from "jnum-base";
export declare const RationalNumType: unique symbol;
export declare class RationalNum extends ExactLike {
    readonly type: symbol;
    readonly num: IntegerLike;
    readonly den: IntegerLike;
    private constructor();
    static create(num: IntegerLike, den: IntegerLike, demote?: boolean): _JNum;
    static createFromDecimal(x: number | bigint): _JNum;
    isExact(): boolean;
    isFinite(): boolean;
    isNaN(): boolean;
    normalize(): _JNum;
    canDemote(): boolean;
    demote(): _JNum;
    static gcd(a: bigint, b: bigint): bigint;
    [Symbol.toPrimitive](hint: PrimitiveHint): string | number;
    [Symbol.toStringTag](): string;
}
//# sourceMappingURL=rational.d.ts.map