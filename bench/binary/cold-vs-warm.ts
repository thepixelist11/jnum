import { Benchmark } from "../harness";
import { _JNum, JNum } from "../../src/jnum";

let J = new JNum();

let sink: any;

const TESTS: Benchmark[] = [
    {
        name: "binary cold dispatch (both promote)",
        iters: 1,
        repeat_full_test: 20_000,
        run: (a: _JNum, b: _JNum) => J.dispatchBinaryOp("test", a, b),
        setup: () => {
            J = new JNum();

            const AType = J.JNumType("AType");
            const BType = J.JNumType("AType");

            class A extends _JNum {
                readonly type = AType;
                readonly J = J;
                static readonly Type = AType;
            }

            class B extends _JNum {
                readonly type = BType;
                readonly J = J;
                static readonly Type = BType;
            }

            J.registerType(A.Type);
            J.registerType(B.Type);

            J.registerPromotion({
                from: AType,
                to: BType,
                cost: 1,
                apply: v => v
            });

            J.registerBinaryOp("test", BType, BType, (a: B, b: B) => a == b);

            return [new A(), new A()];
        },
        teardown: () => {
            J.invalidateBinaryDispatchTable();
            J.invalidatePromotionCache();
            J.invalidateReachableCache();
        },
        baseline: (a: _JNum, b: _JNum) => sink = a == b,
    } as Benchmark<2>,
    {
        name: "binary warm dispatch (both promote)",
        iters: 500,
        repeat_full_test: 100,
        run: (a: _JNum, b: _JNum) => J.dispatchBinaryOp("test", a, b),
        setup: () => {
            J = new JNum();

            const AType = J.JNumType("AType");
            const BType = J.JNumType("AType");

            class A extends _JNum {
                readonly type = AType;
                readonly J = J;
                static readonly Type = AType;
            }

            class B extends _JNum {
                readonly type = BType;
                readonly J = J;
                static readonly Type = BType;
            }

            J.registerType(A.Type);
            J.registerType(B.Type);

            J.registerPromotion({
                from: AType,
                to: BType,
                cost: 1,
                apply: v => v
            });

            J.registerBinaryOp("test", BType, BType, (a: B, b: B) => a == b);

            J.precomputeAllUnaryDispatchPlans();
            J.precomputeReachableTypes();
            J.precomputePromotionPaths();

            return [new A(), new B()];
        },
        teardown: () => {
            J.invalidateBinaryDispatchTable();
            J.invalidatePromotionCache();
            J.invalidateReachableCache();
        },
        baseline: (a: _JNum, b: _JNum) => sink = a == b,
    } as Benchmark<2>,
    {
        name: "binary direct kernel (no promotion)",
        iters: 500,
        repeat_full_test: 100,
        run: (a: _JNum, b: _JNum) => J.dispatchBinaryOp("test", a, b),
        setup: () => {
            J = new JNum();

            const BType = J.JNumType("AType");

            class B extends _JNum {
                readonly type = BType;
                readonly J = J;
                static readonly Type = BType;
            }

            J.registerType(B.Type);

            J.registerBinaryOp("test", BType, BType, (a: B, b: B) => a == b);

            return [new B(), new B()];
        },
        teardown: () => {
            J.invalidateBinaryDispatchTable();
            J.invalidatePromotionCache();
            J.invalidateReachableCache();
        },
        baseline: (a: _JNum, b: _JNum) => sink = a == b,

    } as Benchmark<2>,
];

export default TESTS;
