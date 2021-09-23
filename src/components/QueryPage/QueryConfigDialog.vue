<template>
    <base-dialog
        ref="connDialog"
        v-model="isOpened"
        :onSave="onSave"
        :title="`Query configuration`"
        :lazyValidation="false"
        minBodyWidth="512px"
        :hasChanged="hasChanged"
    >
        <template v-slot:form-body>
            <v-container class="pa-1">
                <v-row class="my-0 mx-n1">
                    <v-col cols="12" class="pa-1">
                        <label class="field__label color text-small-text label-required">
                            {{ 'maxRows' }}
                        </label>
                        <v-text-field
                            v-model.number="config.maxRows"
                            type="number"
                            :rules="rules.maxRows"
                            class="std error--text__bottom mb-2"
                            dense
                            :height="36"
                            hide-details="auto"
                            outlined
                            required
                            @keypress="$helper.preventNonNumericalVal($event)"
                        />
                        <v-icon size="16" color="warning" class="mr-2">
                            $vuetify.icons.alertWarning
                        </v-icon>
                        <small v-html="'info.maxRows'" />
                    </v-col>
                    <v-col cols="12" class="pa-1">
                        <label class="field__label color text-small-text label-required">
                            {{ 'queryHistoryRetentionPeriod' }} ({{ 'inDays' }})
                        </label>
                        <v-text-field
                            v-model.number="config.queryHistoryRetentionPeriod"
                            type="number"
                            :rules="rules.queryHistoryRetentionPeriod"
                            class="std error--text__bottom mb-2"
                            dense
                            :height="36"
                            hide-details="auto"
                            outlined
                            required
                            @keypress="$helper.preventNonNumericalVal($event)"
                        />
                    </v-col>

                    <v-col cols="12" class="pa-1 mt-3">
                        <v-switch
                            v-model="config.showQueryConfirm"
                            :label="
                                `info.queryShowConfirm ${config.showQueryConfirm ? 'show' : 'hide'}`
                            "
                            hide-details="auto"
                            class="show-confirm-switch mt-0 pa-0"
                        />
                    </v-col>
                </v-row>
            </v-container>
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
import { mapMutations, mapState } from 'vuex'

export default {
    name: 'query-config-dialog',
    props: {
        value: { type: Boolean, required: true },
    },
    data() {
        return {
            rules: {
                maxRows: [v => this.validatePositiveNumber({ v, inputName: 'maxRows' })],
                queryHistoryRetentionPeriod: [
                    v =>
                        this.validatePositiveNumber({
                            v,
                            inputName: 'queryHistoryRetentionPeriod',
                        }),
                ],
            },
            defConfig: {},
            config: {
                maxRows: 10000,
                showQueryConfirm: true,
                queryHistoryRetentionPeriod: 0,
            },
        }
    },
    computed: {
        ...mapState({
            query_max_rows: state => state.persisted.query_max_rows,
            query_confirm_flag: state => state.persisted.query_confirm_flag,
            query_history_expired_time: state => state.persisted.query_history_expired_time,
        }),
        isOpened: {
            get() {
                if (this.value) this.$emit('on-open')
                return this.value
            },
            set(value) {
                this.$emit('input', value)
            },
        },
        hasChanged() {
            if (!this.isOpened) return false
            return !this.$helper.lodash.isEqual(this.defConfig, this.config)
        },
    },
    watch: {
        isOpened(v) {
            if (v) {
                this.handleSetDefConfig()
                this.config = this.$helper.lodash.cloneDeep(this.defConfig)
            }
        },
    },
    methods: {
        ...mapMutations({
            SET_QUERY_MAX_ROW: 'persisted/SET_QUERY_MAX_ROW',
            SET_QUERY_CONFIRM_FLAG: 'persisted/SET_QUERY_CONFIRM_FLAG',
            SET_QUERY_HISTORY_EXPIRED_TIME: 'persisted/SET_QUERY_HISTORY_EXPIRED_TIME',
        }),
        validatePositiveNumber({ v, inputName }) {
            if (this.$helper.typeCheck(v).isEmptyString) return `errors.requiredInput ${inputName}`
            if (v <= 0) return 'errors.largerThanZero'
            if (v > 0) return true
        },
        handleSetDefConfig() {
            this.defConfig = {
                maxRows: this.query_max_rows,
                showQueryConfirm: Boolean(this.query_confirm_flag),
                queryHistoryRetentionPeriod: this.$helper.daysDiff(this.query_history_expired_time),
            }
        },
        onSave() {
            this.SET_QUERY_MAX_ROW(this.config.maxRows)
            this.SET_QUERY_CONFIRM_FLAG(Number(this.config.showQueryConfirm))
            this.SET_QUERY_HISTORY_EXPIRED_TIME(
                this.$helper.addDaysToNow(this.config.queryHistoryRetentionPeriod)
            )
        },
    },
}
</script>

<style lang="scss" scoped>
$label-size: 0.75rem;
.field__label {
    font-size: $label-size;
}
::v-deep .show-confirm-switch {
    label {
        font-size: $label-size;
        color: $small-text;
    }
}
</style>
