<template>
    <div ref="pageToolbar" class="page-toolbar d-flex align-center flex-grow-1 pr-2">
        <v-btn
            :disabled="!cnct_resources.length"
            small
            class="ml-2 float-left"
            icon
            @click="addNewWs"
        >
            <v-icon size="18" color="deep-ocean">add</v-icon>
        </v-btn>
        <v-spacer />
        <v-tooltip
            top
            transition="slide-y-transition"
            content-class="shadow-drop color text-navigation py-1 px-4"
        >
            <template v-slot:activator="{ on }">
                <v-btn
                    class="text-capitalize font-weight-medium"
                    icon
                    small
                    color="accent-dark"
                    :disabled="!query_txt"
                    v-on="on"
                    @click="openFavoriteDialog"
                >
                    <v-icon size="20">
                        bookmark
                    </v-icon>
                </v-btn>
            </template>
            <span style="white-space: pre;" class="d-inline-block text-center">
                {{
                    selected_query_txt
                        ? 'saveStatementsToFavorite selected \nCmd/Ctrl + S'
                        : 'saveStatementsToFavorite all \nCmd/Ctrl + S'
                }}
            </span>
        </v-tooltip>

        <v-tooltip
            top
            transition="slide-y-transition"
            content-class="shadow-drop color text-navigation py-1 px-4"
        >
            <template v-slot:activator="{ on }">
                <v-btn icon small v-on="on" @click="queryConfigDialog = !queryConfigDialog">
                    <v-icon size="16" color="accent-dark">
                        $vuetify.icons.settings
                    </v-icon>
                </v-btn>
            </template>
            <span class="text-capitalize"> {{ 'settings' }}</span>
        </v-tooltip>

        <v-tooltip
            top
            transition="slide-y-transition"
            content-class="shadow-drop color text-navigation py-1 px-4"
        >
            <template v-slot:activator="{ on }">
                <v-btn icon small v-on="on" @click="SET_FULLSCREEN(!is_fullscreen)">
                    <v-icon size="20" color="accent-dark">
                        fullscreen{{ is_fullscreen ? '_exit' : '' }}
                    </v-icon>
                </v-btn>
            </template>
            <span>{{ is_fullscreen ? 'minimize' : 'maximize' }}</span>
        </v-tooltip>
        <query-config-dialog v-model="queryConfigDialog" />

        <confirm-dialog
            ref="favoriteConfirmDialog"
            :title="'confirmations.addToFavorite'"
            type="add"
            :onSave="addToFavorite"
            minBodyWidth="768px"
        >
            <template v-slot:body-prepend>
                <div class="mb-4 readonly-sql-code-wrapper pa-2">
                    <readonly-query-editor
                        :value="selected_query_txt ? selected_query_txt : query_txt"
                        class="readonly-editor fill-height"
                        readOnly
                        :options="{
                            fontSize: 10,
                            contextmenu: false,
                        }"
                    />
                </div>
                <label class="field__label color text-small-text label-required">
                    {{ 'name' }}
                </label>
                <v-text-field
                    v-model="favorite.name"
                    type="text"
                    :rules="[val => !!val || 'errors.requiredInput name']"
                    class="std error--text__bottom mb-2"
                    dense
                    :height="36"
                    hide-details="auto"
                    outlined
                    required
                />
            </template>
        </confirm-dialog>
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

import { mapActions, mapMutations, mapState } from 'vuex'
import QueryConfigDialog from './QueryConfigDialog'
import QueryEditor from '@/components/QueryEditor'
export default {
    name: 'page-toolbar',
    components: {
        'query-config-dialog': QueryConfigDialog,
        'readonly-query-editor': QueryEditor,
    },
    data() {
        return {
            queryConfigDialog: false,
            favorite: {
                date: '',
                name: '',
            },
        }
    },
    computed: {
        ...mapState({
            is_fullscreen: state => state.query.is_fullscreen,
            cnct_resources: state => state.query.cnct_resources,
            worksheets_arr: state => state.query.worksheets_arr,
            query_txt: state => state.query.query_txt,
            selected_query_txt: state => state.query.selected_query_txt,
        }),
    },
    methods: {
        ...mapMutations({
            SET_FULLSCREEN: 'query/SET_FULLSCREEN',
            SET_ACTIVE_WKE_ID: 'query/SET_ACTIVE_WKE_ID',
        }),
        ...mapActions({
            handleDeleteWke: 'query/handleDeleteWke',
            handleAddNewWke: 'query/handleAddNewWke',
            pushQueryFavorite: 'persisted/pushQueryFavorite',
        }),
        addNewWs() {
            this.handleAddNewWke()
            this.SET_ACTIVE_WKE_ID(this.worksheets_arr[this.worksheets_arr.length - 1].id)
        },
        openFavoriteDialog() {
            if (this.query_txt) {
                this.favorite.date = new Date().valueOf()
                this.favorite.name = `Favorite statements - ${this.$helper.dateFormat({
                    value: this.favorite.date,
                    formatType: 'DATE_RFC2822',
                })}
                           `
                this.$refs.favoriteConfirmDialog.open()
            }
        },
        addToFavorite() {
            let payload = {
                sql: this.query_txt,
                ...this.favorite,
            }
            if (this.selected_query_txt) payload.sql = this.selected_query_txt
            this.pushQueryFavorite(payload)
        },
    },
}
</script>
<style lang="scss" scoped>
.page-toolbar {
    border-right: 1px solid $table-border;
    border-top: 1px solid $table-border;
}
</style>
