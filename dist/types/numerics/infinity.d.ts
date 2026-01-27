import { PrimitiveHint, _JNum } from "jnum-base";
export declare const InfinityNumType: unique symbol;
export declare class InfinityNum extends _JNum {
    readonly type: symbol;
    readonly sign: 1 | -1;
    private constructor();
    static create(sign: 1 | -1): InfinityNum;
    static pos(): InfinityNum;
    static neg(): InfinityNum;
    isExact(): boolean;
    isFinite(): boolean;
    isNaN(): boolean;
    normalize(): _JNum;
    canDemote(): boolean;
    demote(): _JNum;
    get raw(): number;
    [Symbol.toPrimitive](hint: PrimitiveHint): string | number;
    [Symbol.toStringTag](): string;
}
//# sourceMappingURL=infinity.d.ts.map