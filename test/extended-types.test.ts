import { describe, expect, test } from "@jest/globals";
import { JNum, JNumType } from "../src/jnum";

describe("isZero", () => {
    describe("integer", () => {
        test("checks if 0 is zero", () => {
            expect(JNum.isZero(JNum(0))).toBe(true);
        });

        test("checks if -0 is zero", () => {
            expect(JNum.isZero(JNum(0))).toBe(true);
        });

        test("checks if NaN is zero", () => {
            expect(JNum.isZero(JNum(NaN))).toBe(false);
        });

        test("checks if Infinity is zero", () => {
            expect(JNum.isZero(JNum(Infinity))).toBe(false);
        });

        test("checks if 1 is zero", () => {
            expect(JNum.isZero(JNum(1))).toBe(false);
        });
    });

    describe("rational", () => {
        test("checks if 0/1 is zero", () => {
            expect(JNum.isZero(JNum({ num: 0, den: 1 }))).toBe(true);
        });

        test("checks if -0/1 is zero", () => {
            expect(JNum.isZero(JNum({ num: -0, den: 1 }))).toBe(true);
        });

        test("checks if 1/2 is zero", () => {
            expect(JNum.isZero(JNum({ num: 1, den: 2 }))).toBe(false);
        });
    });

    describe("inexact real", () => {
        test("checks if #i0 is zero", () => {
            expect(JNum.isZero(JNum(0, false))).toBe(true);
        });

        test("checks if #i-0 is zero", () => {
            expect(JNum.isZero(JNum(-0, false))).toBe(true);
        });

        test("checks if #i1 is zero", () => {
            expect(JNum.isZero(JNum(1, false))).toBe(false);
        });
    });

    describe("exact real", () => {
        test("checks if #i0 is zero", () => {
            expect(JNum.isZero(JNum(0).promoteTo(JNumType.REAL))).toBe(true);
        });

        test("checks if #i-0 is zero", () => {
            expect(JNum.isZero(JNum(-0).promoteTo(JNumType.REAL))).toBe(true);
        });

        test("checks if #i1 is zero", () => {
            expect(JNum.isZero(JNum(1).promoteTo(JNumType.REAL))).toBe(false);
        });
    });

    describe("complex", () => {
        test("checks if 0+0i is zero", () => {
            expect(JNum.isZero(JNum({ real: 0, imag: 0 }))).toBe(true);
        });

        test("checks if -0+0i is zero", () => {
            expect(JNum.isZero(JNum({ real: -0, imag: 0 }))).toBe(true);
        });

        test("checks if 0-0i is zero", () => {
            expect(JNum.isZero(JNum({ real: 0, imag: -0 }))).toBe(true);
        });

        test("checks if -0-0i is zero", () => {
            expect(JNum.isZero(JNum({ real: -0, imag: -0 }))).toBe(true);
        });

        test("checks if 1+0i is zero", () => {
            expect(JNum.isZero(JNum({ real: 1, imag: 0 }))).toBe(false);
        });

        test("checks if 0+1i is zero", () => {
            expect(JNum.isZero(JNum({ real: 0, imag: 1 }))).toBe(false);
        });
    });

    describe("errors", () => {
        test("checks if empty object isZero errors", () => {
            expect(() => JNum.isZero({} as any)).toThrow();
        });
    });
});

describe("isExact", () => {
    test("checks if fixnum is exact", () => {
        expect(JNum(0).isExact()).toBe(true);
    });

    test("checks if bignum is exact", () => {
        expect(JNum(2n ** 500n).isExact()).toBe(true);
    });

    test("checks if rational is exact", () => {
        expect(JNum({ num: 1, den: 2 }).isExact()).toBe(true);
    });

    test("checks if inexact real is exact", () => {
        expect(JNum(1, false).isExact()).toBe(false);
    });

    test("checks if exact real is exact", () => {
        expect(JNum(1).promoteTo(JNumType.REAL).isExact()).toBe(true);
    });

    test("checks if complex is exact for exact re and im", () => {
        expect(JNum({ real: 1, imag: 1 }).isExact()).toBe(true);
    });

    test("checks if complex is exact for inexact re and exact im", () => {
        expect(JNum({ real: JNum(1, false), imag: 1 }).isExact()).toBe(false);
    });

    test("checks if complex is exact for exact re and inexact im", () => {
        expect(JNum({ real: 1, imag: JNum(1, false) }).isExact()).toBe(false);
    });

    test("checks if complex is exact for inexact re and im", () => {
        expect(JNum({ real: JNum(1, false), imag: JNum(1, false) }).isExact()).toBe(false);
    });
});

describe("isFinite", () => {
    test("checks if 1 is finite", () => {
        expect(JNum(1).isFinite()).toBe(true);
    });

    test("checks if 0 is finite", () => {
        expect(JNum(0).isFinite()).toBe(true);
    });

    test("checks if 2^1000 is finite", () => {
        expect(JNum(2n ** 1000n).isFinite()).toBe(true);
    });

    test("checks if -2^1000 is finite", () => {
        expect(JNum(-(2n ** 1000n)).isFinite()).toBe(true);
    });

    test("checks if 1/2 is finite", () => {
        expect(JNum(1 / 2).isFinite()).toBe(true);
    });

    test("checks if #e1 is finite", () => {
        expect(JNum(1).promoteTo(JNumType.REAL).isFinite()).toBe(true);
    });

    test("checks if 1+i is finite", () => {
        expect(JNum({ real: 1, imag: 1 }).isFinite()).toBe(true);
    });

    test("checks if Infinity is finite", () => {
        expect(JNum(Infinity).isFinite()).toBe(false);
    });

    test("checks if -Infinity is finite", () => {
        expect(JNum(-Infinity).isFinite()).toBe(false);
    });

    test("checks if 1+Infinityi is finite", () => {
        expect(JNum({ real: 1, imag: Infinity }).isFinite()).toBe(false);
    });

    test("checks if Infinity+i is finite", () => {
        expect(JNum({ real: Infinity, imag: 1 }).isFinite()).toBe(false);
    });

    test("checks if Infinity+Infinityi is finite", () => {
        expect(JNum({ real: Infinity, imag: Infinity }).isFinite()).toBe(false);
    });
});

describe("isNaN", () => {
    test("checks if 1 is NaN", () => {
        expect(JNum(1).isNaN()).toBe(false);
    });

    test("checks if 0 is NaN", () => {
        expect(JNum(0).isNaN()).toBe(false);
    });

    test("checks if 2^1000 is NaN", () => {
        expect(JNum(2n ** 1000n).isNaN()).toBe(false);
    });

    test("checks if -2^1000 is NaN", () => {
        expect(JNum(-(2n ** 1000n)).isNaN()).toBe(false);
    });

    test("checks if 1/2 is NaN", () => {
        expect(JNum(1 / 2).isNaN()).toBe(false);
    });

    test("checks if #e1 is NaN", () => {
        expect(JNum(1).promoteTo(JNumType.REAL).isNaN()).toBe(false);
    });

    test("checks if 1+i is NaN", () => {
        expect(JNum({ real: 1, imag: 1 }).isNaN()).toBe(false);
    });

    test("checks if NaN is NaN", () => {
        expect(JNum(NaN).isNaN()).toBe(true);
    });

    test("checks if -NaN is NaN", () => {
        expect(JNum(-NaN).isNaN()).toBe(true);
    });
});
