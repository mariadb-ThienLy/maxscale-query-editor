<template>
    <div class="tr-vertical-group d-flex flex-column">
        <template v-for="(h, i) in tableHeaders">
            <div
                v-if="!h.hidden"
                :key="`${h.text}_${i}`"
                class="tr align-center"
                :style="{ height: lineHeight }"
            >
                <div
                    :key="`${h.text}_${headerWidthMap[0]}_0`"
                    class="td fill-height d-flex align-center border-bottom-none px-3"
                    :style="{
                        minWidth: $helper.handleAddPxUnit(headerWidthMap[0]),
                    }"
                >
                    <truncate-string
                        :text="`${h.text}`.toUpperCase()"
                        :maxWidth="$helper.typeCheck(headerWidthMap[0]).safeNumber - 24"
                    />
                </div>
                <div
                    :key="`${h.text}_${headerWidthMap[1]}_1`"
                    class="td fill-height d-flex align-center no-border px-3"
                    :style="{
                        minWidth: $helper.handleAddPxUnit(headerWidthMap[1]),
                    }"
                >
                    <slot
                        :name="h.text"
                        :data="{
                            cell: row[i],
                            header: h,
                            maxWidth: cellMaxWidth(1),
                        }"
                    >
                        <truncate-string :text="`${row[i]}`" :maxWidth="cellMaxWidth(1)" />
                    </slot>
                </div>
            </div>
        </template>
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
export default {
    name: 'vertical-row',
    props: {
        row: { type: [Array, Object], required: true },
        tableHeaders: {
            type: Array,
            validator: arr => {
                if (!arr.length) return true
                else return arr.filter(item => 'text' in item).length === arr.length
            },
            required: true,
        },
        lineHeight: { type: String, required: true },
        headerWidthMap: { type: Object, required: true },
        cellMaxWidth: { type: Function, required: true },
    },
}
</script>
<style lang="scss" scoped>
.tr-vertical-group {
    .tr {
        &:last-of-type {
            border-bottom: thin solid $table-border;
        }
    }
}
</style>
