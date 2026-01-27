import { PrimitiveHint, _JNum } from "jnum-base";
export declare const NaNNumType: unique symbol;
export declare class NaNNum extends _JNum {
    readonly type: symbol;
    private constructor();
    static create(): NaNNum;
    isExact(): boolean;
    isFinite(): boolean;
    isNaN(): boolean;
    normalize(): _JNum;
    canDemote(): boolean;
    demote(): _JNum;
    get raw(): number;
    [Symbol.toPrimitive](hint: PrimitiveHint): number | "NaN";
    [Symbol.toStringTag](): string;
}
//# sourceMappingURL=nan.d.ts.map