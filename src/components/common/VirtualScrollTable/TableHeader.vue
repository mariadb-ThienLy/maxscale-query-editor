<template>
    <div class="virtual-table__header">
        <div class="thead d-inline-block" :style="{ width: headerWidth }">
            <div class="tr" :style="{ lineHeight: $parent.lineHeight }">
                <div
                    v-if="!areHeadersHidden && showSelect && !isVertTable"
                    class="th d-flex align-center"
                    :style="{
                        ...headerStyle,
                        height: $parent.lineHeight,
                        maxWidth: activeGroupBy ? '90px' : '50px',
                        minWidth: activeGroupBy ? '90px' : '50px',
                        paddingLeft: activeGroupBy ? '29px' : '12px',
                        paddingRight: '12px',
                    }"
                >
                    <v-checkbox
                        :disabled="!rowsLength"
                        :input-value="isAllselected"
                        :indeterminate="indeterminate"
                        dense
                        class="checkbox--scale-reduce ma-0"
                        primary
                        hide-details
                        @change="val => $emit('toggle-select-all', val)"
                    />
                    <div class="header__resizer no-pointerEvent d-inline-block fill-height"></div>
                </div>
                <template v-for="(header, i) in tableHeaders">
                    <div
                        v-if="!header.hidden"
                        :key="`${header.text}_${i}`"
                        :ref="`header__${i}`"
                        :style="{
                            ...headerStyle,
                            height: $parent.lineHeight,
                            maxWidth: header.width
                                ? $helper.handleAddPxUnit(header.width)
                                : $helper.handleAddPxUnit(headerWidthMap[i]),
                            minWidth: $helper.handleAddPxUnit(headerWidthMap[i]),
                        }"
                        class="th d-flex align-center px-3"
                        :class="{
                            pointer: enableSorting,
                            [`sort--active ${sortOrder}`]: activeSort === header.text,
                        }"
                        @click="() => (enableSorting ? handleSort(header.text) : null)"
                    >
                        <span v-if="header.text === '#'">
                            {{ header.text }}
                        </span>
                        <!-- maxWidth: minus padding and sort-icon -->
                        <truncate-string
                            v-else
                            :text="`${header.text}`.toUpperCase()"
                            :maxWidth="$helper.typeCheck(headerWidthMap[i]).safeNumber - 46"
                        />
                        <span v-if="header.text === '#'" class="ml-1 color text-field-text">
                            ({{ rowsLength }})
                        </span>
                        <v-icon v-if="enableSorting" size="14" class="sort-icon ml-2">
                            $vuetify.icons.arrowDown
                        </v-icon>
                        <span
                            v-if="
                                enableGrouping && $helper.typeCheck(header, 'groupable').safeBoolean
                            "
                            class="ml-2 text-none"
                            :class="[
                                activeGroupBy === header.text && !isVertTable
                                    ? 'group--active'
                                    : 'group--inactive',
                            ]"
                            @click.stop="() => handleToggleGroup(header.text)"
                        >
                            {{ 'group' }}
                        </span>
                        <div
                            v-if="i !== tableHeaders.length - 1"
                            class="header__resizer d-inline-block fill-height"
                            @mousedown="e => resizerMouseDown(e, i)"
                        />
                    </div>
                </template>
            </div>
        </div>
        <div
            :style="{ minWidth: `${$helper.getScrollbarWidth()}px` }"
            class="d-inline-block dummy-header"
        />
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
/*
 *
 headers: {
  width?: string | number, default width when header is rendered
  maxWidth?: string | number,
  groupable?: boolean
  hasCustomGroup?: boolean, if true, virtual-scroll-table emits custom-group event
  hidden?: boolean, hidden the column
  draggable?: boolean, emits on-cell-dragging and on-cell-dragend events when dragging the content of the cell
}
 */
