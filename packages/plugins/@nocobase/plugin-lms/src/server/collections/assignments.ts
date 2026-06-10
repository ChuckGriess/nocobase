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
  name: 'lms_assignments',
  title: 'Assignments',
  sortable: 'sort',
  createdBy: true,
  updatedBy: true,
  logging: true,
  indexes: [{ fields: ['courseId'] }, { fields: ['moduleId'] }],
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
      uiSchema: { type: 'string', title: '{{t("Description")}}', 'x-component': 'RichText' },
    },
    {
      name: 'instructions',
      type: 'text',
      uiSchema: { type: 'string', title: '{{t("Instructions")}}', 'x-component': 'RichText' },
    },
    {
      name: 'dueDate',
      type: 'date',
      uiSchema: { type: 'string', title: '{{t("Due Date")}}', 'x-component': 'DatePicker' },
    },
    {
      name: 'maxScore',
      type: 'float',
      defaultValue: 100,
      uiSchema: { type: 'number', title: '{{t("Max Score")}}', 'x-component': 'InputNumber' },
    },
    {
      name: 'sort',
      type: 'integer',
      defaultValue: 0,
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
      interface: 'obo',
      type: 'belongsTo',
      name: 'module',
      target: 'lms_modules',
      foreignKey: 'moduleId',
      uiSchema: { type: 'object', title: '{{t("Module")}}', 'x-component': 'AssociationField' },
    },
    {
      interface: 'o2m',
      type: 'hasMany',
      name: 'submissions',
      target: 'lms_submissions',
      foreignKey: 'assignmentId',
    },
  ],
} as CollectionOptions;
