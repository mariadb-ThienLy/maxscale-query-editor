import Vue from 'vue'
import { t } from 'typy'

Object.defineProperties(Vue.prototype, {
    $typeCheck: {
        get() {
            return t
        },
    },
})
