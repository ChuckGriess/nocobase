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
  name: 'lms_submissions',
  title: 'Assignment Submissions',
  createdBy: true,
  updatedBy: true,
  logging: true,
  indexes: [{ fields: ['assignmentId'] }, { fields: ['studentId'] }, { fields: ['status'] }],
  fields: [
    {
      name: 'id',
      type: 'bigInt',
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    {
      name: 'content',
      type: 'text',
      uiSchema: { type: 'string', title: '{{t("Submission Content")}}', 'x-component': 'RichText' },
    },
    {
      name: 'fileUrl',
      type: 'string',
      uiSchema: { type: 'string', title: '{{t("File URL")}}', 'x-component': 'Input' },
    },
    {
      name: 'status',
      type: 'string',
      defaultValue: 'submitted',
      uiSchema: {
        type: 'string',
        title: '{{t("Status")}}',
        'x-component': 'Select',
        enum: [
          { label: '{{t("Submitted")}}', value: 'submitted', color: 'blue' },
          { label: '{{t("Graded")}}', value: 'graded', color: 'green' },
          { label: '{{t("Returned")}}', value: 'returned', color: 'orange' },
        ],
      },
    },
    {
      name: 'score',
      type: 'float',
      uiSchema: { type: 'number', title: '{{t("Score")}}', 'x-component': 'InputNumber' },
    },
    {
      name: 'feedback',
      type: 'text',
      uiSchema: { type: 'string', title: '{{t("Instructor Feedback")}}', 'x-component': 'RichText' },
    },
    {
      name: 'submittedAt',
      type: 'date',
      uiSchema: { type: 'string', title: '{{t("Submitted At")}}', 'x-component': 'DatePicker', 'x-read-pretty': true },
    },
    {
      name: 'gradedAt',
      type: 'date',
      uiSchema: { type: 'string', title: '{{t("Graded At")}}', 'x-component': 'DatePicker', 'x-read-pretty': true },
    },
    // Relationships
    {
      interface: 'obo',
      type: 'belongsTo',
      name: 'assignment',
      target: 'lms_assignments',
      foreignKey: 'assignmentId',
      onDelete: 'CASCADE',
      uiSchema: { type: 'object', title: '{{t("Assignment")}}', 'x-component': 'AssociationField' },
    },
    {
      interface: 'obo',
      type: 'belongsTo',
      name: 'student',
      target: 'users',
      foreignKey: 'studentId',
      uiSchema: { type: 'object', title: '{{t("Student")}}', 'x-component': 'AssociationField' },
    },
  ],
} as CollectionOptions;
