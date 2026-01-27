import { PrimitiveHint, _JNum, IntegerLike } from "jnum-base";
export declare const FixNumType: unique symbol;
export declare class FixNum extends IntegerLike {
    readonly type: symbol;
    static readonly MIN: number;
    static readonly MAX: number;
    private readonly value;
    private constructor();
    static create(value: number): FixNum;
    isExact(): boolean;
    isFinite(): boolean;
    isNaN(): boolean;
    normalize(): _JNum;
    canDemote(): boolean;
    demote(): _JNum;
    toBigInt(): bigint;
    get raw(): number;
    [Symbol.toPrimitive](hint: PrimitiveHint): string | number;
    [Symbol.toStringTag](): string;
}
//# sourceMappingURL=fixnum.d.ts.map