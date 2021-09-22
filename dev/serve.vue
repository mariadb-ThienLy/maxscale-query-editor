<script>
import Vue from 'vue'
import MaxscaleQueryEditor from '@/maxscale-query-editor.vue'
export default Vue.extend({
    name: 'server-dev',
    components: {
        MaxscaleQueryEditor,
    },
})
</script>

<template>
    <div id="app">
        <v-app>
            <v-main>
                <maxscale-query-editor />
            </v-main>
        </v-app>
    </div>
</template>
