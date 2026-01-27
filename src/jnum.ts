// type PrimitiveHint = "string" | "number" | "default";
//
// export enum JNumType {
//     FIXNUM = 0,
//     BIGNUM = 1,
//     RATIONAL = 2,
//     REAL = 3,
//     COMPLEX = 4,
// };
//
// type PromotionTable = {
//     [A in JNumType]: {
//         [B in JNumType]?: JNumType
//     }
// };
//
// const PROMOTE: PromotionTable = {
//     [JNumType.FIXNUM]: {
//         [JNumType.FIXNUM]: JNumType.FIXNUM,
//         [JNumType.BIGNUM]: JNumType.BIGNUM,
//         [JNumType.RATIONAL]: JNumType.RATIONAL,
//         [JNumType.REAL]: JNumType.REAL,
//         [JNumType.COMPLEX]: JNumType.COMPLEX,
//     },
//     [JNumType.BIGNUM]: {
//         [JNumType.BIGNUM]: JNumType.BIGNUM,
//         [JNumType.RATIONAL]: JNumType.RATIONAL,
//         [JNumType.REAL]: JNumType.REAL,
//         [JNumType.COMPLEX]: JNumType.COMPLEX,
//     },
//     [JNumType.RATIONAL]: {
//         [JNumType.RATIONAL]: JNumType.RATIONAL,
//         [JNumType.REAL]: JNumType.REAL,
//         [JNumType.COMPLEX]: JNumType.COMPLEX,
//     },
//     [JNumType.REAL]: {
//         [JNumType.REAL]: JNumType.REAL,
//         [JNumType.COMPLEX]: JNumType.COMPLEX,
//     },
//     [JNumType.COMPLEX]: {
//         [JNumType.COMPLEX]: JNumType.COMPLEX,
//     },
// } as const;
//
// interface JNumByType {
//     [JNumType.FIXNUM]: FixNum;
//     [JNumType.BIGNUM]: BigNum;
//     [JNumType.RATIONAL]: RationalNum;
//     [JNumType.REAL]: RealNum;
//     [JNumType.COMPLEX]: ComplexNum;
// };
//
// abstract class _JNum {
//     abstract readonly type: JNumType;
//     abstract isExact(): boolean;
//     abstract isFinite(): boolean;
//     abstract isNaN(): boolean;
//     abstract normalize(): _JNum;
//     abstract canDemote(): boolean;
//     abstract demote(): _JNum;
//     abstract promoteTo<T extends JNumType>(target: T): JNumByType[T];
//
//     abstract [Symbol.toPrimitive](hint: string): number | string;
//     abstract [Symbol.toStringTag](): string;
//
//     isInteger(): boolean { return this.type <= JNumType.BIGNUM && !this.isNaN(); }
//     isRational(): boolean { return this.type <= JNumType.RATIONAL && !this.isNaN(); }
//     isReal(): boolean { return this.type <= JNumType.REAL && !this.isNaN(); }
//     isComplex(): boolean { return this.type <= JNumType.COMPLEX && !this.isNaN(); }
//     toString(): string { return `${this}` };
// }
//
// abstract class ExactNum extends _JNum {
//     public override isExact() { return true; };
// }
//
// abstract class InexactNum extends _JNum {
//     public override isExact() { return false; };
// }
//
// abstract class IntegerNum extends ExactNum {
//     public abstract fitsFixnum(): boolean;
//     public abstract toBigInt(): bigint;
// }
//
// abstract class RealNum extends _JNum { }
//
// class FixNum extends IntegerNum {
//     public readonly type = JNumType.FIXNUM;
//
//     public static readonly MIN = Number.MIN_SAFE_INTEGER;
//     public static readonly MAX = Number.MAX_SAFE_INTEGER;
//
//     private readonly value: number;
//
//     private constructor(value: number) {
//         super();
//         this.value = value;
//     }
//
//     public static create(value: number): FixNum {
//         value = Math.trunc(value);
//         if (value < FixNum.MIN || value > FixNum.MAX)
//             throw new Error(`Value out of fixnum range: expected ${value} to be between ${FixNum.MIN} and ${FixNum.MAX}`);
//
//         return new FixNum(value);
//     }
//
//     public override[Symbol.toStringTag]() { return "FixNum"; }
//     public override[Symbol.toPrimitive](hint: PrimitiveHint) {
//         if (hint === "string")
//             return this.raw.toString();
//
//         return this.raw;
//     }
//
//     public override isFinite(): boolean { return Number.isFinite(this.raw); }
//     public override isNaN(): boolean { return Number.isNaN(this.raw); }
//
//     public override normalize(): _JNum { return this; }
//     public override canDemote(): boolean { return false; }
//     public override demote(): _JNum { return this; }
//
//     public override promoteTo(target: JNumType.FIXNUM): FixNum;
//     public override promoteTo(target: JNumType.BIGNUM): BigNum;
//     public override promoteTo(target: JNumType.RATIONAL): RationalNum;
//     public override promoteTo(target: JNumType.REAL): RealNum;
//     public override promoteTo(target: JNumType.COMPLEX): ComplexNum;
//     public override promoteTo(target: JNumType): _JNum {
//         switch (target) {
//             case JNumType.FIXNUM:
//                 return this;
//
//             case JNumType.BIGNUM:
//                 return BigNum.create(this.value, false);
//
//             case JNumType.RATIONAL:
//                 return RationalNum.create(this, FixNum.create(1), false);
//
//             case JNumType.REAL:
//                 return ExactRealNum.create(this.promoteTo(JNumType.RATIONAL));
//
//             case JNumType.COMPLEX:
//                 return ComplexNum.create(this, FixNum.create(0), false);
//
//             default:
//                 throw new Error(`Cannot promote FixNum directly to ${JNumType[target]}`);
//         }
//     }
//
//     public override fitsFixnum(): boolean { return true; }
//     public override toBigInt(): bigint { return BigInt(this.value); }
//
//     public get raw(): number { return this.value; }
// }
//
// class BigNum extends IntegerNum {
//     public readonly type = JNumType.BIGNUM;
//
//     private readonly value: bigint;
//
//     private constructor(value: bigint) {
//         super();
//         this.value = value;
//     }
//
//     public static create(value: bigint | number, demote = true): IntegerNum {
//         if (demote && FixNum.MIN <= value && value <= FixNum.MAX)
//             return FixNum.create(Number(value));
//
//         value = typeof value === "bigint" ? value : BigInt(Math.trunc(value));
//         return new BigNum(value);
//     }
//
//     public override[Symbol.toStringTag]() { return "BigNum"; }
//     public override[Symbol.toPrimitive](hint: PrimitiveHint) {
//         if (hint === "string")
//             return this.raw.toString();
//
//         return Number(this.raw);
//     }
//
//     public override isFinite(): boolean { return true; }
//     public override isNaN(): boolean { return Number.isNaN(this.raw); }
//
//     public override normalize(): _JNum { return BigNum.create(this.value); }
//     public override canDemote(): boolean {
//         return FixNum.MIN <= this.value && this.value <= FixNum.MAX;
//     }
//     public override demote(): _JNum {
//         return this.canDemote()
//             ? FixNum.create(Number(this.value))
//             : this;
//     }
//
//     public override promoteTo(target: JNumType.FIXNUM): never;
//     public override promoteTo(target: JNumType.BIGNUM): BigNum;
//     public override promoteTo(target: JNumType.RATIONAL): RationalNum;
//     public override promoteTo(target: JNumType.REAL): RealNum;
//     public override promoteTo(target: JNumType.COMPLEX): ComplexNum;
//     public override promoteTo(target: JNumType): _JNum {
//         switch (target) {
//             case JNumType.BIGNUM:
//                 return this;
//
//             case JNumType.RATIONAL:
//                 return RationalNum.create(this, FixNum.create(1), false);
//
//             case JNumType.REAL:
//                 return ExactRealNum.create(this.promoteTo(JNumType.RATIONAL));
//
//             case JNumType.COMPLEX:
//                 return ComplexNum.create(this, FixNum.create(0), false);
//
//             default:
//                 throw new Error(`Cannot promote BigNum directly to ${JNumType[target]}`);
//         }
//     }
//
//     public override fitsFixnum(): boolean { return this.canDemote(); }
//     public override toBigInt(): bigint { return this.value; }
//
//     public get raw(): bigint { return this.value; }
// }
//
// class RationalNum extends ExactNum {
//     public readonly type = JNumType.RATIONAL;
//
//     public readonly numerator: IntegerNum;
//     public readonly denominator: IntegerNum;
//
//     private constructor(numerator: IntegerNum, denominator: IntegerNum) {
//         super();
//         this.numerator = numerator;
//         this.denominator = denominator;
//     }
//
//     public static create(numerator: IntegerNum, denominator: IntegerNum, demote = true): _JNum {
//         if (!denominator.isFinite()) throw new Error("Expected Rational denominator to be finite");
//
//         const n = numerator.toBigInt();
//         const d = denominator.toBigInt();
//
//         if (d === 0n) throw new Error("Rational denominator must be non-zero");
//
//         let nn = n;
//         let dd = d;
//         if (dd < 0n) {
//             nn = -nn;
//             dd = -dd;
//         }
//
//         const g = RationalNum.gcd(nn < 0n ? -nn : nn, dd);
//         nn /= g;
//         dd /= g;
//
//         if (demote && dd === 1n)
//             return BigNum.create(nn);
//
//         return new RationalNum(
//             BigNum.create(nn),
//             BigNum.create(dd),
//         )
//     }
//
//     public static createFromDecimal(x: number | bigint) {
//         if (typeof x === "bigint") return BigNum.create(x);
//
//         if (Number.isNaN(x)) return InexactRealNum.create(NaN);
//         if (!Number.isFinite(x)) return InexactRealNum.create(Infinity);
//
//         const s = x.toString();
//
//         if (!s.includes("."))
//             return BigNum.create(BigInt(s));
//
//         const [int_part, frac_part] = s.split(".");
//         const scale = 10n ** BigInt(frac_part.length);
//
//         const numerator = BigInt(int_part) * scale + BigInt(frac_part);
//
//         return RationalNum.create(
//             BigNum.create(numerator),
//             BigNum.create(scale),
//         );
//     }
//
//     public override[Symbol.toStringTag]() { return "RationalNum"; }
//     public override[Symbol.toPrimitive](hint: PrimitiveHint) {
//         const raw = Number(this.numerator.toBigInt()) / Number(this.denominator.toBigInt());
//
//         if (hint === "string")
//             return `${this.numerator}/${this.denominator}`;
//
//         return raw;
//     }
//
//     public override isFinite(): boolean { return this.numerator.isFinite(); }
//     public override isNaN(): boolean { return this.numerator.isNaN() || this.denominator.isNaN() || JNum.isZero(this.denominator); }
//
//     public override normalize(): _JNum { return RationalNum.create(this.numerator, this.denominator); }
//     public override canDemote(): boolean { return this.numerator.canDemote() || this.denominator.canDemote() || this.denominator.toBigInt() === 1n; }
//     public override demote(): _JNum {
//         if (!this.canDemote()) return this;
//
//         const num = this.numerator.demote() as IntegerNum;
//         const den = this.denominator.demote() as IntegerNum;
//
//         if (den.toBigInt() === 1n)
//             return num;
//
//         return RationalNum.create(num, den);
//     }
//
//     public override promoteTo(target:
//         | JNumType.BIGNUM
//         | JNumType.FIXNUM): never;
//     public override promoteTo(target: JNumType.RATIONAL): RationalNum;
//     public override promoteTo(target: JNumType.REAL): RealNum;
//     public override promoteTo(target: JNumType.COMPLEX): ComplexNum;
//     public override promoteTo(target: JNumType): _JNum {
//         switch (target) {
//             case JNumType.RATIONAL:
//                 return this;
//
//             case JNumType.REAL:
//                 return ExactRealNum.create(this);
//
//             case JNumType.COMPLEX:
//                 return ComplexNum.create(this, FixNum.create(0), false);
//
//             default:
//                 throw new Error(`Cannot promote RationalNum directly to ${JNumType[target]}`);
//         }
//     }
//
//     public static gcd(a: bigint, b: bigint): bigint {
//         let x = a;
//         let y = b;
//         while (y !== 0n) {
//             [x, y] = [y, x % y];
//         }
//
//         return x;
//     }
// }
//
// class InexactRealNum extends InexactNum implements RealNum {
//     public readonly type = JNumType.REAL;
//
//     public readonly value: number;
//
//     private constructor(value: number) {
//         super();
//         this.value = value;
//     }
//
//     public static create(value: number): InexactRealNum {
//         return new InexactRealNum(value);
//     }
//
//     isInteger(): boolean { return Number.isInteger(this.raw) && this.isRational() }
//     isRational(): boolean { return this.isReal() && this.isFinite(); }
//     isReal(): boolean { return !this.isNaN(); }
//     isComplex(): boolean { return !this.isNaN(); }
//
//     public override[Symbol.toStringTag]() { return "InexactRealNum"; }
//     public override[Symbol.toPrimitive](hint: PrimitiveHint) {
//         if (hint === "string")
//             return this.raw.toString();
//
//         return this.raw;
//     }
//
//     public override isFinite(): boolean { return Number.isFinite(this.raw); }
//     public override isNaN(): boolean { return Number.isNaN(this.raw); }
//
//     public override normalize(): _JNum { return this; }
//     public override canDemote(): boolean {
//         return (
//             Number.isFinite(this.value) &&
//             Number.isInteger(this.value) &&
//             this.value >= FixNum.MIN &&
//             this.value <= FixNum.MAX
//         );
//     }
//
//     public override demote(): _JNum {
//         if (!this.canDemote()) return this;
//         const n = this.value;
//         return FixNum.create(n);
//     }
//
//     public override promoteTo(target:
//         | JNumType.RATIONAL
//         | JNumType.BIGNUM
//         | JNumType.FIXNUM): never;
//     public override promoteTo(target: JNumType.REAL): RealNum;
//     public override promoteTo(target: JNumType.COMPLEX): ComplexNum;
//     public override promoteTo(target: JNumType): _JNum {
//         switch (target) {
//             case JNumType.REAL:
//                 return this;
//
//             case JNumType.COMPLEX:
//                 return ComplexNum.create(this, FixNum.create(0), false);
//
//             default:
//                 throw new Error(`Cannot promote InexactRealNum directly to ${JNumType[target]}`);
//         }
//     }
//
//     public ToInexact(): InexactRealNum { return this; }
//
//     public get raw(): number { return this.value; }
// }
//
// class ExactRealNum extends ExactNum implements RealNum {
//     public readonly type = JNumType.REAL;
//
//     public readonly value: RationalNum;
//
//     private constructor(value: RationalNum) {
//         super();
//         this.value = value;
//     }
//
//     public override[Symbol.toStringTag]() { return "ExactRealNum"; }
//     public override[Symbol.toPrimitive](hint: PrimitiveHint) {
//         if (hint === "string")
//             return this.value.demote().toString();
//
//         return +this.value.demote();
//     }
//
//     public static create(value: RationalNum): ExactRealNum { return new ExactRealNum(value); }
//
//     public override isFinite(): boolean { return this.value.isFinite(); }
//     public override isNaN(): boolean { return this.value.isNaN(); }
//
//     public override normalize(): _JNum {
//         const v = this.value.normalize();
//         return v instanceof RationalNum
//             ? new ExactRealNum(v)
//             : v;
//     }
//
//     public override canDemote(): boolean { return this.value.canDemote(); }
//     public override demote(): _JNum {
//         return this.canDemote()
//             ? this.value.demote()
//             : this;
//     }
//
//     public override promoteTo(target:
//         | JNumType.RATIONAL
//         | JNumType.BIGNUM
//         | JNumType.FIXNUM): never;
//     public override promoteTo(target: JNumType.REAL): RealNum;
//     public override promoteTo(target: JNumType.COMPLEX): ComplexNum;
//     public override promoteTo(target: JNumType): _JNum {
//         switch (target) {
//             case JNumType.REAL:
//                 return this;
//
//             case JNumType.COMPLEX:
//                 return ComplexNum.create(this, FixNum.create(0), false);
//
//             default:
//                 throw new Error(`Cannot promote ExactRealNum directly to ${JNumType[target]}`);
//         }
//     }
//
//     public toInexact(): never { throw new Error("ExactRealNum cannot be implicitly converted to inexact"); }
// }
//
// class ComplexNum extends _JNum {
//     public readonly type = JNumType.COMPLEX;
//
//     public readonly real: RealNum;
//     public readonly imag: RealNum;
//
//     private constructor(real: RealNum, imag: RealNum) {
//         super();
//         this.real = real;
//         this.imag = imag;
//     }
//
//     public static create(real: RealNum, imag: RealNum, demote = true): _JNum {
//         const r = real.normalize();
//         const i = imag.normalize();
//
//         if (!r.isReal() || !i.isReal())
//             throw new Error("ComplexNum components must be real-valued");
//
//         if (demote && JNum.isZero(i)) return r;
//
//         return new ComplexNum(r, i);
//     }
//
//     public override[Symbol.toStringTag]() { return "ComplexNum"; }
//     public override[Symbol.toPrimitive]() {
//         // TODO: Display - instead of + for imaginary part if applicable
//         return `${this.real.toString()}+${this.imag.toString()}i`;
//     }
//
//     public override isExact(): boolean { return this.real.isExact() && this.imag.isExact(); }
//     public override isFinite(): boolean { return this.real.isFinite() && this.imag.isFinite(); }
//     public override isNaN(): boolean { return this.real.isNaN() || this.imag.isNaN(); }
//
//     public override normalize(): _JNum { return ComplexNum.create(this.real, this.imag); }
//     public override canDemote(): boolean { return this.real.canDemote() || this.imag.canDemote() || JNum.isZero(this.imag); }
//     public override demote(): _JNum {
//         if (!this.canDemote()) return this;
//
//         const re = this.real.demote();
//         const im = this.imag.demote();
//
//         if (JNum.isZero(im))
//             return im;
//
//         return ComplexNum.create(re, im);
//     }
//
//     public override promoteTo(target:
//         | JNumType.REAL
//         | JNumType.RATIONAL
//         | JNumType.BIGNUM
//         | JNumType.FIXNUM): never;
//     public override promoteTo(target: JNumType.COMPLEX): ComplexNum;
//     public override promoteTo(target: JNumType): _JNum {
//         switch (target) {
//             case JNumType.COMPLEX:
//                 return this;
//
//             default:
//                 throw new Error(`Cannot promote ComplexNum directly to ${JNumType[target]}`);
//         }
//     }
// }
//
// /* =================== Operations ======================= */
//
// enum Operations { "add", "sub", "mul", "div", "pow", "lt", "lte", "gt", "gte", "eq" };
// type Operation = keyof typeof Operations;
//
// type BinaryOpKernel<T extends JNumType, R> =
//     (lhs: JNumByType[T], rhs: JNumByType[T]) => R;
//
// function finalizeResult(r: _JNum): _JNum {
//     let out: _JNum = r.normalize();
//     while (out.canDemote())
//         out = out.demote();
//
//     return out;
// }
//
// type JNumTypeOps<T extends JNumType, R> = {
//     [key in Operation]?: BinaryOpKernel<T, R>
// }
//
// type JNumTypeOpsMap<R> = Partial<{
//     [T in JNumType]: JNumTypeOps<T, R>
// }>;
//
// const TYPE_OPS: JNumTypeOpsMap<_JNum> = {};
//
// const integerAdd: BinaryOpKernel<JNumType.BIGNUM | JNumType.FIXNUM, IntegerNum> =
//     (a, b) => BigNum.create(a.toBigInt() + b.toBigInt(), false);
//
// const integerSub: BinaryOpKernel<JNumType.BIGNUM | JNumType.FIXNUM, IntegerNum> =
//     (a, b) => BigNum.create(a.toBigInt() - b.toBigInt(), false);
//
// const integerMul: BinaryOpKernel<JNumType.BIGNUM | JNumType.FIXNUM, IntegerNum> =
//     (a, b) => BigNum.create(a.toBigInt() * b.toBigInt(), false);
//
// const integerDiv: BinaryOpKernel<JNumType.BIGNUM | JNumType.FIXNUM, ExactNum> =
//     (a, b) => RationalNum.create(a, b, false);
//
// const rationalAdd: BinaryOpKernel<JNumType.RATIONAL, ExactNum> =
//     (a, b) => {
//         const n =
//             a.numerator.toBigInt() * b.denominator.toBigInt() +
//             b.numerator.toBigInt() * a.denominator.toBigInt();
//
//         const d = a.denominator.toBigInt() * b.denominator.toBigInt();
//
//         return RationalNum.create(
//             BigNum.create(n, false),
//             BigNum.create(d, false),
//             false
//         );
//     };
//
// const rationalSub: BinaryOpKernel<JNumType.RATIONAL, ExactNum> =
//     (a, b) => {
//         const n =
//             a.numerator.toBigInt() * b.denominator.toBigInt() -
//             b.numerator.toBigInt() * a.denominator.toBigInt();
//
//         const d = a.denominator.toBigInt() * b.denominator.toBigInt();
//
//         return RationalNum.create(
//             BigNum.create(n, false),
//             BigNum.create(d, false),
//             false
//         );
//     };
//
// const rationalMul: BinaryOpKernel<JNumType.RATIONAL, ExactNum> =
//     (a, b) => {
//         const n = a.numerator.toBigInt() * b.numerator.toBigInt();
//         const d = a.denominator.toBigInt() * b.denominator.toBigInt();
//
//         return RationalNum.create(
//             BigNum.create(n, false),
//             BigNum.create(d, false),
//             false
//         );
//     };
//
// const rationalDiv: BinaryOpKernel<JNumType.RATIONAL, ExactNum> =
//     (a, b) => {
//         const n = a.numerator.toBigInt() * b.denominator.toBigInt();
//         const d = a.denominator.toBigInt() * b.numerator.toBigInt();
//
//         return RationalNum.create(
//             BigNum.create(n, false),
//             BigNum.create(d, false),
//             false
//         );
//     };
//
// const realAdd: BinaryOpKernel<JNumType.REAL, RealNum> =
//     (a, b) => {
//         if (!(a.isExact() && b.isExact())) {
//             return InexactRealNum.create(+a + +b);
//         }
//
//         const l = a.promoteTo(JNumType.REAL);
//         const r = b.promoteTo(JNumType.REAL);
//
//         return rationalAdd(
//             (l as ExactRealNum).value,
//             (r as ExactRealNum).value
//         );
//     }
//
// const realSub: BinaryOpKernel<JNumType.REAL, RealNum> =
//     (a, b) => {
//         if (!(a.isExact() && b.isExact())) {
//             return InexactRealNum.create(+a - +b);
//         }
//
//         const l = a.promoteTo(JNumType.REAL);
//         const r = b.promoteTo(JNumType.REAL);
//
//         return rationalSub(
//             (l as ExactRealNum).value,
//             (r as ExactRealNum).value
//         );
//     }
//
// const complexAdd: BinaryOpKernel<JNumType.COMPLEX, _JNum> =
//     (a, b) => {
//         return ComplexNum.create(
//             realAdd(a.real, b.real),
//             realAdd(a.imag, b.imag),
//         );
//     }
//
// const complexSub: BinaryOpKernel<JNumType.COMPLEX, _JNum> =
//     (a, b) => {
//         return ComplexNum.create(
//             realSub(a.real, b.real),
//             realSub(a.imag, b.imag),
//         );
//     }
//
// function getKernel<T extends JNumType>(
//     type: T,
//     op: Operation
// ): BinaryOpKernel<T, _JNum> {
//     const ops = TYPE_OPS[type];
//     const kernel = ops?.[op];
//     if (!kernel) {
//         throw new Error(`${op} not defined for ${JNumType[type]}`);
//     }
//     return kernel;
// }
//
// function getPromotedTypes(...nums: _JNum[]): JNumType {
//     let max_type = -1;
//     for (const { type } of nums)
//         max_type = Math.max(type, max_type);
//
//     if (max_type === -1)
//         throw new Error("Failed to get promotion types; there may have been no arguments passed");
//
//     return max_type;
// }
//
// function makeBinaryOp(op: Operation) {
//     return (lhs: JNumConstructor, rhs: JNumConstructor): _JNum => {
//         let l = lhs as _JNum, r = rhs as _JNum;
//
//         if (!(lhs instanceof _JNum)) l = JNum(lhs);
//         if (!(rhs instanceof _JNum)) r = JNum(rhs);
//
//         const type = getPromotedTypes(l, r);
//         if (type === undefined)
//             throw new Error(`cannot promote ${JNumType[l.type]} and ${JNumType[r.type]}; no promotion rule defined`);
//
//         const lp = l.promoteTo(type) as JNumByType[typeof type];
//         const rp = r.promoteTo(type) as JNumByType[typeof type];
//
//         const kernel = getKernel(type, op);
//         return kernel(lp, rp).normalize().demote();
//     }
// }
//
// TYPE_OPS[JNumType.FIXNUM] = {
//     add: integerAdd,
//     sub: integerSub,
//     mul: integerMul,
//     div: integerDiv,
// };
//
// TYPE_OPS[JNumType.BIGNUM] = {
//     add: integerAdd,
//     sub: integerSub,
//     mul: integerMul,
//     div: integerDiv,
// };
//
// TYPE_OPS[JNumType.RATIONAL] = {
//     add: rationalAdd,
//     sub: rationalSub,
//     mul: rationalMul,
//     div: rationalDiv,
// };
//
// TYPE_OPS[JNumType.REAL] = {
//     add: realAdd,
//     sub: realSub,
// };
//
// TYPE_OPS[JNumType.COMPLEX] = {
//     add: complexAdd,
//     sub: complexSub,
// };
//
// /* =================== Utilities ======================== */
//
// function has<T extends PropertyKey>(obj: object, key: T): obj is object & Record<T, unknown> {
//     return Object.hasOwn(obj, key);
// }
//
// /* ==================== Exports ========================= */
//
// type JNumIntegerConstructor =
//     | number
//     | IntegerNum
//     | bigint;
//
// type JNumRealConstructor =
//     | number
//     | RealNum
//     | bigint;
//
// type JNumConstructor =
//     | number
//     | bigint
//     | _JNum
//     | { real: JNumRealConstructor, imag: JNumRealConstructor }
//     | { num: JNumIntegerConstructor, den: JNumIntegerConstructor };
//
// export const JNum = (function () {
//     function __constructJNumFromNumber(num: number | bigint, exact: boolean): _JNum {
//         if ((exact && Number.isInteger(num)) || typeof num === "bigint")
//             return BigNum.create(num);
//
//         if (exact)
//             return RationalNum.createFromDecimal(num);
//
//         return InexactRealNum.create(num);
//     }
//
//     function __constructJNumFromObject(num: JNumConstructor & object, exact: boolean): _JNum {
//         if (num instanceof _JNum)
//             return num;
//
//         if (has(num, "real") && has(num, "imag")) {
//             return ComplexNum.create(JNum(num.real, exact), JNum(num.imag, exact));
//         }
//
//         if (has(num, "num") && has(num, "den")) {
//             const n = JNum(num.num, exact).demote();
//             const d = JNum(num.den, exact).demote();
//
//             if (!(n instanceof IntegerNum))
//                 throw new Error("Cannot construct a RationalNum with non-integer numerator");
//
//             if (!(d instanceof IntegerNum))
//                 throw new Error("Cannot construct a RationalNum with non-integer denominator");
//
//             return RationalNum.create(n, d);
//         }
//
//         throw new Error("Unknown object-based JNum constructor type");
//     }
//
//     function JNum(num: JNumConstructor, exact = true): _JNum {
//         if (typeof num === "number" || typeof num === "bigint")
//             return __constructJNumFromNumber(num, exact);
//
//         if (typeof num === "object")
//             return __constructJNumFromObject(num, exact);
//
//         throw new Error(`Invalid JNum constructor of type ${typeof num}`);
//     }
//
//     JNum.isZero = (num: _JNum): boolean => {
//         if (num instanceof FixNum) return num.raw === 0;
//         if (num instanceof BigNum) return num.raw === 0n;
//         if (num instanceof RationalNum) return num.numerator.toBigInt() === 0n;
//         if (num instanceof InexactRealNum) return num.raw === 0;
//         if (num instanceof ExactRealNum) return JNum.isZero(num.value);
//         if (num instanceof ComplexNum) return JNum.isZero(num.real) && JNum.isZero(num.imag);
//
//         throw new Error("Unknown JNum subclass in isZero");
//     }
//
//     JNum.add = makeBinaryOp("add");
//     JNum.sub = makeBinaryOp("sub");
//     JNum.mul = makeBinaryOp("mul");
//     JNum.div = makeBinaryOp("div");
//
//     return JNum;
// })();

export { FixNum } from "numerics/fixnum";
export { BigNum } from "numerics/bignum";
export { RationalNum } from "numerics/rational";
export { NaNNum } from "numerics/nan";
export { InfinityNum } from "numerics/infinity";
export { dispatchBinaryOp } from "jnum-runtime";

import "operators/arithmetic";
import "operators/predicates";
