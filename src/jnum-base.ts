export type PrimitiveHint = "string" | "number" | "default";

export type JNumType = symbol;

export abstract class _JNum {
    abstract readonly type: JNumType;

    toString(): string { return `${this}` };
}

