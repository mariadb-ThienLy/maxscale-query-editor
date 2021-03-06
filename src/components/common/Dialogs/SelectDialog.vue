<template>
    <base-dialog
        v-model="isDialogOpen"
        :onCancel="onCancelHandler"
        :onSave="onSaveHandler"
        :onClose="onCloseHandler"
        :title="title"
        :saveText="mode"
        :hasChanged="hasChanged"
    >
        <template v-slot:form-body>
            <p class="select-label">
                {{ `specify ${multiple ? 2 : 1}` }}

                {{ entityName }} {{ multiple ? 2 : 1 }}
            </p>

            <select-dropdown
                ref="selectDropdown"
                v-model="selectedItems"
                :defaultItems="defaultItems"
                :items="itemsList"
                :entityName="entityName"
                :multiple="multiple"
                :clearable="clearable"
                :showPlaceHolder="false"
                @has-changed="hasChanged = $event"
            />
            <slot name="body-append"></slot>
        </template>
    </base-dialog>
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
This component emits two events
@selected-items: value: Array
@on-open: event triggered after dialog is opened
*/
export default {
    name: 'select-dialog',
    props: {
        mode: { type: String, required: true }, // change or add
        title: { type: String, required: true },
        entityName: { type: String, required: true },
        clearable: { type: Boolean, default: false },
        onSave: { type: Function, required: true },
        onClose: { type: Function },
        onCancel: { type: Function },
        multiple: { type: Boolean, default: false },
        itemsList: { type: Array, required: true },
        defaultItems: { type: [Array, Object], default: () => [] },
    },
    data() {
        return {
            isDialogOpen: false,
            selectedItems: [],
            hasChanged: false,
        }
    },
    watch: {
        isDialogOpen: function(val) {
            if (val) {
                this.$emit('on-open')
                // set default hasChanged data
                this.hasChanged = this.$refs.selectDropdown.hasChanged
            } else this.selectedItems = []
        },
        selectedItems: {
            deep: true,
            handler(v) {
                if (this.$helper.typeCheck(v).isNull) this.$emit('selected-items', [])
                else if (this.$helper.typeCheck(v).isArray) this.$emit('selected-items', v)
                else this.$emit('selected-items', [v])
            },
        },
    },

    methods: {
        closeDialog() {
            this.isDialogOpen = false
        },
        open() {
            this.isDialogOpen = true
        },
        onCancelHandler() {
            if (this.onCancel) this.onCancel()
            this.closeDialog()
        },
        onCloseHandler() {
            if (this.onClose) this.onClose()
            this.closeDialog()
        },

        async onSaveHandler() {
            await this.onSave()
            this.closeDialog()
        },
    },
}
</script>
