/*
 * Copyright (c) 2020 MariaDB Corporation Ab
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file and at www.mariadb.com/bsl11.
 *
 * Change Date: 2025-09-20
 *
 * On the date above, in accordance with the Business Source License, use
 * of this software will be governed by version 2 or later of the General
 * Public License.
 */

const path = require('path')

process.env.VUE_APP_VERSION = require('./package.json').version
module.exports = {
    chainWebpack: config => {
        const types = ['vue-modules', 'vue', 'normal-modules', 'normal']
        types.forEach(type => addStyleResource(config.module.rule('scss').oneOf(type)))
        config.when(process.env.NODE_ENV === 'development', config => {
            // devtool
            config.merge({
                devtool: 'source-map',
                devServer: {
                    progress: false,
                    port: 8000,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    },
                    proxy: {
                        '^/': {
                            changeOrigin: true,
                            target: process.env.VUE_APP_API,
                        },
                    },
                },
            })
        })

        config.resolve.modules.add(path.resolve('./src'), path.resolve('./node_modules'))

        /*
            To strip all locales except “en”, and ...
            (“en” is built into Moment and can’t be removed)
        */
        config.plugin('MomentLocalesPlugin').use(require('moment-locales-webpack-plugin'), [
            {
                localesToKeep: [], //e.g. 'ru', 'vi'
            },
        ])
        config.externals = {
            moment: 'moment',
            vuetify: 'vuetify/lib',
        }
    },

    transpileDependencies: ['vuetify'],

    outputDir: `dist`,

    productionSourceMap: false,
    css: { extract: false },
}
function addStyleResource(rule) {
    rule.use('style-resource')
        .loader('style-resources-loader')
        .options({
            patterns: [path.resolve(__dirname, './src/styles/constants.scss')],
        })
}
