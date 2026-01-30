interface ParserSpec<R> {
    pattern: RegExp;
    pred?: (x: string) => boolean;
    modifier?: (match: string, ...args: any[]) => R;
}
declare function generateParser<R>(spec: ParserSpec<R>): (x: string) => false | string[] | R[];
//# sourceMappingURL=parsers.d.ts.map