import typescript from 'rollup-plugin-typescript2';
import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';

export default {
    input: 'src/jnum.ts',
    output: [
        {
            file: 'dist/index.cjs.js',
            format: 'cjs',
            sourcemap: false,
        },
        {
            file: 'dist/index.esm.js',
            format: 'esm',
            sourcemap: false,
        }
    ],
    plugins: [
        resolve(),
        typescript({ useTsconfigDeclarationDir: true }),
        terser({
            mangle: false,
            compress: {
                passes: 2,
            },
            format: {
                comments: false
            }
        }),
    ]
};

