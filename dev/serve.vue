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
                <v-container fluid>
                    <maxscale-query-editor />
                </v-container>
            </v-main>
        </v-app>
    </div>
</template>
