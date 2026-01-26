type PrimitiveHint = "string" | "number" | "default";
export declare enum JNumType {
    FIXNUM = 0,
    BIGNUM = 1,
    RATIONAL = 2,
    REAL = 3,
    COMPLEX = 4
}
interface JNumByType {
    [JNumType.FIXNUM]: FixNum;
    [JNumType.BIGNUM]: BigNum;
    [JNumType.RATIONAL]: RationalNum;
    [JNumType.REAL]: RealNum;
    [JNumType.COMPLEX]: ComplexNum;
}
declare abstract class _JNum {
    abstract readonly type: JNumType;
    abstract isExact(): boolean;
    abstract isFinite(): boolean;
    abstract isNaN(): boolean;
    abstract normalize(): _JNum;
    abstract canDemote(): boolean;
    abstract demote(): _JNum;
    abstract promoteTo<T extends JNumType>(target: T): JNumByType[T];
    abstract [Symbol.toPrimitive](hint: string): number | string;
    abstract [Symbol.toStringTag](): string;
    isInteger(): boolean;
    isRational(): boolean;
    isReal(): boolean;
    isComplex(): boolean;
    toString(): string;
}
declare abstract class ExactNum extends _JNum {
    isExact(): boolean;
}
declare abstract class IntegerNum extends ExactNum {
    abstract fitsFixnum(): boolean;
    abstract toBigInt(): bigint;
}
declare abstract class RealNum extends _JNum {
}
declare class FixNum extends IntegerNum {
    readonly type = JNumType.FIXNUM;
    static readonly MIN: number;
    static readonly MAX: number;
    private readonly value;
    private constructor();
    static create(value: number): FixNum;
    [Symbol.toStringTag](): string;
    [Symbol.toPrimitive](hint: PrimitiveHint): string | number;
    isFinite(): boolean;
    isNaN(): boolean;
    normalize(): _JNum;
    canDemote(): boolean;
    demote(): _JNum;
    promoteTo(target: JNumType.FIXNUM): FixNum;
    promoteTo(target: JNumType.BIGNUM): BigNum;
    promoteTo(target: JNumType.RATIONAL): RationalNum;
    promoteTo(target: JNumType.REAL): RealNum;
    promoteTo(target: JNumType.COMPLEX): ComplexNum;
    fitsFixnum(): boolean;
    toBigInt(): bigint;
    get raw(): number;
}
declare class BigNum extends IntegerNum {
    readonly type = JNumType.BIGNUM;
    private readonly value;
    private constructor();
    static create(value: bigint | number, demote?: boolean): IntegerNum;
    [Symbol.toStringTag](): string;
    [Symbol.toPrimitive](hint: PrimitiveHint): string | number;
    isFinite(): boolean;
    isNaN(): boolean;
    normalize(): _JNum;
    canDemote(): boolean;
    demote(): _JNum;
    promoteTo(target: JNumType.FIXNUM): never;
    promoteTo(target: JNumType.BIGNUM): BigNum;
    promoteTo(target: JNumType.RATIONAL): RationalNum;
    promoteTo(target: JNumType.REAL): RealNum;
    promoteTo(target: JNumType.COMPLEX): ComplexNum;
    fitsFixnum(): boolean;
    toBigInt(): bigint;
    get raw(): bigint;
}
declare class RationalNum extends ExactNum {
    readonly type = JNumType.RATIONAL;
    readonly numerator: IntegerNum;
    readonly denominator: IntegerNum;
    private constructor();
    static create(numerator: IntegerNum, denominator: IntegerNum, demote?: boolean): _JNum;
    static createFromDecimal(x: number | bigint): _JNum;
    [Symbol.toStringTag](): string;
    [Symbol.toPrimitive](hint: PrimitiveHint): string | number;
    isFinite(): boolean;
    isNaN(): boolean;
    normalize(): _JNum;
    canDemote(): boolean;
    demote(): _JNum;
    promoteTo(target: JNumType.BIGNUM | JNumType.FIXNUM): never;
    promoteTo(target: JNumType.RATIONAL): RationalNum;
    promoteTo(target: JNumType.REAL): RealNum;
    promoteTo(target: JNumType.COMPLEX): ComplexNum;
    static gcd(a: bigint, b: bigint): bigint;
}
declare class ComplexNum extends _JNum {
    readonly type = JNumType.COMPLEX;
    readonly real: RealNum;
    readonly imag: RealNum;
    private constructor();
    static create(real: RealNum, imag: RealNum, demote?: boolean): _JNum;
    [Symbol.toStringTag](): string;
    [Symbol.toPrimitive](): string;
    isExact(): boolean;
    isFinite(): boolean;
    isNaN(): boolean;
    normalize(): _JNum;
    canDemote(): boolean;
    demote(): _JNum;
    promoteTo(target: JNumType.REAL | JNumType.RATIONAL | JNumType.BIGNUM | JNumType.FIXNUM): never;
    promoteTo(target: JNumType.COMPLEX): ComplexNum;
}
type JNumIntegerConstructor = number | IntegerNum | bigint;
type JNumRealConstructor = number | RealNum | bigint;
type JNumConstructor = number | bigint | _JNum | {
    real: JNumRealConstructor;
    imag: JNumRealConstructor;
} | {
    num: JNumIntegerConstructor;
    den: JNumIntegerConstructor;
};
export declare const JNum: {
    (num: JNumConstructor, exact?: boolean): _JNum;
    isZero(num: _JNum): boolean;
    add: (lhs: _JNum, rhs: _JNum) => _JNum;
    sub: (lhs: _JNum, rhs: _JNum) => _JNum;
    mul: (lhs: _JNum, rhs: _JNum) => _JNum;
    div: (lhs: _JNum, rhs: _JNum) => _JNum;
};
export {};
//# sourceMappingURL=jnum.d.ts.map