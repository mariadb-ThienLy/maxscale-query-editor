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
import { getErrorsArr, delay } from '@/utils/helpers'
import ax from 'axios'
export default store => {
    let apiClient = ax.create({
        baseURL: '/',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
        },
    })

    apiClient.interceptors.response.use(
        response => {
            return response
        },
        async error => {
            const { response: { status = null } = {} } = error || {}
            switch (status) {
                case 503: {
                    return store.commit('SET_SNACK_BAR_MESSAGE', {
                        text: [...getErrorsArr(error), 'Please reconnect'],
                        type: 'error',
                    })
                }
                default:
                    store.commit('SET_SNACK_BAR_MESSAGE', {
                        text: getErrorsArr(error),
                        type: 'error',
                    })

                    if (store.state.overlay_type !== null)
                        await delay(600).then(() => store.commit('SET_OVERLAY_TYPE', null))
                    return Promise.reject(error)
            }
        }
    )
    return apiClient
}
