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
 * The shapes here mirror NocoBase's own proven page/table-block schema
 * (see packages/core/test/src/e2e/templatesOfPage.ts). Columns, fields and
 * actions are intentionally left to the standard `x-initializer`s so they are
 * configured in the visual editor (the "manual polish" half of the hybrid
 * approach). x-uids are derived deterministically from `key` so re-seeding is
 * idempotent.
 */

export interface PageSchema {
  'x-uid': string;
  [key: string]: unknown;
}

/**
 * Build a Page that contains a single Table block bound to `collection`.
 * Returns the schema plus the page-level x-uid (used as desktopRoutes.schemaUid).
 */
export function buildTableBlockPage(opts: { key: string; collection: string }): PageSchema {
  const { key, collection } = opts;
  const uid = (suffix: string) => `lms_${key}_${suffix}`;

  return {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-uid': uid('page'),
    'x-async': true,
    'x-index': 1,
    properties: {
      grid: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-uid': uid('grid'),
        'x-async': false,
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
                    'x-decorator-props': {
                      collection,
                      resource: collection,
                      action: 'list',
                      params: { pageSize: 20 },
                      rowKey: 'id',
                      showIndex: true,
                      dragSort: false,
                      disableTemplate: false,
                    },
                    'x-designer': 'TableBlockDesigner',
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
                        'x-component-props': {
                          rowKey: 'id',
                          rowSelection: { type: 'checkbox' },
                          useProps: '{{ useTableBlockProps }}',
                        },
                        'x-uid': uid('table'),
                        'x-async': false,
                        'x-index': 2,
                        properties: {
                          actions: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            title: '{{ t("Actions") }}',
                            'x-action-column': 'actions',
                            'x-decorator': 'TableV2.Column.ActionBar',
                            'x-component': 'TableV2.Column',
                            'x-designer': 'TableV2.ActionColumnDesigner',
                            'x-initializer': 'table:configureItemActions',
                            'x-uid': uid('tableActionsCol'),
                            'x-async': false,
                            'x-index': 1,
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
}
