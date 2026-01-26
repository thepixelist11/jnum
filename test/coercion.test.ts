import { describe, expect, test } from "@jest/globals";
import { JNum, JNumType } from "../src/jnum";

describe("number coercion", () => {
    describe("fixnum", () => {
        test("unary + on 1", () => {
            expect(+JNum(1)).toBe(1);
        });

        test("unary - on 1", () => {
            expect(-JNum(1)).toBe(-1);
        });
    });

    describe("bignum", () => {
        test("unary + on 10^500", () => {
            expect(+JNum(10n ** 500n)).toBe(Infinity);
        });

        test("unary - on 10^500", () => {
            expect(-JNum(10n ** 500n)).toBe(-Infinity);
        });
    });

    describe("rational", () => {
        test("unary + on 1/2", () => {
            expect(+JNum({ num: 1, den: 2 })).toBe(1 / 2);
        });

        test("unary - on 1/2", () => {
            expect(-JNum({ num: 1, den: 2 })).toBe(-1 / 2);
        });
    });

    describe("inexact real", () => {
        test("unary + on #i1", () => {
            expect(+JNum(1, false)).toBe(1);
        });

        test("unary - on #i1", () => {
            expect(-JNum(1, false)).toBe(-1);
        });
    });

    describe("exact real", () => {
        test("unary + on 1", () => {
            expect(+JNum(1).promoteTo(JNumType.REAL)).toBe(1);
        });

        test("unary - on 1", () => {
            expect(-JNum(1).promoteTo(JNumType.REAL)).toBe(-1);
        });
    });
});

describe("string coercion", () => {
    describe("fixnum", () => {
        test("toString on 1", () => {
            expect(JNum(1).toString()).toBe("1");
        });

        test("toString on -1", () => {
            expect(JNum(-1).toString()).toBe("-1");
        });
    });

    describe("bignum", () => {
        test("toString on 10^500", () => {
            expect(JNum(10n ** 500n).toString()).toBe(`1${"0".repeat(500)}`);
        });

        test("toString on -10^500", () => {
            expect(JNum(-(10n ** 500n)).toString()).toBe(`-1${"0".repeat(500)}`);
        });
    });

    describe("rational", () => {
        test("toString on 1/2", () => {
            expect(JNum({ num: 1, den: 2 }).toString()).toBe("1/2");
        });

        test("toString on -1/2", () => {
            expect(JNum({ num: -1, den: 2 }).toString()).toBe("-1/2");
        });

        test("toString on 1/-2", () => {
            expect(JNum({ num: 1, den: -2 }).toString()).toBe("-1/2");
        });

        test("toString on -1/-2", () => {
            expect(JNum({ num: -1, den: -2 }).toString()).toBe("1/2");
        });
    });

    describe("inexact real", () => {
        test("toString on #i1", () => {
            expect(JNum(1, false).toString()).toBe("1");
        });

        test("toString on #i-1", () => {
            expect(JNum(-1, false).toString()).toBe("-1");
        });
    });

    describe("complex", () => {
        test("toString on 1+1i", () => {
            expect(JNum({ real: 1, imag: 1 }).toString()).toBe("1+1i");
        });

        // TODO:
        // test("toString on 1-1i", () => {
        //     expect(JNum({ num: 1, den: 2 }).toString()).toBe("1-1i");
        // });
    });

    describe("exact real", () => {
        test("toString on 1", () => {
            expect(JNum(1).promoteTo(JNumType.REAL).toString()).toBe("1");
        });

        test("toString on -1", () => {
            expect(JNum(-1).promoteTo(JNumType.REAL).toString()).toBe("-1");
        });
    });
});
