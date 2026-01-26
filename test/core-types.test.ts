import { describe, expect, test } from "@jest/globals";
import { JNum } from "../src/jnum";

describe("isInteger", () => {
    test("checks if 1 is an integer", () => {
        expect(JNum(1).isInteger()).toBe(true);
    });

    test("checks if 0 is an integer", () => {
        expect(JNum(0).isInteger()).toBe(true);
    });

    test("checks if -0 is an integer", () => {
        expect(JNum(-0).isInteger()).toBe(true);
    });

    test("checks if #i0 is an integer", () => {
        expect(JNum(0, false).isInteger()).toBe(true);
    });

    test("checks if 2^500 is an integer", () => {
        expect(JNum(2n ** 500n).isInteger()).toBe(true);
    });

    test("checks if -1 is an integer", () => {
        expect(JNum(-1).isInteger()).toBe(true);
    });

    test("checks if -(2^500) is an integer", () => {
        expect(JNum(-(2n ** 500n)).isInteger()).toBe(true);
    });

    test("checks if 1.0 is an integer", () => {
        expect(JNum(1.0).isInteger()).toBe(true);
    });

    test("checks if 0.5 is an integer", () => {
        expect(JNum(0.5).isInteger()).toBe(false);
    });

    test("checks if i is an integer", () => {
        expect(JNum({ real: 0, imag: 1 }).isInteger()).toBe(false);
    });

    test("checks if 1+0i is an integer", () => {
        expect(JNum({ real: 1, imag: 0 }).isInteger()).toBe(true);
    });

    test("checks if 0.5+0i is an integer", () => {
        expect(JNum({ real: 0.5, imag: 0 }).isInteger()).toBe(false);
    });

    test("checks if #i0.1 is an integer", () => {
        expect(JNum(0.1, false).isInteger()).toBe(false);
    });

    test("checks if #i3 is an integer", () => {
        expect(JNum(3, false).isInteger()).toBe(true);
    });

    test("checks if 2/1 is an integer", () => {
        expect(JNum({ num: 2, den: 1 }).isInteger()).toBe(true);
    });

    test("checks if 2/2 is an integer", () => {
        expect(JNum({ num: 2, den: 2 }).isInteger()).toBe(true);
    });

    test("checks if -1/-1 is an integer", () => {
        expect(JNum({ num: -1, den: -1 }).isInteger()).toBe(true);
    });

    test("checks if 1/-1 is an integer", () => {
        expect(JNum({ num: 1, den: -1 }).isInteger()).toBe(true);
    });

    test("checks if 0/1 is an integer", () => {
        expect(JNum({ num: 0, den: 1 }).isInteger()).toBe(true);
    });

    test("checks if BigInt 0 is an integer", () => {
        expect(JNum(0n).isInteger()).toBe(true);
    });

    test("checks if Infinity is an integer", () => {
        expect(JNum(Infinity).isInteger()).toBe(false);
    });

    test("checks if NaN is an integer", () => {
        expect(JNum(NaN).isInteger()).toBe(false);
    });
});

describe("isRational", () => {
    test("checks if 1 is a rational", () => {
        expect(JNum(1).isRational()).toBe(true);
    });

    test("checks if 0 is a rational", () => {
        expect(JNum(0).isRational()).toBe(true);
    });

    test("checks if -0 is a rational", () => {
        expect(JNum(-0).isRational()).toBe(true);
    });

    test("checks if #i0 is a rational", () => {
        expect(JNum(0, false).isRational()).toBe(true);
    });

    test("checks if 2^500 is a rational", () => {
        expect(JNum(2n ** 500n).isRational()).toBe(true);
    });

    test("checks if -1 is a rational", () => {
        expect(JNum(-1).isRational()).toBe(true);
    });

    test("checks if -(2^500) is a rational", () => {
        expect(JNum(-(2n ** 500n)).isRational()).toBe(true);
    });

    test("checks if 0.5 is a rational", () => {
        expect(JNum(0.5).isRational()).toBe(true);
    });

    test("checks if 3.1415926 is a rational", () => {
        expect(JNum(3.1415926).isRational()).toBe(true);
    });

    test("checks if 1/3 is a rational", () => {
        expect(JNum(1 / 3).isRational()).toBe(true);
    });

    test("checks if i is a rational", () => {
        expect(JNum({ real: 0, imag: 1 }).isRational()).toBe(false);
    });

    test("checks if 1+0i is a rational", () => {
        expect(JNum({ real: 1, imag: 0 }).isRational()).toBe(true);
    });

    test("checks if 0.5+0i is a rational", () => {
        expect(JNum({ real: 0.5, imag: 0 }).isRational()).toBe(true);
    });

    test("checks if #i0.1 is a rational", () => {
        expect(JNum(0.1, false).isRational()).toBe(true);
    });

    test("checks if #i3 is a rational", () => {
        expect(JNum(3, false).isRational()).toBe(true);
    });

    test("checks if 2/1 is a rational", () => {
        expect(JNum({ num: 2, den: 1 }).isRational()).toBe(true);
    });

    test("checks if 2/2 is a rational", () => {
        expect(JNum({ num: 2, den: 2 }).isRational()).toBe(true);
    });

    test("checks if 1/-1 is a rational", () => {
        expect(JNum({ num: 1, den: -1 }).isRational()).toBe(true);
    });

    test("checks if 0/1 is a rational", () => {
        expect(JNum({ num: 0, den: 1 }).isRational()).toBe(true);
    });

    test("checks if BigInt 0 is a rational", () => {
        expect(JNum(0n).isRational()).toBe(true);
    });

    test("checks if Infinity is a rational", () => {
        expect(JNum(Infinity).isRational()).toBe(false);
    });

    test("checks if NaN is a rational", () => {
        expect(JNum(NaN).isRational()).toBe(false);
    });
});

