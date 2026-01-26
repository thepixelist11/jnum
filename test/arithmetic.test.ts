import { describe, expect, test } from "@jest/globals";
import { JNum, JNumType } from "../src/jnum";

describe("add", () => {
    describe('JNum.add', () => {
        test('complex number and real number', () => {
            const a = JNum({ real: 1, imag: 3 });
            const b = JNum(Math.PI);
            const result = JNum.add(a, b).promoteTo(JNumType.COMPLEX);

            expect(result.type).toBe(JNumType.COMPLEX);
            expect(+result.real).toBeCloseTo(1 + Math.PI);
            expect(+result.imag).toBe(3);
        });

        test('integer and rational number', () => {
            const a = JNum(2);
            const b = JNum(3.5);
            const result = JNum.add(a, b).promoteTo(JNumType.RATIONAL);

            expect(result.type).toBe(JNumType.RATIONAL);
            expect(+result.numerator).toBe(11);
            expect(+result.denominator).toBe(2);
        });

        test('integer and integer', () => {
            const a = JNum(2);
            const b = JNum(3);
            const result = JNum.add(a, b);

            expect(result.type).toBe(JNumType.FIXNUM);
            expect(+result).toBe(5);
        });

        test('inexact and inexact', () => {
            const a = JNum(0.1, false);
            const b = JNum(0.2, false);
            const result = JNum.add(a, b);

            expect(result.type).toBe(JNumType.REAL);
            expect(result.isExact()).toBe(false);
            expect(+result).toBeCloseTo(0.3);
        });

        test('exact and inexact', () => {
            const a = JNum(0.1);
            const b = JNum(0.2, false);
            const result = JNum.add(a, b);

            expect(result.type).toBe(JNumType.REAL);
            expect(result.isExact()).toBe(false);
            expect(+result).toBeCloseTo(0.3);
        });

        test('inexact and exact', () => {
            const a = JNum(0.1, false);
            const b = JNum(0.2);
            const result = JNum.add(a, b);

            expect(result.type).toBe(JNumType.REAL);
            expect(result.isExact()).toBe(false);
            expect(+result).toBeCloseTo(0.3);
        });

        test('exact and exact', () => {
            const a = JNum(0.1);
            const b = JNum(0.2);
            const result = JNum.add(a, b);

            expect(result.type).toBe(JNumType.RATIONAL);
            expect(result.isExact()).toBe(true);
            expect(+result).toBe(0.3);
        });

        test('purely imaginary numbers', () => {
            const a = JNum({ real: 0, imag: 2 });
            const b = JNum({ real: 0, imag: 4 });
            const result = JNum.add(a, b).promoteTo(JNumType.COMPLEX);

            expect(result.type).toBe(JNumType.COMPLEX);
            expect(+result.real).toBe(0);
            expect(+result.imag).toBe(6);
        });

        test('complex number and zero', () => {
            const a = JNum({ real: 1, imag: -1 });
            const b = JNum(0);
            const result = JNum.add(a, b).promoteTo(JNumType.COMPLEX);

            expect(result.type).toBe(JNumType.COMPLEX);
            expect(+result.real).toBe(1);
            expect(+result.imag).toBe(-1);
        });
    });
});

