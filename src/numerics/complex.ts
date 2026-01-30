import {
    _JNum,
    IntegerLike,
    RealLike,
} from "jnum-base";

import {
    registerType,
    registerPromotion,
    registerJNumConstructor,
    JNum,
    promoteValue,
} from "jnum-runtime";

import { FixNum, FixNumType } from "numerics/fixnum";
import { BigNum, BigNumType } from "numerics/bignum";
import { RationalNum, RationalNumType } from "numerics/rational";
import { has } from "utils/utils";
import { OP_EQ } from "operators/op_names";

export const ComplexNumType = Symbol("ComplexNum");

export class ComplexNum extends _JNum {
    public readonly type = ComplexNumType;

    private readonly _real: RealLike;
    private readonly _imag: RealLike;

    private constructor(real: _JNum, imag: _JNum) {
        super();
        this._real = real.normalize();
        this._imag = imag.normalize();

        if (this._real instanceof ComplexNum)
            throw new Error("Expected non-complex real component of ComplexNum");

        if (this._imag instanceof ComplexNum)
            throw new Error("Expected non-complex imag component of ComplexNum");
    }

    public static create(real: _JNum, imag: _JNum): _JNum {
        return new ComplexNum(real, imag);
    }

    public get real(): RealLike { return this._real; }
    public get imag(): RealLike { return this._imag; }

    public override isExact(): boolean { return true; }
    public override isFinite(): boolean { return true; }
    public override isNaN(): boolean { return false; }

    public override normalize(): _JNum { return ComplexNum.create(this._real, this._imag); }
    public override canDemote(): boolean {
        return this._real.canDemote() || this._imag.canDemote() || JNum[OP_EQ](this._imag, FixNum.create(0)) === true;
        // FIXME: Add JNum.equalsNum
    }
    public override demote(): _JNum {
        if (!this.canDemote()) return this;

        const re = this._real.demote();
        const im = this._imag.demote();

        if (JNum[OP_EQ](this._imag, FixNum.create(0)) === true)
            return im;

        return ComplexNum.create(re, im);
    }

    public override[Symbol.toStringTag]() { return "ComplexNum"; }
    public override[Symbol.toPrimitive]() {
        // TODO: Display - instead of + for imaginary part if applicable
        return `${this._real.toString()}+${this._imag.toString()}i`;
    }
}

registerType({
    id: ComplexNumType,
    name: "ComplexNum",
    exact: true,
    integer: true,
});

/* ============ PROMOTIONS =========== */

registerPromotion({
    from: FixNumType,
    to: ComplexNumType,
    cost: 1,
    apply: (v: _JNum) => {
        if (!(v instanceof FixNum)) throw new Error("Expected FixNum for promotion");
        return ComplexNum.create(v, FixNum.create(0));
    }
});

registerPromotion({
    from: BigNumType,
    to: ComplexNumType,
    cost: 1,
    apply: (v: _JNum) => {
        if (!(v instanceof BigNum)) throw new Error("Expected BigNum for promotion");
        return ComplexNum.create(v, FixNum.create(0));
    }
});

registerPromotion({
    from: RationalNumType,
    to: ComplexNumType,
    cost: 1,
    apply: (v: _JNum) => {
        if (!(v instanceof RationalNum)) throw new Error("Expected RationalNum for promotion");
        return ComplexNum.create(v, FixNum.create(0));
    }
});

/* ============ CONSTRUCTOR ========== */

registerJNumConstructor({
    precedence: 15,
    predicate: (x): x is string =>
        typeof x === "string" &&
        /^[+-]?[\d.]+[+-][\d.]+i$/.test(x),
    id: Symbol("ComplexNum:StringComplex"),
    constructor: (x: string) => {
        const [real, imag] = /^([+-]?[\d.]+)([+-][\d.]+)i$/.exec(x)!.slice(1);
        const nreal = Number(real);
        const nimag = Number(imag);
        return ComplexNum.create(
            RationalNum.createFromDecimal(nreal),
            RationalNum.createFromDecimal(nimag),
        )
    }
});

registerJNumConstructor({
    precedence: 15,
    predicate: (x): x is { real: unknown, imag: unknown } =>
        x !== null &&
        typeof x === "object" &&
        has(x, "real") &&
        has(x, "imag"),
    id: Symbol("ComplexNum:ObjComplex"),
    constructor: (x: { real: unknown, imag: unknown }) => {
        return ComplexNum.create(
            promoteValue(JNum(x.real), RationalNumType) as IntegerLike,
            promoteValue(JNum(x.imag), RationalNumType) as IntegerLike,
        )
    }
});
