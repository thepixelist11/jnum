type JNumConstructor = number | bigint;
type PrimitiveHint = "string" | "number" | "default";

enum JNumType {
    FIXNUM = 0,
    BIGNUM = 1,
    RATIONAL = 2,
    REAL = 3,
    COMPLEX = 4,
};

abstract class _JNum {
    abstract readonly type: JNumType;
    abstract isExact(): boolean;
    abstract normalize(): _JNum;
    abstract canDemote(): boolean;
    abstract demote(): _JNum;
    abstract promoteTo(target: JNumType): _JNum;

    abstract [Symbol.toPrimitive](hint: string): unknown;
    abstract [Symbol.toStringTag](): string;

    isInteger(): boolean { return this.type <= JNumType.BIGNUM; }
    isRational(): boolean { return this.type <= JNumType.RATIONAL; }
    isReal(): boolean { return this.type <= JNumType.REAL; }
    isComplex(): boolean { return this.type <= JNumType.COMPLEX; }
}

abstract class ExactNum extends _JNum {
    public override isExact() { return true; };
}

abstract class InexactNum extends _JNum {
    public override isExact() { return false; };
}

abstract class IntegerNum extends ExactNum {
    public abstract fitsFixnum(): boolean;
    public abstract toBigInt(): bigint;
}

abstract class RealNum extends _JNum { }

class FixNum extends IntegerNum {
    public readonly type = JNumType.FIXNUM;

    public static readonly MIN = Number.MIN_SAFE_INTEGER;
    public static readonly MAX = Number.MAX_SAFE_INTEGER;

    private readonly value: number;

    private constructor(value: number) {
        super();
        this.value = value;
    }

    public static create(value: number): FixNum {
        if (!Number.isInteger(value))
            value = Math.trunc(value);

        if (value < FixNum.MIN || value > FixNum.MAX)
            throw new Error(`Value out of fixnum range: expected ${value} to be between ${FixNum.MIN} and ${FixNum.MAX}`);

        return new FixNum(value);
    }

    public override[Symbol.toStringTag]() { return "FixNum"; }
    public override[Symbol.toPrimitive](hint: PrimitiveHint) {
        if (hint === "string")
            return this.raw.toString();

        return this.raw;
    }

    public override normalize(): _JNum { return this; }
    public override canDemote(): boolean { return false; }
    public override demote(): _JNum { return this; }

    public override promoteTo(target: JNumType.FIXNUM): FixNum;
    public override promoteTo(target: JNumType.BIGNUM): BigNum;
    public override promoteTo(target: JNumType.RATIONAL): RationalNum;
    public override promoteTo(target: JNumType.REAL): RealNum;
    public override promoteTo(target: JNumType.COMPLEX): ComplexNum;
    public override promoteTo(target: JNumType): _JNum {
        switch (target) {
            case JNumType.FIXNUM:
                return this;

            case JNumType.BIGNUM:
                return BigNum.create(this.value);

            case JNumType.RATIONAL:
                return RationalNum.create(this, FixNum.create(1));

            case JNumType.REAL:
                return ExactRealNum.create(this.promoteTo(JNumType.RATIONAL));

            case JNumType.COMPLEX:
                return ComplexNum.create(this, FixNum.create(0));

            default:
                throw new Error(`Cannot promote FixNum directly to ${JNumType[target]}`);
        }
    }

    public override fitsFixnum(): boolean { return true; }
    public override toBigInt(): bigint { return BigInt(this.value); }

    public get raw(): number { return this.value; }
}

class BigNum extends IntegerNum {
    public readonly type = JNumType.BIGNUM;

    private readonly value: bigint;

    private constructor(value: bigint) {
        super();
        this.value = value;
    }

    public static create(value: bigint | number): IntegerNum {
        if (FixNum.MIN <= value && value <= FixNum.MAX)
            return FixNum.create(Number(value));

        value = typeof value === "bigint" ? value : BigInt(Math.trunc(value));
        return new BigNum(value);
    }

    public override[Symbol.toStringTag]() { return "BigNum"; }
    public override[Symbol.toPrimitive](hint: PrimitiveHint) {
        if (hint === "string")
            return this.raw.toString();

        return this.raw;
    }

    public override normalize(): _JNum { return BigNum.create(this.value); }
    public override canDemote(): boolean {
        return FixNum.MIN <= this.value && this.value <= FixNum.MAX;
    }
    public override demote(): _JNum {
        return this.canDemote()
            ? FixNum.create(Number(this.value))
            : this;
    }

