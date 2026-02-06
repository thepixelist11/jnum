import { Benchmark } from "../harness";
import { _JNum, JNum } from "../../src/jnum";

let J = new JNum();

let sink: any;


const TESTS: Benchmark[] = [
    {
        name: "unary cold dispatch",
        iters: 1,
        repeat_full_test: 20_000,
        run: (a: _JNum) => J.dispatchUnaryOp("test", a),
        setup: () => {
            J = new JNum();

            const AType = J.JNumType("AType");
            const BType = J.JNumType("AType");

            class A extends _JNum {
                readonly type = AType;
            }

            class B extends _JNum {
                readonly type = BType;
            }

            J.registerType({ id: AType });
            J.registerType({ id: BType });

            J.registerPromotion({
                from: AType,
                to: BType,
                cost: 1,
                apply: v => v
            });

            J.registerUnaryOp("test", BType, (x: B) => x);

            return [new A()];
        },
        teardown: () => {
            J.invalidateBinaryDispatchTable();
            J.invalidatePromotionCache();
            J.invalidateReachableCache();
        },
        baseline: (x: _JNum) => sink = x,
    } as Benchmark<1>,
    {
        name: "unary warm dispatch",
        iters: 500,
        repeat_full_test: 100,
        run: (a: _JNum) => J.dispatchUnaryOp("test", a),
        setup: () => {
            J = new JNum();

            const AType = J.JNumType("AType");
            const BType = J.JNumType("AType");

            class A extends _JNum {
                readonly type = AType;
            }

            class B extends _JNum {
                readonly type = BType;
            }

            J.registerType({ id: AType });
            J.registerType({ id: BType });

            J.registerPromotion({
                from: AType,
                to: BType,
                cost: 1,
                apply: v => v
            });

            J.registerUnaryOp("test", BType, (x: B) => x);

            J.precomputeAllUnaryDispatchPlans();
            J.precomputeReachableTypes();
            J.precomputePromotionPaths();

            return [new A()];
        },
        teardown: () => {
            J.invalidateBinaryDispatchTable();
            J.invalidatePromotionCache();
            J.invalidateReachableCache();
        },
        baseline: (x: _JNum) => sink = x,
    } as Benchmark<1>,
    {
        name: "unary direct kernel",
        iters: 500,
        repeat_full_test: 100,
        run: (b: _JNum) => J.dispatchUnaryOp("test", b),
        setup: () => {
            J = new JNum();

            const AType = J.JNumType("AType");
            const BType = J.JNumType("AType");

            class B extends _JNum {
                readonly type = BType;
            }

            J.registerType({ id: AType });
            J.registerType({ id: BType });

            J.registerUnaryOp("test", BType, (x: B) => x);

            return [new B()];
        },
        teardown: () => {
            J.invalidateBinaryDispatchTable();
            J.invalidatePromotionCache();
            J.invalidateReachableCache();
        },
        baseline: (x: _JNum) => sink = x,

    } as Benchmark<1>,
];

export default TESTS;
