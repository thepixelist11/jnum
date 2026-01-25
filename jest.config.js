import { createDefaultPreset } from "ts-jest";

const preset = createDefaultPreset();

/** @type {import("jest").Config} **/
export default {
    testEnvironment: "node",
    transform: {
        ...preset.transform,
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                tsconfig: "tsconfig.jest.json",
            },
        ],
    },
};

