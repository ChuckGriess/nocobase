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
  name: 'lms_quiz_questions',
  title: 'Quiz Questions',
  sortable: 'sort',
  createdBy: false,
  updatedBy: false,
  logging: true,
  indexes: [{ fields: ['quizId'] }],
  fields: [
    {
      name: 'id',
      type: 'bigInt',
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    {
      name: 'question',
      type: 'text',
      allowNull: false,
      uiSchema: { type: 'string', title: '{{t("Question")}}', 'x-component': 'Textarea', required: true },
    },
    {
      name: 'type',
      type: 'string',
      defaultValue: 'multiple_choice',
      uiSchema: {
        type: 'string',
        title: '{{t("Type")}}',
        'x-component': 'Select',
        enum: [
          { label: '{{t("Multiple Choice")}}', value: 'multiple_choice' },
          { label: '{{t("True / False")}}', value: 'true_false' },
          { label: '{{t("Short Answer")}}', value: 'short_answer' },
        ],
      },
    },
    {
      // For multiple_choice: array of {label, value} objects
      // For true_false: not needed (answer is true/false)
      name: 'options',
      type: 'json',
      uiSchema: { type: 'object', title: '{{t("Options (JSON)")}}', 'x-component': 'JsonEditor' },
    },
    {
      name: 'correctAnswer',
      type: 'text',
      uiSchema: { type: 'string', title: '{{t("Correct Answer")}}', 'x-component': 'Textarea' },
    },
    {
      name: 'explanation',
      type: 'text',
      uiSchema: { type: 'string', title: '{{t("Explanation")}}', 'x-component': 'Textarea' },
    },
    {
      name: 'points',
      type: 'float',
      defaultValue: 1,
      uiSchema: { type: 'number', title: '{{t("Points")}}', 'x-component': 'InputNumber' },
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
      name: 'quiz',
      target: 'lms_quizzes',
      foreignKey: 'quizId',
      onDelete: 'CASCADE',
      uiSchema: { type: 'object', title: '{{t("Quiz")}}', 'x-component': 'AssociationField' },
    },
  ],
} as CollectionOptions;
