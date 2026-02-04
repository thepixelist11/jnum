import path from "path";
import process from "process";
import url from "url";
import { runSuite, TIMER_FN, JIT_ITERS } from "./harness";
import os from "os";
import v8 from "v8";

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

type Suite = {
    name: string;
    files: string[];
};

const SUITES: Suite[] = [
    {
        name: "Unary",
        files: [
            "./unary/cold-vs-warm.ts"
        ]
    }
];

function usage(): never {
    console.log(
        "Usage:\n" +
        "  npx tsx bench/run.ts            # run all benchmarks\n" +
        "  npx tsx bench/run.ts <suite>    # run a suite\n"
    );
    process.exit(1);
}

function header(title: string) {
    const mem = process.memoryUsage();
    process.stdout.write(`${title}\n`);
    process.stdout.write(`Node          : ${process.version}\n`);
    process.stdout.write(`V8            : ${process.versions.v8}\n`);
    process.stdout.write(`Platform      : ${os.platform()}\n`);
    process.stdout.write(`Architecture  : ${os.arch()}\n`);
    process.stdout.write(`CPU           : ${os.cpus()[0].model}\n`);
    process.stdout.write(`GC Management : ${global.gc ? "enabled" : "disabled"}\n`)
    process.stdout.write(`Timers        : ${TIMER_FN}\n`);
    process.stdout.write(`JIT Warmup    : not timed; ${JIT_ITERS} iterations\n`);
    process.stdout.write(`Memory RSS    : ${mem.rss}\n`);
    process.stdout.write(`Heap Total    : ${mem.heapTotal}\n`);
    process.stdout.write(`Heap Limit    : ${v8.getHeapStatistics().heap_size_limit}\n`);
    process.stdout.write(`Node Args     : ${process.execArgv}\n`);
    process.stdout.write("\n");
}

function pad(str: string, padChar: string, charCount: number = 1): string {
    if (padChar.length === 0) return str;

    const padding = new Array(Math.abs(charCount)).fill(padChar).join("");

    if (charCount > 0) {
        return padding + str + padding;
    }

    let newStr = ""
    const charLength = Math.abs(charCount * padChar.length);
    for (let i = charLength; i < str.length - charLength; i++) {
        newStr += str[i];
    }
    return padding + newStr + padding;
}

const args = process.argv.slice(2);
const selected = args.length === 0
    ? SUITES
    : SUITES.filter(s => args.includes(s.name));

if (args.length > 0 && selected.length === 0)
    usage();

header("JNum Benchmarks");
for (const suite of selected) {
    console.log(pad(` ${suite.name} `, "=", 30));

    for (const file of suite.files) {
        const full = path.join(__dirname, file);

        try {
            global.gc?.();
            const tests = (await import(full)).default;
            if (!tests) continue;

            runSuite(tests);
        } catch (err) {
            console.error(`Failed to run ${file}: \n${String(err)}`);
            continue;
        }
    }
}
