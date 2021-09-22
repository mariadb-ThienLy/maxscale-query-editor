import fs from 'fs'
import path from 'path'
import VuePlugin from 'rollup-plugin-vue'
import alias from '@rollup/plugin-alias'
import commonjs from '@rollup/plugin-commonjs'
import NodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import babel from '@rollup/plugin-babel'
import minimist from 'minimist'
import vuetify from 'rollup-plugin-vuetify'
import PostCSS from 'rollup-plugin-postcss'
import VueI18nPlugin from 'rollup-plugin-vue-i18n'
// Get browserslist config and remove ie from es build targets
const esbrowserslist = fs
    .readFileSync('./.browserslistrc')
    .toString()
    .split('\n')
    .filter(entry => entry && entry.substring(0, 2) !== 'ie')

// Extract babel preset-env config, to combine with esbrowserslist
const babelPresetEnvConfig = require('../babel.config').presets.filter(
    entry => entry[0] === '@babel/preset-env'
)[0][1]

const argv = minimist(process.argv.slice(2))

const projectRoot = path.resolve(__dirname, '..')
const srcPath = `${path.resolve(projectRoot, 'src')}`
const baseConfig = {
    plugins: {
        preVue: [
            alias({
                entries: [
                    {
                        find: '@',
                        replacement: srcPath,
                    },
                ],
            }),
        ],
        replace: {
            'process.env.NODE_ENV': JSON.stringify('production'),
        },
        vue: {
            css: true,
            template: {
                isProduction: true,
            },
            preprocessStyles: true,
            data: {
                // This helps to inject variables in each <style> tag of every Vue SFC
                scss: () => `@import "${srcPath}/styles/constants.scss";`,
                vue: () => `@import "${srcPath}/styles/constants.scss";`,
            },
        },
        postVue: [
            NodeResolve({
                extensions: ['.js', '.jsx', '.ts', '.tsx', '.vue'],
            }),
            commonjs(),
            vuetify(),
            PostCSS({
                modules: true,
                extract: true,
                sourceMap: true,
                minimize: true,
            }),
        ],
        babel: {
            exclude: 'node_modules/**',
            extensions: ['.js', '.jsx', '.ts', '.tsx', '.vue'],
            babelHelpers: 'bundled',
        },
    },
}

// Refer to https://rollupjs.org/guide/en/#warning-treating-module-as-external-dependency
const external = [
    // list external dependencies, exactly the way it is written in the import statement.
    'vue',
    'vuetify',
    'vuetify/lib',
    'vuex',
    'lodash',
    'vue-moment',
    'moment',
    'axios',
]
// Customize configs for using as SFC
const buildFormats = []
if (!argv.format || argv.format === 'es') {
    const esConfig = {
        ...baseConfig,
        input: 'src/entry.esm.js',
        external,
        output: {
            file: 'dist/maxscale-query-editor.esm.js',
            format: 'esm',
            exports: 'named',
        },
        plugins: [
            replace({ preventAssignment: true, ...baseConfig.plugins.replace }),
            ...baseConfig.plugins.preVue,
            VuePlugin({
                ...baseConfig.plugins.vue,
                // PostCSS-modules options for <style module> compilation
                cssModulesOptions: {
                    generateScopedName: '[local]___[hash:base64:5]',
                },
                customBlocks: ['i18n'],
            }),
            VueI18nPlugin({
                // `include` option for i18n resources bundling
                include: path.resolve(__dirname, `${srcPath}/locales/**`),
            }),
            NodeResolve(),
            ...baseConfig.plugins.postVue,
            babel({
                ...baseConfig.plugins.babel,
                presets: [
                    [
                        '@babel/preset-env',
                        {
                            ...babelPresetEnvConfig,
                            targets: esbrowserslist,
                        },
                    ],
                ],
            }),
        ],
    }
    buildFormats.push(esConfig)
}
// Export config
export default buildFormats
