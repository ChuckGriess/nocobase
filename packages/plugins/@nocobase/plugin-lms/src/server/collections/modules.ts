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
  name: 'lms_modules',
  title: 'Modules',
  sortable: 'sort',
  createdBy: true,
  updatedBy: true,
  logging: true,
  indexes: [{ fields: ['courseId'] }, { fields: ['status'] }],
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
      name: 'description',
      type: 'text',
      uiSchema: { type: 'string', title: '{{t("Description")}}', 'x-component': 'Textarea' },
    },
    {
      name: 'sort',
      type: 'integer',
      defaultValue: 0,
    },
    {
      name: 'status',
      type: 'string',
      defaultValue: 'draft',
      uiSchema: {
        type: 'string',
        title: '{{t("Status")}}',
        'x-component': 'Select',
        enum: [
          { label: '{{t("Draft")}}', value: 'draft', color: 'default' },
          { label: '{{t("Published")}}', value: 'published', color: 'green' },
        ],
      },
    },
    // Relationships
    {
      interface: 'obo',
      type: 'belongsTo',
      name: 'course',
      target: 'lms_courses',
      foreignKey: 'courseId',
      onDelete: 'CASCADE',
      uiSchema: { type: 'object', title: '{{t("Course")}}', 'x-component': 'AssociationField' },
    },
    {
      interface: 'o2m',
      type: 'hasMany',
      name: 'lessons',
      target: 'lms_lessons',
      foreignKey: 'moduleId',
    },
  ],
} as CollectionOptions;
