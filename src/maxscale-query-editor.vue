<template>
    <v-row>
        <div class="query-page">
            <div class="query-page--fullscreen">
                query_max_rows {{ query_max_rows }}
                <v-btn color="primary" @click="SET_QUERY_MAX_ROW(5000)"
                    >set query_max_rows to 5000</v-btn
                >
                <v-btn @click="SET_QUERY_MAX_ROW(9000)">set query_max_rows to 9000</v-btn>
                {{ $helper.dateFormat({ value: new Date(), formatType: 'DATE_RFC2822' }) }}
            </div>
        </div>
    </v-row>
</template>
<script>
/* import Vue from 'vue' */
import '@/plugins/logger'
import '@/utils/helpers'
import '@/plugins/moment'
import '@/plugins/vuex'
import '@/plugins/typy'
import '@/plugins/axios'
import '@/plugins/shortkey'
import store from '@/store'
/* import commonComponents from '@/components/common' */
import { mapState, mapMutations } from 'vuex'
/* import '@/styles/main.scss' */
/* Object.keys(commonComponents).forEach(name => {
    Vue.component(name, commonComponents[name])
}) */
export default /*#__PURE__*/ {
    store,
    name: 'maxscale-query-editor', // vue component name
    data() {
        return {
            counter: 5,
            initCounter: 5,
            message: {
                action: null,
                amount: null,
            },
        }
    },
    computed: {
        ...mapState({
            query_max_rows: state => state.persisted.query_max_rows,
        }),
    },
    methods: {
        ...mapMutations({
            SET_QUERY_MAX_ROW: 'persisted/SET_QUERY_MAX_ROW',
        }),
    },
}
</script>
<style lang="scss" scoped>
$header-height: 50px;
.query-page {
    background: #ffffff;
    &--fullscreen {
        padding: 0px !important;
        width: 100%;
        height: calc(100% - #{$header-height});
        margin-left: -90px;
        margin-top: -24px;
        z-index: 7;
        position: fixed;
        overflow: hidden;
    }
}
</style>
