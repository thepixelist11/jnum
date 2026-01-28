import { PrimitiveHint, _JNum, RealLike } from "jnum-base";
export declare const InexactRealNumType: unique symbol;
export declare class InexactRealNum extends RealLike {
    readonly type: symbol;
    private readonly value;
    private constructor();
    static create(value: number): _JNum;
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
//# sourceMappingURL=inexactreal.d.ts.map