import { describe, expect, test } from "@jest/globals";
import { JNum } from "../src/jnum";

describe("isExactInteger", () => {
    test("checks if 1 is an exact integer", () => {
        expect(JNum(1).isExactInteger()).toBe(true);
    });

    test("checks if 0 is an exact integer", () => {
        expect(JNum(0).isExactInteger()).toBe(true);
    });

    test("checks if -0 is an exact integer", () => {
        expect(JNum(-0).isExactInteger()).toBe(true);
    });

    test("checks if #i0 is an exact integer", () => {
        expect(JNum(0, false).isExactInteger()).toBe(false);
    });

    test("checks if 2^500 is an exact integer", () => {
        expect(JNum(2n ** 500n).isExactInteger()).toBe(true);
    });

    test("checks if -1 is an exact integer", () => {
        expect(JNum(-1).isExactInteger()).toBe(true);
    });

    test("checks if -(2^500) is an exact integer", () => {
        expect(JNum(-(2n ** 500n)).isExactInteger()).toBe(true);
    });

    test("checks if 1.0 is an exact integer", () => {
        expect(JNum(1.0).isExactInteger()).toBe(true);
    });

    test("checks if 0.5 is an exact integer", () => {
        expect(JNum(0.5).isExactInteger()).toBe(false);
    });

    test("checks if i is an exact integer", () => {
        expect(JNum({ real: 0, imag: 1 }).isExactInteger()).toBe(false);
    });

    test("checks if 1+0i is an exact integer", () => {
        expect(JNum({ real: 1, imag: 0 }).isExactInteger()).toBe(true);
    });

    test("checks if 0.5+0i is an exact integer", () => {
        expect(JNum({ real: 0.5, imag: 0 }).isExactInteger()).toBe(false);
    });

    test("checks if #i0.1 is an exact integer", () => {
        expect(JNum(0.1, false).isExactInteger()).toBe(false);
    });

    test("checks if #i3 is an exact integer", () => {
        expect(JNum(3, false).isExactInteger()).toBe(false);
    });

    test("checks if 2/1 is an exact integer", () => {
        expect(JNum({ num: 2, den: 1 }).isExactInteger()).toBe(true);
    });

    test("checks if 2/2 is an exact integer", () => {
        expect(JNum({ num: 2, den: 2 }).isExactInteger()).toBe(true);
    });

    test("checks if -1/-1 is an exact integer", () => {
        expect(JNum({ num: -1, den: -1 }).isExactInteger()).toBe(true);
    });

    test("checks if 1/-1 is an exact integer", () => {
        expect(JNum({ num: 1, den: -1 }).isExactInteger()).toBe(true);
    });

    test("checks if 0/1 is an exact integer", () => {
        expect(JNum({ num: 0, den: 1 }).isExactInteger()).toBe(true);
    });

    test("checks if BigInt 0 is an exact integer", () => {
        expect(JNum(0n).isExactInteger()).toBe(true);
    });

    test("checks if Infinity is an exact integer", () => {
        expect(JNum(Infinity).isExactInteger()).toBe(false);
    });

    test("checks if NaN is an exact integer", () => {
        expect(JNum(NaN).isExactInteger()).toBe(false);
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
        expect(JNum(0, false).isRational()).toBe(false);
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
        expect(JNum(0.1, false).isRational()).toBe(false);
    });

    test("checks if #i3 is a rational", () => {
        expect(JNum(3, false).isRational()).toBe(false);
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