    public override promoteTo(target: JNumType.FIXNUM): never;
    public override promoteTo(target: JNumType.BIGNUM): BigNum;
    public override promoteTo(target: JNumType.RATIONAL): RationalNum;
    public override promoteTo(target: JNumType.REAL): RealNum;
    public override promoteTo(target: JNumType.COMPLEX): ComplexNum;
    public override promoteTo(target: JNumType): _JNum {
        switch (target) {
            case JNumType.BIGNUM:
                return this;

            case JNumType.RATIONAL:
                return RationalNum.create(this, FixNum.create(1));

            case JNumType.REAL:
                return ExactRealNum.create(this.promoteTo(JNumType.RATIONAL));

            case JNumType.COMPLEX:
                return ComplexNum.create(this, FixNum.create(0));

            default:
                throw new Error(`Cannot promote BigNum directly to ${JNumType[target]}`);
        }
    }

    public override fitsFixnum(): boolean { return this.canDemote(); }
    public override toBigInt(): bigint { return this.value; }

    public get raw(): bigint { return this.value; }
}

class RationalNum extends ExactNum {
    public readonly type = JNumType.RATIONAL;

    public readonly numerator: IntegerNum;
    public readonly denominator: IntegerNum;

    private constructor(numerator: IntegerNum, denominator: IntegerNum) {
        super();
        this.numerator = numerator;
        this.denominator = denominator;
    }

    public static create(numerator: IntegerNum, denominator: IntegerNum): _JNum {
        const n = numerator.toBigInt();
        const d = denominator.toBigInt();

        if (d === 0n) throw new Error("Rational denominator must be non-zero");

        let nn = n;
        let dd = d;
        if (dd < 0n) {
            nn = -nn;
            dd = -dd;
        }

        const g = RationalNum.gcd(nn < 0n ? -nn : nn, dd);
        nn /= g;
        dd /= g;

        if (dd === 1n) {
            return BigNum.create(nn);
        }

        return new RationalNum(
            BigNum.create(nn),
            BigNum.create(dd),
        )
    }

    public override[Symbol.toStringTag]() { return "RationalNum"; }
    public override[Symbol.toPrimitive](hint: PrimitiveHint) {
        const raw = this.numerator.toBigInt() / this.denominator.toBigInt();

        if (hint === "string")
            return raw.toString();

        return raw;
    }

    public override normalize(): _JNum { return RationalNum.create(this.numerator, this.denominator); }
    public override canDemote(): boolean { return this.denominator.toBigInt() === 1n; }
    public override demote(): _JNum {
        return this.canDemote()
            ? BigNum.create(this.numerator.toBigInt())
            : this;
    }

    public override promoteTo(target: JNumType.FIXNUM | JNumType.BIGNUM): never;
    public override promoteTo(target: JNumType.RATIONAL): RationalNum;
    public override promoteTo(target: JNumType.REAL): RealNum;
    public override promoteTo(target: JNumType.COMPLEX): ComplexNum;
    public override promoteTo(target: JNumType): _JNum {
        switch (target) {
            case JNumType.RATIONAL:
                return this;

            case JNumType.REAL:
                return ExactRealNum.create(this);

            case JNumType.COMPLEX:
                return ComplexNum.create(this, FixNum.create(0));

            default:
                throw new Error(`Cannot promote RationalNum directly to ${JNumType[target]}`);
        }
    }

    private static gcd(a: bigint, b: bigint): bigint {
        let x = a;
        let y = b;
        while (y !== 0n) {
            [x, y] = [y, x % y];
        }

        return x;
    }
}

class InexactRealNum extends InexactNum implements RealNum {
    public readonly type = JNumType.REAL;

    public readonly value: number;

    private constructor(value: number) {
        super();
        this.value = value;
    }

    public static create(value: number): InexactRealNum {
        return new InexactRealNum(value);
    }

    public override[Symbol.toStringTag]() { return "InexactRealNum"; }
    public override[Symbol.toPrimitive](hint: PrimitiveHint) {
        if (hint === "string")
            return this.raw.toString();

        return this.raw;
    }

    public override normalize(): _JNum { return this; }
    public override canDemote(): boolean {
        return (
            Number.isFinite(this.value) &&
            Number.isInteger(this.value) &&
            this.value >= FixNum.MIN &&
            this.value <= FixNum.MAX
        );
    }

    public override demote(): _JNum {
        if (!this.canDemote()) return this;
        const n = this.value;
        return FixNum.create(n);
    }

