declare enum JNumType {
    FIXNUM = 0,
    BIGNUM = 1,
    RATIONAL = 2,
    REAL = 3,
    COMPLEX = 4
}
declare abstract class _JNum {
    abstract readonly type: JNumType;
    abstract isExact(): boolean;
    abstract isFinite(): boolean;
    abstract isNaN(): boolean;
    abstract normalize(): _JNum;
    abstract canDemote(): boolean;
    abstract demote(): _JNum;
    abstract promoteTo(target: JNumType): _JNum;
    abstract [Symbol.toPrimitive](hint: string): unknown;
    abstract [Symbol.toStringTag](): string;
    isExactInteger(): boolean;
    isRational(): boolean;
    isReal(): boolean;
    isComplex(): boolean;
}
type JNumIntegerConstructor = number | bigint;
type JNumRealConstructor = number | bigint;
type JNumConstructor = number | bigint | {
    real: JNumRealConstructor;
    imag: JNumRealConstructor;
} | {
    num: JNumIntegerConstructor;
    den: JNumIntegerConstructor;
};
export declare const JNum: {
    (num: JNumConstructor, exact?: boolean): _JNum;
    isZero(num: _JNum): boolean;
};
export {};
//# sourceMappingURL=jnum.d.ts.map