<template>
    <div class="fill-height">
        <div ref="header" class="pb-2 result-header d-flex align-center">
            <v-tabs v-model="activeView" hide-slider :height="20" class="tab-navigation--btn-style">
                <v-tab
                    :key="SQL_QUERY_MODES.HISTORY"
                    :href="`#${SQL_QUERY_MODES.HISTORY}`"
                    class="tab-btn px-3 text-uppercase"
                    active-class="tab-btn--active font-weight-medium"
                >
                    {{ 'history' }}
                </v-tab>
                <v-tab
                    :key="SQL_QUERY_MODES.FAVORITE"
                    :href="`#${SQL_QUERY_MODES.FAVORITE}`"
                    class="tab-btn px-3 text-uppercase"
                    active-class="tab-btn--active font-weight-medium"
                >
                    {{ 'favorite' }}
                </v-tab>
            </v-tabs>
        </div>
        <keep-alive>
            <template v-if="rows.length">
                <table-list
                    v-if="
                        activeView === SQL_QUERY_MODES.HISTORY ||
                            activeView === SQL_QUERY_MODES.FAVORITE
                    "
                    :key="activeView"
                    :height="dynDim.height - headerHeight"
                    :width="dynDim.width"
                    :headers="headers"
                    :rows="rows"
                    showSelect
                    showGroupBy
                    groupBy="date"
                    :activeRow="activeCtxItem"
                    @on-delete-selected="handleDeleteSelectedRows"
                    @custom-group="customGroup"
                    @on-row-right-click="openCtxMenu"
                    v-on="$listeners"
                >
                    <template v-slot:date="{ data: { cell, maxWidth } }">
                        <truncate-string
                            :text="
                                `${$helper.dateFormat({
                                    value: cell,
                                    formatType: 'ddd, DD MMM YYYY',
                                })}`
                            "
                            :maxWidth="maxWidth"
                        />
                    </template>
                </table-list>
            </template>
            <span
                v-else
                v-html="
                    activeView === SQL_QUERY_MODES.HISTORY ? 'historyTabGuide' : 'favoriteTabGuide'
                "
            />
        </keep-alive>
        <confirm-dialog
            ref="confirmDelDialog"
            :title="
                `clearSelectedQueries ${
                    activeView === SQL_QUERY_MODES.HISTORY ? 'queryHistory' : 'favoriteQueries'
                }`
            "
            type="delete"
            :onSave="deleteSelectedRows"
            minBodyWidth="624px"
        >
            <template v-slot:body-prepend>
                <p>
                    {{
                        `info.clearSelectedQueries ${
                            itemsToBeDeleted.length === rows.length ? 'entire' : 'selected'
                        } ${
                            activeView === SQL_QUERY_MODES.HISTORY
                                ? 'queryHistory'
                                : 'favoriteQueries'
                        }`
                    }}
                </p>
            </template>
        </confirm-dialog>
        <v-menu
            v-if="activeCtxItem"
            v-model="showCtxMenu"
            transition="slide-y-transition"
            left
            :position-x="ctxClientPos.x"
            :position-y="ctxClientPos.y"
            content-class="mariadb-select-v-menu mariadb-select-v-menu--full-border"
        >
            <v-list v-for="option in ctxOptions" :key="option">
                <v-list-item dense link @click="() => optHandler(option)">
                    <v-list-item-title class="color text-text" v-text="option" />
                </v-list-item>
            </v-list>
        </v-menu>
    </div>
</template>

<script>
/*
 * Copyright (c) 2020 MariaDB Corporation Ab
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file and at www.mariadb.com/bsl11.
 *
 * Change Date: 2025-08-17
 *
 * On the date above, in accordance with the Business Source License, use
 * of this software will be governed by version 2 or later of the General
 * Public License.
 */
