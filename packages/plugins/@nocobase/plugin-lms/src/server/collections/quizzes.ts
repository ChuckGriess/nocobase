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
  name: 'lms_quizzes',
  title: 'Quizzes',
  createdBy: true,
  updatedBy: true,
  logging: true,
  indexes: [{ fields: ['courseId'] }],
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
      name: 'passingScore',
      type: 'float',
      defaultValue: 70,
      uiSchema: { type: 'number', title: '{{t("Passing Score (%)")}}', 'x-component': 'InputNumber' },
    },
    {
      name: 'timeLimitMinutes',
      type: 'integer',
      uiSchema: { type: 'number', title: '{{t("Time Limit (minutes)")}}', 'x-component': 'InputNumber' },
    },
    {
      name: 'maxAttempts',
      type: 'integer',
      defaultValue: 3,
      uiSchema: { type: 'number', title: '{{t("Max Attempts")}}', 'x-component': 'InputNumber' },
    },
    {
      name: 'shuffleQuestions',
      type: 'boolean',
      defaultValue: false,
      uiSchema: { type: 'boolean', title: '{{t("Shuffle Questions")}}', 'x-component': 'Checkbox' },
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
      name: 'questions',
      target: 'lms_quiz_questions',
      foreignKey: 'quizId',
    },
    {
      interface: 'o2m',
      type: 'hasMany',
      name: 'attempts',
      target: 'lms_quiz_attempts',
      foreignKey: 'quizId',
    },
  ],
} as CollectionOptions;
