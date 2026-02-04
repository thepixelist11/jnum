import { Benchmark } from "../harness";
import {
    _JNum,
    registerType,
    registerUnaryOp,
    dispatchUnaryOp,
    registerPromotion,
    precomputeAllUnaryDispatchPlans,
    precomputeReachableTypes,
    precomputePromotionPaths,
    CACHE,
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
        name: "unary cold dispatch",
        iters: 1,
        repeat_full_test: 20_000,
        run: (a: _JNum) => dispatchUnaryOp("test", a),
        setup: () => {
            registerType({ id: AType });
            registerType({ id: BType });

            registerPromotion({
                from: AType,
                to: BType,
                cost: 1,
                apply: v => v
            });

            registerUnaryOp("test", BType, (x: B) => x);

            return [new A()];
        },
        teardown: () => {
            CACHE.invalidateDispatchTable();
            CACHE.invalidatePromotionCache();
            CACHE.invalidateReachableCache();
        }
    } as Benchmark<1>,
    {
        name: "unary warm dispatch",
        iters: 500,
        repeat_full_test: 100,
        run: (a: _JNum) => dispatchUnaryOp("test", a),
        setup: () => {
            registerType({ id: AType });
            registerType({ id: BType });

            registerPromotion({
                from: AType,
                to: BType,
                cost: 1,
                apply: v => v
            });

            registerUnaryOp("test", BType, (x: B) => x);

            precomputeAllUnaryDispatchPlans();
            precomputeReachableTypes();
            precomputePromotionPaths();

            return [new A()];
        },
        teardown: () => {
            CACHE.invalidateDispatchTable();
            CACHE.invalidatePromotionCache();
            CACHE.invalidateReachableCache();
        }
    } as Benchmark<1>,
    {
        name: "unary direct kernel",
        iters: 500,
        repeat_full_test: 100,
        run: (b: _JNum) => dispatchUnaryOp("test", b),
        setup: () => {
            registerType({ id: AType });
            registerType({ id: BType });

            registerUnaryOp("test", BType, (x: B) => x);

            return [new B()];
        },
        teardown: () => {
            CACHE.invalidateDispatchTable();
            CACHE.invalidatePromotionCache();
            CACHE.invalidateReachableCache();
        }

    } as Benchmark<1>,
    {
        name: "baseline",
        iters: 500,
        repeat_full_test: 100,
        run: (b: _JNum) => b,
        setup: () => {
            return [new B()];
        },
        teardown: () => {
            CACHE.invalidateDispatchTable();
            CACHE.invalidatePromotionCache();
            CACHE.invalidateReachableCache();
        }

    } as Benchmark<1>
];

export default TESTS;