export default {
    name: 'table-header',
    props: {
        headers: { type: Array, required: true },
        boundingWidth: { type: Number, required: true },
        headerStyle: { type: Object, required: true },
        isVertTable: { type: Boolean, default: false },
        rowsLength: { type: Number, required: true },
        showSelect: { type: Boolean, required: true },
        isAllselected: { type: Boolean, required: true },
        indeterminate: { type: Boolean, required: true },
        areHeadersHidden: { type: Boolean, required: true },
    },
    data() {
        return {
            headerWidthMap: {},
            isResizing: false,
            currCol: null,
            nxtCol: null,
            currPageX: 0,
            nxtColWidth: 0,
            currColWidth: 0,
            currColIndex: 0,
            sortOrder: 'asc',
            activeSort: '',
            activeGroupBy: '',
        }
    },
    computed: {
        headerWidth() {
            return `calc(100% - ${this.$helper.getScrollbarWidth()}px)`
        },
        tableHeaders() {
            return this.isVertTable
                ? [
                      { text: 'COLUMN', width: '20%' },
                      { text: 'VALUE', width: '80%' },
                  ]
                : this.headers
        },
        enableSorting() {
            return this.rowsLength <= 10000 && !this.isVertTable
        },
        enableGrouping() {
            return this.tableHeaders.filter(h => !h.hidden).length > 1
        },
    },
    watch: {
        tableHeaders() {
            this.recalculateWidth()
        },
        boundingWidth() {
            this.recalculateWidth()
        },
        headerWidthMap: {
            deep: true,
            handler(v) {
                this.$emit('get-header-width-map', v)
            },
        },
        isResizing(v) {
            this.$emit('is-resizing', v)
        },
    },
    created() {
        window.addEventListener('mousemove', this.resizerMouseMove)
        window.addEventListener('mouseup', this.resizerMouseUp)
    },
    destroyed() {
        window.removeEventListener('mousemove', this.resizerMouseMove)
        window.removeEventListener('mouseup', this.resizerMouseUp)
    },
    methods: {
        //threshold, user cannot resize header smaller than this
        getMinHeaderWidth(header) {
            return this.$helper.typeCheck(header, 'groupable').safeBoolean ? 117 : 67
        },
        resetHeaderWidth() {
            let headerWidthMap = {}
            for (const [i, header] of this.tableHeaders.entries()) {
                headerWidthMap = {
                    ...headerWidthMap,
                    [i]: header.maxWidth ? header.maxWidth : 'unset',
                }
            }
            this.headerWidthMap = headerWidthMap
        },
        assignHeaderWidthMap() {
            if (this.$refs[`header__${0}`]) {
                let headerWidthMap = {}
                // get width of each header then use it to set same width of corresponding cells
                for (const [i, header] of this.tableHeaders.entries()) {
                    if (this.$helper.typeCheck(this.$refs, `header__${i}`).safeArray.length) {
                        let headerWidth = this.$refs[`header__${i}`][0].clientWidth
                        const minHeaderWidth = this.getMinHeaderWidth(header)
                        if (headerWidth < minHeaderWidth) headerWidth = minHeaderWidth
                        headerWidthMap = {
                            ...headerWidthMap,
                            [i]: headerWidth,
                        }
                    }
                }
                this.headerWidthMap = headerWidthMap
            }
        },
        recalculateWidth() {
            this.resetHeaderWidth()
            this.$nextTick(() => this.$nextTick(() => this.assignHeaderWidthMap()))
        },
        resizerMouseDown(e, i) {
            this.currColIndex = i
            this.currCol = e.target.parentElement
            this.nxtCol = this.currCol.nextElementSibling
            this.currPageX = e.pageX
            this.currColWidth = this.currCol.offsetWidth
            if (this.nxtCol) this.nxtColWidth = this.nxtCol.offsetWidth
            this.isResizing = true
        },
        resizerMouseMove(e) {
            if (this.isResizing) {
                const diffX = e.pageX - this.currPageX
                if (
                    this.currColWidth + diffX >=
                    this.getMinHeaderWidth(this.headers[this.currColIndex])
                ) {
                    const newCurrColW = `${this.currColWidth + diffX}px`
                    this.currCol.style.maxWidth = newCurrColW
                    this.currCol.style.minWidth = newCurrColW
                    if (
                        this.nxtCol &&
                        this.nxtColWidth - diffX >=
                            this.getMinHeaderWidth(this.headers[this.currColIndex])
                    ) {
                        const newNxtColW = `${this.nxtColWidth - diffX}px`
                        this.nxtCol.style.maxWidth == newNxtColW
                        this.nxtCol.style.minWidth = newNxtColW
                    }
                    this.$nextTick(() => this.assignHeaderWidthMap())
                }
            }
        },
        resizerMouseUp() {
            if (this.isResizing) {
                this.isResizing = false
                this.currPageX = 0
                this.currCol = null
                this.nxtCol = null
                this.nxtColWidth = 0
                this.currColWidth = 0
                this.currColIndex = 0
            }
        },
        /**
         * @param {String} h - header name
         */
        handleSort(h) {
            if (this.activeSort === h)
                switch (this.sortOrder) {
                    case 'asc':
                        this.sortOrder = 'desc'
                        break
                    case 'desc':
                        this.sortOrder = 'asc'
                        break
                }
            else {
                this.activeSort = h
                this.sortOrder = 'asc'
            }
            this.$emit('on-sorting', {
                sortBy: this.activeSort,
                isDesc: this.sortOrder !== 'asc',
            })
        },
        /**
         * @param {String} header - header name
         */
        handleToggleGroup(headerName) {
            if (this.activeGroupBy === headerName) this.activeGroupBy = ''
            else this.activeGroupBy = headerName
            this.$emit('on-group', this.activeGroupBy)
        },
    },
}
</script>
<style lang="scss" scoped>
.virtual-table__header {
    height: 30px;
    overflow: hidden;
    background-color: $table-border;
    .tr {
        display: flex;
        flex-direction: row;
        box-shadow: -7px 5px 7px -7px rgb(0 0 0 / 10%);
        flex-wrap: nowrap;
        .th {
            display: flex;
            position: relative;
            z-index: 1;
            flex: 1;
            font-weight: bold;
            font-size: 0.75rem;
            color: $small-text;
            background-color: $table-border;
            text-transform: uppercase;
            border-bottom: none;
            user-select: none;
            &:first-child {
                border-radius: 5px 0 0 0;
            }
            &:last-child {
                border-radius: 0 5px 0 0;
            }
            .sort-icon {
                transform: none;
                visibility: hidden;
            }
            &.sort--active {
                color: $black;
            }
            &.sort--active .sort-icon {
                color: inherit;
                visibility: visible;
            }
            &.desc {
                .sort-icon {
                    transform: rotate(-180deg);
                }
            }
            &:hover {
                .sort-icon {
                    visibility: visible;
                }
            }
            .group--inactive {
                color: $small-text !important;
                opacity: 0.6;
                &:hover {
                    opacity: 1;
                }
            }
            .group--active {
                color: $black;
                opacity: 1;
            }
            .header__resizer {
                position: absolute;
                right: 0px;
                width: 11px;
                border-right: 1px solid $background;
                cursor: ew-resize;
                &--hovered,
                &:hover {
                    border-right: 3px solid $background;
                }
            }
        }
    }
    .dummy-header {
        z-index: 2;
        background-color: $table-border;
        height: 30px;
        position: absolute;
    }
}
</style>
