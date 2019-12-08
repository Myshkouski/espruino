import path from 'path'

import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import multiEntry from 'rollup-plugin-multi-entry'
import { terser } from 'rollup-plugin-terser'

const __src = path.resolve('src')
const __dist = path.resolve('dist')

const external = () => false
const extensions = ['.mjs', '.js']

export default {
    input: path.resolve(__src, 'index.mjs'),
    external,
    output: [
        {
            dir: __dist,
            entryFileNames: '[name].min.js',
            format: 'cjs',
            exports: 'none',
            plugins: [
                terser({
                    compress: {
                        toplevel: true
                    },
                    output: {
                        comments: false,
                        ecma: true
                    }
                })
            ]
        },

        {
            dir: __dist,
            exports: 'none',
            format: 'cjs'
        }
    ],
    plugins: [
        multiEntry(),
        
        resolve({
            extensions
        }),

        commonjs({
            extensions
        }),

        babel({
            extensions,
            plugins: [

            ],
            presets: [
                'babel-preset-espruino'
            ]
        })
    ]
}
