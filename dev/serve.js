import Vue from 'vue'
import Dev from './serve.vue'
import vuetify from '@/plugins/vuetify'
//TODO: vue-sfc-rollup has not configured to use i18n
import i18n from '@/plugins/i18n'
import '@/styles/main.scss'
Vue.config.productionTip = false

new Vue({
    i18n,
    vuetify,
    render: h => h(Dev),
}).$mount('#app')