describe("isReal", () => {
    test("checks if 1 is a real", () => {
        expect(JNum(1).isReal()).toBe(true);
    });

    test("checks if 0 is a real", () => {
        expect(JNum(0).isReal()).toBe(true);
    });

    test("checks if -0 is a real", () => {
        expect(JNum(-0).isReal()).toBe(true);
    });

    test("checks if #i0 is a real", () => {
        expect(JNum(0, false).isReal()).toBe(true);
    });

    test("checks if 2^500 is a real", () => {
        expect(JNum(2n ** 500n).isReal()).toBe(true);
    });

    test("checks if -1 is a real", () => {
        expect(JNum(-1).isReal()).toBe(true);
    });

    test("checks if -(2^500) is a real", () => {
        expect(JNum(-(2n ** 500n)).isReal()).toBe(true);
    });

    test("checks if 0.5 is a real", () => {
        expect(JNum(0.5).isReal()).toBe(true);
    });

    test("checks if 3.1415926 is a real", () => {
        expect(JNum(3.1415926).isReal()).toBe(true);
    });

    test("checks if 1/3 is a real", () => {
        expect(JNum(1 / 3).isReal()).toBe(true);
    });

    test("checks if i is a real", () => {
        expect(JNum({ real: 0, imag: 1 }).isReal()).toBe(false);
    });

    test("checks if 1+0i is a real", () => {
        expect(JNum({ real: 1, imag: 0 }).isReal()).toBe(true);
    });

    test("checks if 0.5+0i is a real", () => {
        expect(JNum({ real: 0.5, imag: 0 }).isReal()).toBe(true);
    });

    test("checks if #i0.1 is a real", () => {
        expect(JNum(0.1, false).isReal()).toBe(true);
    });

    test("checks if #i3 is a real", () => {
        expect(JNum(3, false).isReal()).toBe(true);
    });

    test("checks if 2/1 is a real", () => {
        expect(JNum({ num: 2, den: 1 }).isReal()).toBe(true);
    });

    test("checks if 2/2 is a real", () => {
        expect(JNum({ num: 2, den: 2 }).isReal()).toBe(true);
    });

    test("checks if 1/-1 is a real", () => {
        expect(JNum({ num: 1, den: -1 }).isReal()).toBe(true);
    });

    test("checks if 0/1 is a real", () => {
        expect(JNum({ num: 0, den: 1 }).isReal()).toBe(true);
    });

    test("checks if BigInt 0 is a real", () => {
        expect(JNum(0n).isReal()).toBe(true);
    });

    test("checks if Infinity is a real", () => {
        expect(JNum(Infinity).isReal()).toBe(true);
    });

    test("checks if NaN is a real", () => {
        expect(JNum(NaN).isReal()).toBe(false);
    });
});

describe("isComplex", () => {
    test("checks if 1 is a complex", () => {
        expect(JNum(1).isComplex()).toBe(true);
    });

    test("checks if 0 is a complex", () => {
        expect(JNum(0).isComplex()).toBe(true);
    });

    test("checks if -0 is a complex", () => {
        expect(JNum(-0).isComplex()).toBe(true);
    });

    test("checks if #i0 is a complex", () => {
        expect(JNum(0, false).isComplex()).toBe(true);
    });

    test("checks if 2^500 is a complex", () => {
        expect(JNum(2n ** 500n).isComplex()).toBe(true);
    });

    test("checks if -1 is a complex", () => {
        expect(JNum(-1).isComplex()).toBe(true);
    });

    test("checks if -(2^500) is a complex", () => {
        expect(JNum(-(2n ** 500n)).isComplex()).toBe(true);
    });

    test("checks if 0.5 is a complex", () => {
        expect(JNum(0.5).isComplex()).toBe(true);
    });

    test("checks if 3.1415926 is a complex", () => {
        expect(JNum(3.1415926).isComplex()).toBe(true);
    });

    test("checks if 1/3 is a complex", () => {
        expect(JNum(1 / 3).isComplex()).toBe(true);
    });

    test("checks if i is a complex", () => {
        expect(JNum({ real: 0, imag: 1 }).isComplex()).toBe(true);
    });

    test("checks if 1+0i is a complex", () => {
        expect(JNum({ real: 1, imag: 0 }).isComplex()).toBe(true);
    });

    test("checks if 0.5+0i is a complex", () => {
        expect(JNum({ real: 0.5, imag: 0 }).isComplex()).toBe(true);
    });

    test("checks if #i0.1 is a complex", () => {
        expect(JNum(0.1, false).isComplex()).toBe(true);
    });

    test("checks if #i3 is a complex", () => {
        expect(JNum(3, false).isComplex()).toBe(true);
    });

    test("checks if 2/1 is a complex", () => {
        expect(JNum({ num: 2, den: 1 }).isComplex()).toBe(true);
    });

    test("checks if 2/2 is a complex", () => {
        expect(JNum({ num: 2, den: 2 }).isComplex()).toBe(true);
    });

    test("checks if 1/-1 is a complex", () => {
        expect(JNum({ num: 1, den: -1 }).isComplex()).toBe(true);
    });

    test("checks if 0/1 is a complex", () => {
        expect(JNum({ num: 0, den: 1 }).isComplex()).toBe(true);
    });

    test("checks if BigInt 0 is a complex", () => {
        expect(JNum(0n).isComplex()).toBe(true);
    });

    test("checks if Infinity is a complex", () => {
        expect(JNum(Infinity).isComplex()).toBe(true);
    });

    test("checks if NaN is a complex", () => {
        expect(JNum(NaN).isComplex()).toBe(false);
    });
});
