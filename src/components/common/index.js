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

import SelectDropdown from './SelectDropdown'
import Dialogs from './Dialogs'
import IconSpriteSheet from './IconSpriteSheet'
import Charts from './Charts'
import SplitPane from './SplitPane'
import MTreeVIew from './MTreeView'
import VirtualScrollTable from './VirtualScrollTable'
import TruncateString from './TruncateString'

export default {
    ...Dialogs,
    'select-dropdown': SelectDropdown,
    'icon-sprite-sheet': IconSpriteSheet,
    ...Charts,
    'split-pane': SplitPane,
    'm-treeview': MTreeVIew,
    'virtual-scroll-table': VirtualScrollTable,
    'truncate-string': TruncateString,
}
