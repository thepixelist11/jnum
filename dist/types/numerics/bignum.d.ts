import { PrimitiveHint, _JNum, IntegerLike } from "jnum-base";
export declare const BigNumType: unique symbol;
export declare class BigNum extends IntegerLike {
    readonly type: symbol;
    private readonly value;
    private constructor();
    static create(value: bigint | number): BigNum;
    isExact(): boolean;
    isFinite(): boolean;
    isNaN(): boolean;
    normalize(): _JNum;
    canDemote(): boolean;
    demote(): _JNum;
    toBigInt(): bigint;
    get raw(): bigint;
    [Symbol.toPrimitive](hint: PrimitiveHint): string | number;
    [Symbol.toStringTag](): string;
}
//# sourceMappingURL=bignum.d.ts.map