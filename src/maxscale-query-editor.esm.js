// Import vue component
import component from '@/maxscale-query-editor.vue'
// Default export is installable instance of component.
export default /*#__PURE__*/ (() => {
    // Get component instance
    const installable = component

    // Attach install function executed by Vue.use()
    installable.install = Vue => {
        Vue.component('MaxscaleQueryEditor', installable)
    }
    return installable
})()

// It's possible to expose named exports when writing components that can
// also be used as directives, etc. - eg. import { RollupDemoDirective } from 'rollup-demo';
// export const RollupDemoDirective = directive;
