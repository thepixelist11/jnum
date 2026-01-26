import { describe, expect, test } from "@jest/globals";
import { JNum } from "../src/jnum";

describe("malformed input handling (constructor throws)", () => {
    describe("rational-like objects", () => {
        test("missing denominator", () => {
            expect(() => JNum({ num: 1 } as any)).toThrow();
        });

        test("missing numerator", () => {
            expect(() => JNum({ den: 1 } as any)).toThrow();
        });

        test("zero denominator", () => {
            expect(() => JNum({ num: 1, den: 0 } as any)).toThrow();
        });

        test("rational numerator", () => {
            expect(() => JNum({ num: { num: 1, den: 2 }, den: 1 } as any)).toThrow();
        });

        test("demoting rational numerator", () => {
            expect(() => JNum({ num: { num: 2, den: 2 }, den: 1 } as any)).not.toThrow();
        });

        test("rational denominator", () => {
            expect(() => JNum({ num: 0, den: { num: 1, den: 2 } } as any)).toThrow();
        });

        test("demoting rational denominator", () => {
            expect(() => JNum({ num: 0, den: { num: 2, den: 2 } } as any)).not.toThrow();
        });

        test("NaN denominator", () => {
            expect(() => JNum({ num: 1, den: NaN } as any)).toThrow();
        });

        test("Infinity denominator", () => {
            expect(() => JNum({ num: 1, den: Infinity } as any)).toThrow();
        });
    });

    describe("complex-like objects", () => {
        test("missing imaginary part", () => {
            expect(() => JNum({ real: 1 } as any)).toThrow();
        });

        test("missing real part", () => {
            expect(() => JNum({ imag: 0 } as any)).toThrow();
        });

        test("NaN imaginary part", () => {
            expect(() => JNum({ real: 1, imag: NaN } as any)).toThrow();
        });
    });

    describe("invalid primitive or object inputs", () => {
        test("null", () => {
            expect(() => JNum(null as any)).toThrow();
        });

        test("undefined", () => {
            expect(() => JNum(undefined as any)).toThrow();
        });

        test("boolean", () => {
            expect(() => JNum(true as any)).toThrow();
            expect(() => JNum(false as any)).toThrow();
        });

        test("empty object", () => {
            expect(() => JNum({} as any)).toThrow();
        });
    });
});