    public override promoteTo(target: JNumType.RATIONAL | JNumType.BIGNUM | JNumType.FIXNUM): never;
    public override promoteTo(target: JNumType.REAL): RealNum;
    public override promoteTo(target: JNumType.COMPLEX): ComplexNum;
    public override promoteTo(target: JNumType): _JNum {
        switch (target) {
            case JNumType.REAL:
                return this;

            case JNumType.COMPLEX:
                return ComplexNum.create(this, FixNum.create(0));

            default:
                throw new Error(`Cannot promote InexactRealNum directly to ${JNumType[target]}`);
        }
    }

    public ToInexact(): InexactRealNum { return this; }

    public get raw(): number { return this.value; }
}

class ExactRealNum extends ExactNum implements RealNum {
    public readonly type = JNumType.REAL;

    public readonly value: RationalNum;

    private constructor(value: RationalNum) {
        super();
        this.value = value;
    }

    public override[Symbol.toStringTag]() { return "ExactRealNum"; }
    public override[Symbol.toPrimitive](hint: PrimitiveHint) {
        if (hint === "string")
            return this.value.toString();

        return +this.value;
    }

    public static create(value: RationalNum): ExactRealNum { return new ExactRealNum(value); }

    public override normalize(): _JNum {
        const v = this.value.normalize();
        return v instanceof RationalNum
            ? new ExactRealNum(v)
            : v;
    }

    public override canDemote(): boolean { return this.value.canDemote(); }
    public override demote(): _JNum {
        return this.canDemote()
            ? this.value.demote()
            : this;
    }

    public override promoteTo(target: JNumType.RATIONAL | JNumType.BIGNUM | JNumType.FIXNUM): never;
    public override promoteTo(target: JNumType.REAL): RealNum;
    public override promoteTo(target: JNumType.COMPLEX): ComplexNum;
    public override promoteTo(target: JNumType): _JNum {
        switch (target) {
            case JNumType.REAL:
                return this;

            case JNumType.COMPLEX:
                return ComplexNum.create(this, FixNum.create(0));

            default:
                throw new Error(`Cannot promote ExactRealNum directly to ${JNumType[target]}`);
        }
    }

    public toInexact(): never { throw new Error("ExactRealNum cannot be implicitly converted to inexact"); }
}

class ComplexNum extends _JNum {
    public readonly type = JNumType.COMPLEX;

    public readonly real: RealNum;
    public readonly imag: RealNum;

    private constructor(real: RealNum, imag: RealNum) {
        super();
        this.real = real;
        this.imag = imag;
    }

    public static create(real: RealNum, imag: RealNum): _JNum {
        const r = real.normalize();
        const i = imag.normalize();

        if (!r.isReal() || !i.isReal())
            throw new Error("ComplexNum components must be real-valued");

        if (JNum.isZero(i)) return r;

        return new ComplexNum(r, i);
    }

    public override[Symbol.toStringTag]() { return "ComplexNum"; }
    public override[Symbol.toPrimitive]() {
        return `${this.real.toString()}+${this.imag.toString()}i`;
    }

    public override isExact(): boolean { return this.real.isExact() && this.imag.isExact(); }

    public override normalize(): _JNum { return ComplexNum.create(this.real, this.imag); }
    public override canDemote(): boolean { return JNum.isZero(this.imag); }
    public override demote(): _JNum {
        return this.canDemote()
            ? this.real.normalize()
            : this;
    }

    public override promoteTo(target: JNumType.REAL | JNumType.RATIONAL | JNumType.BIGNUM | JNumType.FIXNUM): never;
    public override promoteTo(target: JNumType.COMPLEX): ComplexNum;
    public override promoteTo(target: JNumType): _JNum {
        switch (target) {
            case JNumType.COMPLEX:
                return this;

            default:
                throw new Error(`Cannot promote ComplexNum directly to ${JNumType[target]}`);
        }
    }
}

export const JNum = (function () {
    function JNum(num: JNumConstructor): _JNum {
        console.log(`creating: ${num}`);
        return FixNum.create(0);
    }

    JNum.isZero = (num: _JNum): boolean => {
        if (num instanceof FixNum) return num.raw === 0;
        if (num instanceof BigNum) return num.raw === 0n;
        if (num instanceof RationalNum) return num.numerator.toBigInt() === 0n;
        if (num instanceof InexactRealNum) return num.raw === 0;
        if (num instanceof ExactRealNum) return JNum.isZero(num.value);
        if (num instanceof ComplexNum) return JNum.isZero(num.real) && JNum.isZero(num.imag);

        throw new Error("Unknown JNum subclass in isZero");
    }

    return JNum;
})();
