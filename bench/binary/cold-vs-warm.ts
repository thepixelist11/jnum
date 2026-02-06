import { Benchmark } from "../harness";
import {
    _JNum,
    registerType,
    registerPromotion,
    precomputeReachableTypes,
    precomputePromotionPaths,
    CACHE,
    registerBinaryOp,
    dispatchBinaryOp,
} from "../../src/jnum";

const AType = Symbol("A");
const BType = Symbol("B");

class A extends _JNum {
    readonly type = AType;
}

class B extends _JNum {
    readonly type = BType;
}

const TESTS: Benchmark[] = [
    {
        name: "binary cold dispatch",
        iters: 1,
        repeat_full_test: 20_000,
        run: (a: _JNum, b: _JNum) => dispatchBinaryOp("test", a, b),
        setup: () => {
            registerType({ id: AType });
            registerType({ id: BType });

            registerPromotion({
                from: AType,
                to: BType,
                cost: 1,
                apply: v => v
            });

            registerBinaryOp("test", BType, BType, (x: B, y: B) => x);

            return [new A(), new A()];
        },
        teardown: () => {
            CACHE.invalidateDispatchTable();
            CACHE.invalidatePromotionCache();
            CACHE.invalidateReachableCache();
        },
        // baseline: (x: _JNum, y: _JNum) => x,
    } as Benchmark<2>,
];

export default TESTS;
