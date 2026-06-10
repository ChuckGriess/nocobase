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
  name: 'lms_lessons',
  title: 'Lessons',
  sortable: 'sort',
  createdBy: true,
  updatedBy: true,
  logging: true,
  indexes: [{ fields: ['moduleId'] }, { fields: ['quizId'] }],
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
      name: 'type',
      type: 'string',
      defaultValue: 'text',
      uiSchema: {
        type: 'string',
        title: '{{t("Type")}}',
        'x-component': 'Select',
        enum: [
          { label: '{{t("Text")}}', value: 'text' },
          { label: '{{t("Video")}}', value: 'video' },
          { label: '{{t("PDF")}}', value: 'pdf' },
          { label: '{{t("Quiz")}}', value: 'quiz' },
        ],
      },
    },
    {
      name: 'content',
      type: 'text',
      uiSchema: { type: 'string', title: '{{t("Content")}}', 'x-component': 'RichText' },
    },
    {
      name: 'videoUrl',
      type: 'string',
      uiSchema: { type: 'string', title: '{{t("Video URL")}}', 'x-component': 'Input' },
    },
    {
      name: 'attachmentUrl',
      type: 'string',
      uiSchema: { type: 'string', title: '{{t("Attachment URL")}}', 'x-component': 'Input' },
    },
    {
      name: 'durationMinutes',
      type: 'integer',
      uiSchema: { type: 'number', title: '{{t("Duration (minutes)")}}', 'x-component': 'InputNumber' },
    },
    {
      name: 'sort',
      type: 'integer',
      defaultValue: 0,
    },
    {
      name: 'isFree',
      type: 'boolean',
      defaultValue: false,
      uiSchema: { type: 'boolean', title: '{{t("Free Preview")}}', 'x-component': 'Checkbox' },
    },
    // Relationships
    {
      interface: 'obo',
      type: 'belongsTo',
      name: 'module',
      target: 'lms_modules',
      foreignKey: 'moduleId',
      onDelete: 'CASCADE',
      uiSchema: { type: 'object', title: '{{t("Module")}}', 'x-component': 'AssociationField' },
    },
    {
      interface: 'obo',
      type: 'belongsTo',
      name: 'quiz',
      target: 'lms_quizzes',
      foreignKey: 'quizId',
      uiSchema: { type: 'object', title: '{{t("Quiz")}}', 'x-component': 'AssociationField' },
    },
    {
      interface: 'o2m',
      type: 'hasMany',
      name: 'completions',
      target: 'lms_lesson_completions',
      foreignKey: 'lessonId',
    },
  ],
} as CollectionOptions;
