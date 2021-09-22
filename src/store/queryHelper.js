import { immutableUpdate } from '@/utils/helpers'

// private functions
/**
 * @private
 * @param {String} payload.dbName - Database name to be found
 * @param {Array} payload.db_tree - Array of tree node
 * @returns {Number} index of target db
 */
const getDbIdx = ({ dbName, db_tree }) => db_tree.findIndex(db => db.name === dbName)

/**
 * @private
 * @param {String} payload.dbIdx - database index having the child
 * @param {Array} payload.db_tree - Array of tree node
 *  @param {Array} payload.childType - Children type of the database node. i.e. Tables||Stored Procedures
 * @returns {Number} index of Tables or Stored Procedures
 */
const getIdxOfDbChildNode = ({ dbIdx, db_tree, childType }) =>
    db_tree[dbIdx].children.findIndex(dbChildrenNode => dbChildrenNode.type === childType)

// Public functions
/**
 * @param {String} prefixName - prefix name of the connection cookie. i.e. conn_id_body_
 * @returns {Array} an array of connection ids found from cookies
 */
function getClientConnIds(prefixName = 'conn_id_body_') {
    let value = '; ' + document.cookie
    let cookiesStr = value.split('; ')
    const connCookies = cookiesStr.filter(p => p.includes(prefixName))
    const connIds = []
    connCookies.forEach(str => {
        const parts = str.split('=')
        if (parts.length === 2) connIds.push(parts[0].replace(prefixName, ''))
    })
    return connIds
}

/**
 * Use this function to update database node children. i.e. Populating children for
 * Tables||Stored Procedures node
 * @param {Array} payload.db_tree - Array of tree node to be updated
 * @param {String} payload.dbName - Database name
 * @param {String} payload.childType - Child type of the node to be updated. i.e. Tables||Stored Procedures
 * @param {Array} payload.gch - Array of grand child nodes (Table|Store Procedure) to be added
 * @returns {Array} new array of db_tree
 */
function updateDbChild({ db_tree, dbName, childType, gch }) {
    try {
        const dbIdx = getDbIdx({ dbName, db_tree })
        // Tables or Stored Procedures node
        const childIndex = getIdxOfDbChildNode({ dbIdx, db_tree, childType })
        const new_db_tree = immutableUpdate(db_tree, {
            [dbIdx]: { children: { [childIndex]: { children: { $set: gch } } } },
        })
        return new_db_tree
    } catch (e) {
        return {}
    }
}

/**
 * Use this function to update table node children. i.e. Populating children for
 * `Columns` node or `Triggers` node
 * @param {Array} payload.db_tree - Array of tree node to be updated
 * @param {String} payload.dbName - Database name
 * @param {String} payload.tblName - Table name
 * @param {String} payload.childType Child type of the node to be updated. i.e. Columns or Triggers node
 * @param {Array} payload.gch -  Array of grand child nodes (column or trigger)
 * @returns {Array} new array of db_tree
 */
function updateTblChild({ db_tree, dbName, tblName, gch, childType }) {
    try {
        const dbIdx = getDbIdx({ dbName, db_tree })
        // idx of Tables node
        const idxOfTablesNode = getIdxOfDbChildNode({ dbIdx, db_tree, childType: 'Tables' })
        const tblIdx = db_tree[dbIdx].children[idxOfTablesNode].children.findIndex(
            tbl => tbl.name === tblName
        )

        const dbChildNodes = db_tree[dbIdx].children // Tables and Stored Procedures nodes
        const tblNode = dbChildNodes[idxOfTablesNode].children[tblIdx] // a table node
        // Columns and Triggers node
        const idxOfChild = tblNode.children.findIndex(node => node.type === childType)

        const new_db_tree = immutableUpdate(db_tree, {
            [dbIdx]: {
                children: {
                    [idxOfTablesNode]: {
                        children: {
                            [tblIdx]: {
                                children: {
                                    [idxOfChild]: { children: { $set: gch } },
                                },
                            },
                        },
                    },
                },
            },
        })
        return new_db_tree
    } catch (e) {
        return {}
    }
}

export default {
    getClientConnIds,
    updateDbChild,
    updateTblChild,
}
