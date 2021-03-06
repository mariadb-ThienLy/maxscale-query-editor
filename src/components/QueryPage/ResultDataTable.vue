<template>
    <div>
        <div ref="tableTools" class="table-tools pb-2 d-inline-flex align-center">
            <v-text-field
                v-model="filterKeyword"
                name="filter"
                dense
                outlined
                height="28"
                class="std filter-result mr-2"
                :placeholder="'filterResult'"
                hide-details
            />
            <column-list
                v-model="filterHeaderIdxs"
                :label="'filterBy'"
                :cols="tableHeaders"
                :maxHeight="tableHeight - 20"
            />
            <v-spacer />

            <v-tooltip
                v-if="selectedItems.length"
                top
                transition="slide-y-transition"
                content-class="shadow-drop color text-navigation py-1 px-4"
            >
                <template v-slot:activator="{ on }">
                    <v-btn
                        x-small
                        class="mr-2 pa-1 text-capitalize"
                        outlined
                        depressed
                        color="error"
                        v-on="on"
                        @click="$emit('on-delete-selected', selectedItems)"
                    >
                        {{ 'delete' }}
                    </v-btn>
                </template>
                <span>{{ 'deleteSelectedRows' }}</span>
            </v-tooltip>
            <result-export :rows="filteredRows_wo_idx" :headers="visHeaders_wo_idx" />
            <column-list
                v-model="visHeaderIdxs"
                :label="'columns'"
                :cols="tableHeaders"
                :maxHeight="tableHeight - 20"
            />
            <v-tooltip
                top
                transition="slide-y-transition"
                content-class="shadow-drop color text-navigation py-1 px-4"
            >
                <template v-slot:activator="{ on }">
                    <v-btn
                        x-small
                        class="ml-2 pa-1"
                        outlined
                        depressed
                        color="accent-dark"
                        :disabled="isGrouping"
                        v-on="on"
                        @click="isVertTable = !isVertTable"
                    >
                        <v-icon
                            size="14"
                            color="accent-dark"
                            :class="{ 'rotate-icon__vert': !isVertTable }"
                        >
                            rotate_90_degrees_ccw
                        </v-icon>
                    </v-btn>
                </template>
                <span>{{ isVertTable ? 'switchToHorizTable' : 'switchToVertTable' }}</span>
            </v-tooltip>
        </div>
        <!-- Keep it in memory, negative height crashes v-virtual-scroll -->
        <keep-alive>
            <virtual-scroll-table
                v-if="tableHeight > 0"
                :benched="0"
                :headers="visibleHeaders"
                :rows="filteredRows"
                :itemHeight="30"
                :height="tableHeight"
                :boundingWidth="width"
                :isVertTable="isVertTable"
                :showSelect="showSelect"
                :groupBy="groupBy"
                :activeRow="activeRow"
                @item-selected="selectedItems = $event"
                @is-grouping="isGrouping = $event"
                v-on="$listeners"
            >
                <template
                    v-for="h in visibleHeaders"
                    v-slot:[h.text]="{ data: { cell, header, maxWidth } }"
                >
                    <slot :name="`${h.text}`" :data="{ cell, header, maxWidth }" />
                </template>
            </virtual-scroll-table>
        </keep-alive>
    </div>
</template>

<script>
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
import ResultExport from './ResultExport'
import ColumnList from './ColumnList.vue'
export default {
    name: 'result-data-table',
    components: {
        'result-export': ResultExport,
        'column-list': ColumnList,
    },
    props: {
        headers: {
            type: Array,
            validator: arr => {
                if (!arr.length) return true
                else return arr.filter(item => 'text' in item).length === arr.length
            },
            required: true,
        },
        rows: { type: Array, required: true },
        height: { type: Number, required: true },
        width: { type: Number, required: true },
        showSelect: { type: Boolean, default: false },
        groupBy: { type: String, default: '' },
        showGroupBy: { type: Boolean, default: false },
        activeRow: { type: Array, default: () => [] },
    },
    data() {
        return {
            filterHeaderIdxs: [],
            visHeaderIdxs: [],
            filterKeyword: '',
            tableToolsHeight: 0,
            isVertTable: false,
            isGrouping: false,
            selectedItems: [],
        }
    },
    computed: {
        tableHeight() {
            let res = this.height - this.tableToolsHeight
            return res
        },
        tableHeaders() {
            let headers = []
            if (this.headers.length)
                headers = [
                    { text: '#', maxWidth: 'max-content' },
                    ...this.headers.map(h =>
                        this.showGroupBy && !this.$helper.typeCheck(h, 'groupable').isDefined
                            ? { ...h, groupable: true }
                            : h
                    ),
                ]

            return headers
        },
        rowsWithIndex() {
            return this.rows.map((row, i) => [i + 1, ...row])
        },
        filteredRows_wo_idx() {
            return this.filteredRows.map(row => row.filter((cell, i) => i !== 0))
        },
        visHeaders_wo_idx() {
            return this.visibleHeaders.filter(header => header.text !== '#')
        },
        filteredRows() {
            return this.rowsWithIndex.filter(row => {
                let match = false
                for (const [i, cell] of row.entries()) {
                    if (
                        (this.filterHeaderIdxs.includes(i) || !this.filterHeaderIdxs.length) &&
                        this.$helper.ciStrIncludes(`${cell}`, this.filterKeyword)
                    ) {
                        match = true
                        break
                    }
                }
                return match
            })
        },
        visibleHeaders() {
            return this.tableHeaders.map((h, i) =>
                this.visHeaderIdxs.includes(i) ? h : { ...h, hidden: true }
            )
        },
    },
    activated() {
        this.setTableToolsHeight()
    },
    methods: {
        setTableToolsHeight() {
            if (!this.$refs.tableTools) return
            this.tableToolsHeight = this.$refs.tableTools.clientHeight
        },
    },
}
</script>

<style lang="scss" scoped>
.std.filter-result {
    max-width: 250px;
}
.table-tools {
    width: 100%;
}
.rotate-icon__vert {
    transform: rotate(90deg);
}
</style>
