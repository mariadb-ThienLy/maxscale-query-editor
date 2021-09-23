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
import Vue from 'vue'
import Vuex from 'vuex'
import query, { defWorksheetState } from './query'
import persisted from './persisted'
import { APP_CONFIG } from '@/utils/constants'
import createPersistedState from 'vuex-persistedstate'
const plugins = store => {
    store.vue = Vue.prototype
}

const store = new Vuex.Store({
    plugins: [
        plugins,
        createPersistedState({
            key: 'maxscale-query-editor',
            paths: ['persisted', 'query.worksheets_arr', 'query.cnct_resources'],
        }),
    ],
    state: {
        app_config: APP_CONFIG,
        snackbar_message: {
            status: false,
            text: '',
            type: 'info',
        },
        overlay_type: false,
    },
    mutations: {
        SET_OVERLAY_TYPE(state, type) {
            state.overlay_type = type
        },
        /**
         * @param {Object} obj Object snackbar_message
         * @param {Array} obj.text An array of string
         * @param {String} obj.type Type of response
         */
        SET_SNACK_BAR_MESSAGE(state, obj) {
            const { text, type, status = true } = obj
            state.snackbar_message.status = status
            state.snackbar_message.text = text
            state.snackbar_message.type = type
        },
    },
    modules: {
        query,
        persisted,
    },
})
export default store

let initialState = Vue.prototype.$helper.lodash.cloneDeep(store.state)
/**
 * A workaround to get fresh initial states because below states are stored in localStorage
 */
initialState.query.worksheets_arr = [defWorksheetState()]
initialState.query.cnct_resources = []
/** for state hydration*/
export function resetState() {
    store.replaceState(initialState)
}
