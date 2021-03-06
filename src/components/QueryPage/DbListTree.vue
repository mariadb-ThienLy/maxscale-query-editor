<template>
    <!-- TODO: Virtual scroll treeview -->
    <div v-if="getDbTreeData.length">
        <m-treeview
            :items="getDbTreeData"
            :search="$parent.searchSchema"
            :filter="filter"
            hoverable
            dense
            open-on-click
            transition
            :load-children="handleLoadChildren"
            :active.sync="activeNodes"
            :open.sync="expandedNodes"
            return-object
            @item:click="onNodeClick"
            @item:contextmenu="onContextMenu"
            @item:hovered="hoveredItem = $event"
        >
            <template v-slot:label="{ item }">
                <div
                    :id="`item-label-${activatorIdTransform(item.id)}`"
                    class="d-flex align-center node-label"
                    :class="{ 'cursor--grab': item.draggable }"
                    @mousedown="item.draggable ? onNodeDragStart($event) : null"
                >
                    <v-icon class="mr-1" size="12" color="deep-ocean">
                        {{ iconSheet(item) }}
                    </v-icon>
                    <span class="text-truncate d-inline-block">
                        {{ item.name }}
                    </span>
                </div>
            </template>
            <template v-slot:append="{ isHover, item }">
                <v-btn
                    v-show="nodesHasCtxMenu.includes(item.type) && (isHover || showCtxBtn(item))"
                    :id="activatorIdTransform(item.id)"
                    icon
                    x-small
                    @click="e => handleOpenCtxMenu({ e, item })"
                >
                    <v-icon size="12" color="deep-ocean">more_horiz</v-icon>
                </v-btn>
            </template>
        </m-treeview>
        <v-tooltip
            v-if="hoveredItem && nodesHasCtxMenu.includes(hoveredItem.type)"
            :value="Boolean(hoveredItem)"
            :disabled="isDragging"
            right
            :nudge-right="45"
            transition="slide-x-transition"
            content-class="shadow-drop"
            :activator="`#item-label-${activatorIdTransform(hoveredItem.id)}`"
        >
            <table class="node-tooltip color text-text py-2 px-4">
                <tbody>
                    <tr v-for="(value, key) in hoveredItem.data" :key="key">
                        <td class="font-weight-bold pr-2">{{ key }}:</td>
                        <td>{{ value }}</td>
                    </tr>
                </tbody>
            </table>
        </v-tooltip>
        <v-menu
            v-if="activeCtxItem"
            :key="activeCtxItem.id"
            v-model="showCtxMenu"
            transition="slide-y-transition"
            left
            nudge-right="12"
            nudge-bottom="28"
            content-class="mariadb-select-v-menu mariadb-select-v-menu--full-border"
            :activator="`#${activatorIdTransform(activeCtxItem.id)}`"
        >
            <v-list v-for="option in getOptions(activeCtxItem.type)" :key="option">
                <v-list-item
                    dense
                    link
                    @click="() => optionHandler({ item: activeCtxItem, option })"
                >
                    <v-list-item-title class="color text-text" v-text="option" />
                </v-list-item>
            </v-list>
        </v-menu>
    </div>
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
import { mapGetters, mapMutations, mapState } from 'vuex'
import customDragEvt from '@/mixins/customDragEvt'
export default {
    name: 'db-list-tree',
    mixins: [customDragEvt],
    data() {
        return {
            /**
             *  TODO: Refactor and dry ctx menu. A menu option named `Insert to editor`
             *  has sub-menu `insertSchemaToEditor` and `insertNameToEditor`
             */
            tableOptions: ['previewData', 'viewDetails', 'placeSchemaInEditor'],
            schemaOptions: ['useDb', 'placeSchemaInEditor'],
            columnOptions: ['placeColumnNameInEditor'],
            spOptions: ['placeSchemaInEditor'],
            triggerOptions: ['placeSchemaInEditor'],
            showCtxMenu: false,
            activeCtxItem: null, // active item to show in context(options) menu
            hoveredItem: null,
            nodesHasCtxMenu: ['Schema', 'Table', 'Stored Procedure', 'Column', 'Trigger'],
            expandedNodes: [],
        }
    },
    computed: {
        ...mapState({
            expanded_nodes: state => state.query.expanded_nodes,
            active_wke_id: state => state.query.active_wke_id,
        }),
        ...mapGetters({
            getDbTreeData: 'query/getDbTreeData',
            getActiveTreeNode: 'query/getActiveTreeNode',
        }),
        filter() {
            return (item, search, textKey) => item[textKey].indexOf(search) > -1
        },
        showCtxBtn() {
            return item => this.activeCtxItem && item.id === this.activeCtxItem.id
        },
        activeNodes: {
            get() {
                return [this.getActiveTreeNode]
            },
            set(v) {
                const activeNodes = this.minimizeNodes(v)
                if (activeNodes.length) {
                    this.UPDATE_DB_TREE_MAP({
                        id: this.active_wke_id,
                        payload: {
                            active_tree_node: activeNodes[0],
                        },
                    })
                }
            },
        },
    },
    watch: {
        showCtxMenu(v) {
            if (!v) this.activeCtxItem = null
        },
    },
    activated() {
        this.expandedNodes = this.expanded_nodes
        this.addExpandedNodesWatcher()
    },
    deactivated() {
        this.rmExpandedNodesWatcher()
    },
    methods: {
        ...mapMutations({
            UPDATE_DB_TREE_MAP: 'query/UPDATE_DB_TREE_MAP',
            SET_EXPANDED_NODES: 'query/SET_EXPANDED_NODES',
        }),
        addExpandedNodesWatcher() {
            this.rmExpandedNodesWatcher = this.$watch(
                'expandedNodes',
                (v, oV) => {
                    const oldNodeIds = oV.map(node => node.id)
                    const newNodeIds = v.map(node => node.id)
                    if (!this.$helper.lodash.isEqual(newNodeIds, oldNodeIds)) {
                        let nodes = this.minimizeNodes(v)
                        //   The order is important which is used to reload the schema and update the tree
                        //   Sort expandedNodes by level property
                        nodes.sort((a, b) => a.level - b.level)
                        // Auto collapse all expanded nodes if schema node is collapsed
                        let validLevels = nodes.map(node => node.level)
                        if (validLevels[0] === 0) this.SET_EXPANDED_NODES(nodes)
                        else this.SET_EXPANDED_NODES([])
                    }
                },
                { deep: true }
            )
        },
        /**
         * @param {Array} nodes - array of nodes
         * @returns {Array} minimized nodes where each node is an object with id and type props
         */
        minimizeNodes(nodes) {
            return nodes.map(node => ({ id: node.id, type: node.type, level: node.level }))
        },
        /** This replaces dots with __ as vuetify activator slots
         * can't not parse html id contains dots.
         * @param {String} id - html id attribute
         * @returns {String} valid id that works with vuetify activator props
         */
        activatorIdTransform(id) {
            return id.replace(/\./g, '__')
        },
        async handleLoadChildren(item) {
            await this.emitPromise('load-children', item)
        },
        async emitPromise(method, ...params) {
            const listener = this.$listeners[method]
            if (listener) {
                const res = await listener(...params)
                return res === undefined || res
            }
            return false
        },
        handleOpenCtxMenu({ e, item }) {
            e.stopPropagation()
            if (this.activeCtxItem === item) {
                this.showCtxMenu = false
                this.activeCtxItem = null
            } else {
                if (!this.showCtxMenu) this.showCtxMenu = true
                this.activeCtxItem = item
            }
        },
        updateActiveNode(item) {
            this.activeNodes = [item]
        },
        optionHandler({ item, option }) {
            const schema = item.id
            switch (option) {
                case 'previewData':
                    this.$emit('preview-data', schema)
                    this.updateActiveNode(item)
                    break
                case 'viewDetails':
                    this.$emit('view-details', schema)
                    this.updateActiveNode(item)
                    break
                case 'placeSchemaInEditor':
                    this.$emit('place-to-editor', this.$helper.escapeIdentifiers(schema))
                    break
                case 'placeColumnNameInEditor':
                    this.$emit('place-to-editor', this.$helper.escapeIdentifiers(item.name))
                    break
                case 'useDb':
                    this.$emit('use-db', schema)
                    break
            }
        },
        iconSheet(item) {
            switch (item.type) {
                case 'Schema':
                    return '$vuetify.icons.database'
                //TODO: a separate icon for Tables
                case 'Tables':
                    return '$vuetify.icons.table'
                case 'Stored Procedures':
                    return '$vuetify.icons.storedProcedures'
                //TODO: an icon for Column
            }
        },
        getOptions(type) {
            switch (type) {
                case 'Schema':
                    return this.schemaOptions
                case 'Table':
                    return this.tableOptions
                case 'Stored Procedure':
                    return this.spOptions
                case 'Column':
                    return this.columnOptions
                case 'Trigger':
                    return this.triggerOptions
            }
        },
        onNodeClick(item) {
            if (item.canBeHighlighted) this.$emit('preview-data', this.activeNodes[0].id)
        },
        onContextMenu({ e, item }) {
            if (this.nodesHasCtxMenu.includes(item.type)) this.handleOpenCtxMenu({ e, item })
        },
        onNodeDragStart(e) {
            e.preventDefault()
            // Assign value to data in customDragEvt mixin
            this.isDragging = true
            this.dragTarget = e.target
        },
    },
}
</script>
<style lang="scss" scoped>
::v-deep .v-treeview-node__toggle {
    width: 16px;
    height: 16px;
}
::v-deep .v-treeview-node__level {
    width: 16px;
}
.node-label {
    height: 40px;
}
.node-tooltip {
    font-size: 0.75rem;
}
</style>
