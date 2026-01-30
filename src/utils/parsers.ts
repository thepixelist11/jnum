interface ParserSpec<R> {
    pattern: RegExp;
    pred?: (x: string) => boolean;
    modifier?: (match: string, ...args: any[]) => R;
};

function generateParser<R>(spec: ParserSpec<R>) {
    return (x: string) => {
        if (spec.pred && !spec.pred(x))
            return false;

        const results = spec.pattern.exec(x);
        if (results === null)
            return false;

        const [_, ...matches] = results;

        if (spec.modifier)
            return matches.map(spec.modifier);

        return matches;
    };
}
