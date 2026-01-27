import { registerBinaryOp } from "jnum-runtime";
import { BigNum, BigNumType } from "numerics/bignum";
import { FixNum, FixNumType } from "numerics/fixnum";

/* =========== RationalNum =========== */

/* ============== BigNum ============= */

registerBinaryOp<BigNum, BigNum, boolean>("lt", BigNumType, BigNumType,
    (a, b) => a.raw < b.raw
);

registerBinaryOp<BigNum, BigNum, boolean>("lte", BigNumType, BigNumType,
    (a, b) => a.raw <= b.raw
);

registerBinaryOp<BigNum, BigNum, boolean>("gt", BigNumType, BigNumType,
    (a, b) => a.raw > b.raw
);

registerBinaryOp<BigNum, BigNum, boolean>("gte", BigNumType, BigNumType,
    (a, b) => a.raw >= b.raw
);

registerBinaryOp<BigNum, BigNum, boolean>("eq", BigNumType, BigNumType,
    (a, b) => a.raw === b.raw
);

/* ============== FixNum ============= */

registerBinaryOp<FixNum, FixNum, boolean>("lt", FixNumType, FixNumType,
    (a, b) => a.raw < b.raw
);

registerBinaryOp<FixNum, FixNum, boolean>("lte", FixNumType, FixNumType,
    (a, b) => a.raw <= b.raw
);

registerBinaryOp<FixNum, FixNum, boolean>("gt", FixNumType, FixNumType,
    (a, b) => a.raw > b.raw
);

registerBinaryOp<FixNum, FixNum, boolean>("gte", FixNumType, FixNumType,
    (a, b) => a.raw >= b.raw
);

registerBinaryOp<FixNum, FixNum, boolean>("eq", FixNumType, FixNumType,
    (a, b) => a.raw === b.raw
);
