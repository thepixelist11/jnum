/**
 * Hints used for primitive coercion.
 *
 * @remarks
 * This mirrors the standard Javascript `ToPrimitive` hint values and may be
 * used by JNum implementations to control how values are coerced when a
 * primitive representation is required.
 */
export type PrimitiveHint = "string" | "number" | "default";
/**
 * A unique identifier for a JNum type. This is a semantic alias for a symbol.
 */
export type JNumType = symbol;
/**
 * Abstract base class for all JNum values.
 *
 * @remarks
 * All values participating in the JNum dispatch and promotion system must
 * extend this class. Concrete subclasses define their behaviour and associate
 * themselves with a specific `JNumType`.
 *
 * The `type` property is used as the primary runtime dispatch key for
 * operations and promotions.
 */
export declare abstract class _JNum {
    /** The runtime type of this value */
    abstract readonly type: JNumType;
    /**
     * Returns a stirng representation of the value.
     *
     * @remarks
     * This method delegates to JavaScript's default string coercion.
     * Subclasses may override this behaviour if a custom string representation
     * is required.
     */
    toString(): string;
    /**
     * Provides the value for `Object.prototype.toString.call(this)`.
     *
     * @remarks
     * Returns the description of the associated `JNumType`, if present.
     */
    [Symbol.toStringTag](): string | undefined;
}
//# sourceMappingURL=jnum-base.d.ts.map