/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Builders for portal page UI schemas.
 *
 * The shapes here mirror what the visual editor produces today
 * (see packages/core/client/src/modules/blocks/data-blocks/table/
 * createTableBlockUISchema.ts and modules/menu/PageMenuItem.tsx). Columns,
 * fields and actions are intentionally left to the standard `x-initializer`s
 * so they are configured in the visual editor (the "manual polish" half of the
 * hybrid approach). x-uids are derived deterministically from `key` so
 * re-seeding is idempotent.
 */

export interface PageSchema {
  'x-uid': string;
  [key: string]: unknown;
}

export interface ColumnDef {
  /** Field name on the page's collection. */
  field: string;
  /** For association fields: the label field on the target collection (e.g. 'title', 'nickname'). */
  targetLabelField?: string;
}

export interface TableBlockPage {
  schema: PageSchema;
  pageUid: string;
  /** Grid uid — the page's single tab; desktopRoutes tabs.schemaUid must point here. */
  tabUid: string;
  /** Schema property name of the grid — desktopRoutes tabs.tabSchemaName. */
  tabSchemaName: string;
  /** Table block uid — used to detect stale schema shapes on upgrade. */
  blockUid: string;
  /** Uid of the first seeded field column — used to detect column-less pages on upgrade. */
  firstColumnUid?: string;
}

/**
 * Build a Page that contains a single Table block bound to `collection`.
 *
 * The Page itself is not async; its content lives in an async Grid child that
 * the client loads through the page route's hidden `tabs` child route
 * (`tabs.schemaUid` = grid uid, `tabs.tabSchemaName` = grid property name) —
 * the same shape the visual editor produces (see PageMenuItem/getPageMenuSchema).
 */
export function buildTableBlockPage(opts: { key: string; collection: string; columns?: ColumnDef[] }): TableBlockPage {
  const { key, collection, columns = [] } = opts;
  const uid = (suffix: string) => `lms_${key}_${suffix}`;

  // Column shape mirrors the `table:configureColumns` initializer wrap
  // (see client TableColumnInitializers.tsx + useTableColumnInitializerFields).
  const columnProperties: Record<string, unknown> = {};
  columns.forEach((col, i) => {
    columnProperties[col.field] = {
      _isJSONSchemaObject: true,
      version: '2.0',
      type: 'void',
      'x-decorator': 'TableV2.Column.Decorator',
      'x-toolbar': 'TableColumnSchemaToolbar',
      'x-settings': 'fieldSettings:TableColumn',
      'x-component': 'TableV2.Column',
      'x-uid': uid(`col_${col.field}`),
      'x-async': false,
      'x-index': i + 1,
      properties: {
        [col.field]: {
          _isJSONSchemaObject: true,
          version: '2.0',
          'x-collection-field': `${collection}.${col.field}`,
          'x-component': 'CollectionField',
          'x-component-props': col.targetLabelField
            ? { ellipsis: true, fieldNames: { label: col.targetLabelField, value: 'id' } }
            : { ellipsis: true },
          'x-read-pretty': true,
          'x-decorator': null,
          'x-decorator-props': { labelStyle: { display: 'none' } },
          'x-uid': uid(`cell_${col.field}`),
          'x-async': false,
          'x-index': 1,
        },
      },
    };
  });

  const schema: PageSchema = {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-uid': uid('page'),
    'x-index': 1,
    properties: {
      grid: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-uid': uid('grid'),
        'x-async': true,
        'x-index': 1,
        properties: {
          row: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-uid': uid('row'),
            'x-async': false,
            'x-index': 1,
            properties: {
              col: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-uid': uid('col'),
                'x-async': false,
                'x-index': 1,
                properties: {
                  block: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': `${collection}:list`,
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection,
                      dataSource: 'main',
                      action: 'list',
                      params: { pageSize: 20 },
                      showIndex: true,
                      dragSort: false,
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:table',
                    'x-component': 'CardItem',
                    'x-filter-targets': [],
                    'x-uid': uid('block'),
                    'x-async': false,
                    'x-index': 1,
                    properties: {
                      actions: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-initializer': 'table:configureActions',
                        'x-component': 'ActionBar',
                        'x-component-props': { style: { marginBottom: 'var(--nb-spacing)' } },
                        'x-uid': uid('actions'),
                        'x-async': false,
                        'x-index': 1,
                      },
                      table: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-initializer': 'table:configureColumns',
                        'x-component': 'TableV2',
                        'x-use-component-props': 'useTableBlockProps',
                        'x-component-props': {
                          rowKey: 'id',
                          rowSelection: { type: 'checkbox' },
                        },
                        'x-uid': uid('table'),
                        'x-async': false,
                        'x-index': 2,
                        properties: {
                          ...columnProperties,
                          actions: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            title: '{{ t("Actions") }}',
                            'x-action-column': 'actions',
                            'x-decorator': 'TableV2.Column.ActionBar',
                            'x-component': 'TableV2.Column',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-initializer': 'table:configureItemActions',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-toolbar-props': { initializer: 'table:configureItemActions' },
                            'x-uid': uid('tableActionsCol'),
                            'x-async': false,
                            'x-index': columns.length + 1,
                            properties: {
                              actions: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': { split: '|' },
                                'x-uid': uid('tableActionsInner'),
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  return {
    schema,
    pageUid: uid('page'),
    tabUid: uid('grid'),
    tabSchemaName: 'grid',
    blockUid: uid('block'),
    firstColumnUid: columns.length ? `lms_${key}_col_${columns[0].field}` : undefined,
  };
}
