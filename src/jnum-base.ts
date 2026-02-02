export type PrimitiveHint = "string" | "number" | "default";

export type JNumType = symbol;

export abstract class _JNum {
    abstract readonly type: JNumType;

    abstract normalize(): _JNum;
    abstract canDemote(): boolean;
    abstract demote(): _JNum;

    toString(): string { return `${this}` };
}

