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
import VueMoment from 'vue-moment'
import momentDurationFormatSetup from 'moment-duration-format'

Vue.use(VueMoment)

momentDurationFormatSetup(Vue.moment)
