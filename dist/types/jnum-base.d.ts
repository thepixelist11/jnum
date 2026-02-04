export type PrimitiveHint = "string" | "number" | "default";
export type JNumType = symbol;
export declare abstract class _JNum {
    abstract readonly type: JNumType;
    toString(): string;
}
//# sourceMappingURL=jnum-base.d.ts.map