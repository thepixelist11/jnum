import { runSuite, TIMER_FN, JIT_ITERS } from "./harness";
import { execSync, spawnSync } from "child_process";
import process from "process";
import path from "path";
import url from "url";
import os from "os";
import v8 from "v8";
import fs from "fs";

function isChild() {
    return process.argv.some(a => a.startsWith("--__child="));
}

function parseChildArg() {
    const arg = process.argv.find(a => a.startsWith("--__child="));
    if (!arg) throw new Error("missing child arg");

    const payload = arg.split("=", 2)[1];
    const [file, index_str] = payload.split(":");
    const index = Number(index_str);

    if (!Number.isInteger(index)) throw new Error("invalid benchmark index");

    return { file, index };
}

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
    },
    {
        name: "Binary",
        files: [
            "./binary/cold-vs-warm.ts"
        ]
    }
];

interface CPUStatInfo {
    core: number;
    model: string;
    core_count: number;
    nominal_freq?: number;
    scaling_freq?: number;
    max_freq?: number;
    turbo_enabled?: boolean;
}

function CPUStat(core: number = 0): CPUStatInfo {
    let scaling_freq: number | undefined = undefined;
    let turbo_enabled: boolean | undefined = undefined;
    let model: string = os.cpus()[core].model;
    let core_count: number = os.cpus().length;
    let nominal_freq: number | undefined = os.cpus()[core].speed;
    let max_freq: number | undefined = undefined;

    const platform = os.platform();

    try {
        if (platform === "linux") {
            try {
                const curStr = fs.readFileSync(`/sys/devices/system/cpu/cpu${core}/cpufreq/scaling_cur_freq`, "utf8").trim();
                scaling_freq = Number(curStr) / 1000;
            } catch { }

            try {
                const turboStr = fs.readFileSync("/sys/devices/system/cpu/intel_pstate/no_turbo", "utf8").trim();
                turbo_enabled = turboStr === "0";
            } catch { }

            try {
                const maxStr = fs.readFileSync(`/sys/devices/system/cpu/cpu${core}/cpufreq/cpuinfo_max_freq`, "utf8").trim();
                max_freq = Number(maxStr) / 1000;
            } catch { }

        } else if (platform === "win32") {
            try {
                const output = execSync("wmic cpu get CurrentClockSpeed,MaxClockSpeed /format:list", { encoding: "utf8" });
                const lines = output.split(/\r?\n/).filter(Boolean);
                lines.forEach(line => {
                    const [key, value] = line.split("=");
                    if (!key || !value) return;
                    if (key.includes("CurrentClockSpeed")) scaling_freq = Number(value);
                    if (key.includes("MaxClockSpeed")) max_freq = Number(value);
                });
            } catch { }

            turbo_enabled = undefined;

        } else if (platform === "darwin") {
            try {
                const curStr = execSync("sysctl -n hw.cpufrequency", { encoding: "utf8" }).trim();
                scaling_freq = Number(curStr) / 1e6;
            } catch { }
            try {
                const maxStr = execSync("sysctl -n hw.cpufrequency_max", { encoding: "utf8" }).trim();
                max_freq = Number(maxStr) / 1e6;
            } catch { }

            turbo_enabled = undefined;

        } else {
            scaling_freq = nominal_freq;
        }

    } catch { }

    return {
        core,
        model,
        core_count,
        nominal_freq,
        scaling_freq,
        max_freq,
        turbo_enabled
    };
}

function usage(): never {
    console.log(
        "Usage:\n" +
        "  npx tsx bench/run.ts            # run all benchmarks\n" +
        "  npx tsx bench/run.ts <suite>    # run a suite\n"
    );
    process.exit(1);
}

function printCPUStats(stats: CPUStatInfo, col_size = 14) {
    process.stdout.write(`--- CPU Info (core ${stats.core})\n`);
    if (stats.model) process.stdout.write("Model".padEnd(col_size) + `: ${stats.model}\n`);
    if (stats.core_count) process.stdout.write("Core Count".padEnd(col_size) + `: ${stats.core_count}\n`);
    if (stats.turbo_enabled) process.stdout.write("Turbo".padEnd(col_size) + `: ${stats.turbo_enabled ? "yes" : "no"}\n`);
    if (stats.nominal_freq) process.stdout.write("Nominal Freq".padEnd(col_size) + `: ${stats.nominal_freq.toFixed(2)} MHz\n`);
    if (stats.scaling_freq) process.stdout.write("Scaling Freq".padEnd(col_size) + `: ${stats.scaling_freq.toFixed(2)} MHz\n`);
    if (stats.max_freq) process.stdout.write("Max Freq".padEnd(col_size) + `: ${stats.max_freq.toFixed(2)} MHz\n`);
    process.stdout.write("---\n");
}

function header(title: string) {
    const cpu0stats = CPUStat(0);

    const mem = process.memoryUsage();
    process.stdout.write(`${title}\n`);
    process.stdout.write(`Node          : ${process.version}\n`);
    process.stdout.write(`V8            : ${process.versions.v8}\n`);
    process.stdout.write(`Platform      : ${os.platform()}\n`);
    process.stdout.write(`Architecture  : ${os.arch()}\n`);
    printCPUStats(cpu0stats);
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

if (isChild()) {
    const { file, index } = parseChildArg();

    try {
        global.gc?.();

        const tests = (await import(path.resolve(file))).default;
        if (!tests || !tests[index]) {
            throw new Error(`Benchmark index ${index} not found`);
        }

        runSuite([tests[index]]);
    } catch (err) {
        console.error(`Failed to run ${file}[${index}]:\n${String(err)}`);
        process.exit(1);
    }

    process.exit(0);
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
        let tests: unknown[];

        try {
            tests = (await import(full)).default;
            if (!Array.isArray(tests)) continue;
        } catch (err) {
            console.error(`Failed to load ${full}:\n${String(err)}`);
            continue;
        }

        for (let i = 0; i < tests.length; i++) {
            const res = spawnSync(
                process.execPath,
                [
                    ...process.execArgv,
                    process.argv[1],
                    `--__child=${full}:${i}`,
                ],
                {
                    stdio: "inherit",
                    env: process.env
                }
            );

            if (res.status !== 0)
                console.error(`Benchmark ${full}[${i}] failed`);
        }
    }
}
