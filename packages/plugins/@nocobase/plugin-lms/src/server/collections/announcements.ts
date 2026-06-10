/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CollectionOptions } from '@nocobase/database';

export default {
  name: 'lms_announcements',
  title: 'Announcements',
  sortable: 'sort',
  createdBy: true,
  updatedBy: true,
  logging: true,
  indexes: [{ fields: ['courseId'] }, { fields: ['authorId'] }, { fields: ['isActive'] }],
  fields: [
    {
      name: 'id',
      type: 'bigInt',
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    {
      name: 'title',
      type: 'string',
      allowNull: false,
      uiSchema: { type: 'string', title: '{{t("Title")}}', 'x-component': 'Input', required: true },
    },
    {
      name: 'content',
      type: 'text',
      uiSchema: { type: 'string', title: '{{t("Content")}}', 'x-component': 'RichText' },
    },
    {
      name: 'isActive',
      type: 'boolean',
      defaultValue: true,
      uiSchema: { type: 'boolean', title: '{{t("Active")}}', 'x-component': 'Checkbox' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      uiSchema: {
        type: 'string',
        title: '{{t("Published At")}}',
        'x-component': 'DatePicker',
      },
    },
    {
      name: 'sort',
      type: 'integer',
      defaultValue: 0,
    },
    // course = null means global/platform-wide announcement
    {
      interface: 'obo',
      type: 'belongsTo',
      name: 'course',
      target: 'lms_courses',
      foreignKey: 'courseId',
      uiSchema: {
        type: 'object',
        title: '{{t("Course (leave blank for global)")}}',
        'x-component': 'AssociationField',
      },
    },
    {
      interface: 'obo',
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
      uiSchema: { type: 'object', title: '{{t("Author")}}', 'x-component': 'AssociationField' },
    },
  ],
} as CollectionOptions;
