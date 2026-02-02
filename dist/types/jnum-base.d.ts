export type PrimitiveHint = "string" | "number" | "default";
export type JNumType = symbol;
export declare abstract class _JNum {
    abstract readonly type: JNumType;
    abstract normalize(): _JNum;
    abstract canDemote(): boolean;
    abstract demote(): _JNum;
    toString(): string;
}
//# sourceMappingURL=jnum-base.d.ts.map