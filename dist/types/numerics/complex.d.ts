import { _JNum, RealLike } from "jnum-base";
export declare const ComplexNumType: unique symbol;
export declare class ComplexNum extends _JNum {
    readonly type: symbol;
    private readonly _real;
    private readonly _imag;
    private constructor();
    static create(real: _JNum, imag: _JNum): _JNum;
    get real(): RealLike;
    get imag(): RealLike;
    isExact(): boolean;
    isFinite(): boolean;
    isNaN(): boolean;
    normalize(): _JNum;
    canDemote(): boolean;
    demote(): _JNum;
    [Symbol.toStringTag](): string;
    [Symbol.toPrimitive](): string;
}
//# sourceMappingURL=complex.d.ts.map