import { mapState, mapMutations } from 'vuex'
import ResultDataTable from './ResultDataTable'
export default {
    name: 'history-and-favorite',
    components: {
        'table-list': ResultDataTable,
    },
    props: {
        dynDim: {
            type: Object,
            validator(obj) {
                return 'width' in obj && 'height' in obj
            },
            required: true,
        },
    },
    data() {
        return {
            headerHeight: 0,
            itemsToBeDeleted: [],
            // states for ctx menu
            showCtxMenu: false,
            activeCtxItem: null,
            ctxClientPos: { x: 0, y: 0 },
            ctxOptions: ['copySqlToClipboard', 'placeSqlInEditor'],
        }
    },
    computed: {
        ...mapState({
            SQL_QUERY_MODES: state => state.app_config.SQL_QUERY_MODES,
            curr_query_mode: state => state.query.curr_query_mode,
            query_history: state => state.persisted.query_history,
            query_favorite: state => state.persisted.query_favorite,
        }),
        activeView: {
            get() {
                return this.curr_query_mode
            },
            set(value) {
                if (
                    this.curr_query_mode === this.SQL_QUERY_MODES.HISTORY ||
                    this.curr_query_mode === this.SQL_QUERY_MODES.FAVORITE
                )
                    this.SET_CURR_QUERY_MODE(value)
            },
        },
        headers() {
            let data = []
            switch (this.activeView) {
                case this.SQL_QUERY_MODES.HISTORY:
                    data = this.query_history
                    break
                case this.SQL_QUERY_MODES.FAVORITE:
                    data = this.query_favorite
            }
            return Object.keys(this.$helper.typeCheck(data[0]).safeObjectOrEmpty).map(field => {
                let header = {
                    text: field,
                }
                // assign default width to each column to have better view
                switch (field) {
                    case 'date':
                        header.width = 150
                        header.hasCustomGroup = true
                        break
                    case 'connection_name':
                        header.width = 215
                        break
                    case 'time':
                        header.width = 90
                        header.groupable = false
                        break
                    case 'execution_time':
                        header.width = 150
                        header.groupable = false
                        break
                    case 'sql':
                        header.draggable = true
                }
                return header
            })
        },
        rows() {
            let data = []
            switch (this.activeView) {
                case this.SQL_QUERY_MODES.HISTORY:
                    data = this.query_history
                    break
                case this.SQL_QUERY_MODES.FAVORITE:
                    data = this.query_favorite
            }
            return data.map(item => Object.values(item))
        },
    },
    watch: {
        showCtxMenu(v) {
            if (!v) this.activeCtxItem = null
        },
    },
    activated() {
        this.setHeaderHeight()
    },
    methods: {
        ...mapMutations({
            SET_CURR_QUERY_MODE: 'query/SET_CURR_QUERY_MODE',
            SET_QUERY_HISTORY: 'persisted/SET_QUERY_HISTORY',
            SET_QUERY_FAVORITE: 'persisted/SET_QUERY_FAVORITE',
        }),
        setHeaderHeight() {
            if (!this.$refs.header) return
            this.headerHeight = this.$refs.header.clientHeight
        },
        /** Custom groups 2d array with same value at provided index to a Map
         * @param {Array} data.rows - 2d array to be grouped into a Map
         * @param {Number} data.idx - col index of the inner array
         * @param {Object} data.header - header object
         * @param {Function} callback - Callback function to pass the result
         */
        customGroup(data, callback) {
            const { rows, idx, header } = data
            switch (header.text) {
                case 'date': {
                    let map = new Map()
                    rows.forEach(row => {
                        const key = this.$helper.dateFormat({
                            value: row[idx],
                            formatType: 'ddd, DD MMM YYYY',
                        })
                        let matrix = map.get(key) || [] // assign an empty arr if not found
                        matrix.push(row)
                        map.set(key, matrix)
                    })
                    callback(map)
                }
            }
        },
        handleDeleteSelectedRows(itemsToBeDeleted) {
            this.itemsToBeDeleted = itemsToBeDeleted
            this.$refs.confirmDelDialog.open()
        },
        deleteSelectedRows() {
            const { cloneDeep, xorWith, isEqual } = this.$helper.lodash
            let targetMatrices = cloneDeep(this.itemsToBeDeleted).map(
                row => row.filter((_, i) => i !== 0) // Remove # col
            )
            const newMaxtrices = xorWith(this.rows, targetMatrices, isEqual)
            // Convert to array of objects
            const newData = this.$helper.getObjectRows({
                columns: this.headers.map(h => h.text),
                rows: newMaxtrices,
            })

            this[`SET_QUERY_${this.activeView}`](newData)
        },
        openCtxMenu({ e, row }) {
            if (this.$helper.lodash.isEqual(this.activeCtxItem, row)) {
                this.showCtxMenu = false
                this.activeCtxItem = null
            } else {
                if (!this.showCtxMenu) this.showCtxMenu = true
                this.activeCtxItem = row
                this.ctxClientPos = { x: e.clientX, y: e.clientY }
            }
        },
        optHandler(opt) {
            let data = this.$helper.getObjectRows({
                columns: this.headers.map(h => h.text),
                rows: [this.activeCtxItem.filter((_, i) => i !== 0)], // Remove # col
            })
            const sql = data[0].sql
            switch (opt) {
                case 'copySqlToClipboard': {
                    this.$helper.copyTextToClipboard(sql)
                    break
                }
                case 'placeSqlInEditor':
                    //TODO: add handler for this event on the parent component
                    this.$emit('place-sql-in-editor', sql)
                    break
            }
        },
    },
}
</script>
