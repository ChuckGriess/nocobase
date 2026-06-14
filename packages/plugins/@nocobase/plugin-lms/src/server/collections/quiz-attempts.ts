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
  name: 'lms_quiz_attempts',
  title: 'Quiz Attempts',
  createdBy: false,
  updatedBy: false,
  logging: true,
  indexes: [{ fields: ['quizId'] }, { fields: ['studentId'] }, { fields: ['enrollmentId'] }],
  fields: [
    {
      name: 'id',
      type: 'bigInt',
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    {
      // Stored as { questionId: answeredValue } map
      name: 'answers',
      type: 'json',
      uiSchema: { type: 'object', title: '{{t("Answers")}}', 'x-component': 'JsonEditor', 'x-read-pretty': true },
    },
    {
      name: 'score',
      type: 'float',
      uiSchema: { type: 'number', title: '{{t("Score (%)")}}', 'x-component': 'InputNumber', 'x-read-pretty': true },
    },
    {
      name: 'passed',
      type: 'boolean',
      defaultValue: false,
      uiSchema: { type: 'boolean', title: '{{t("Passed")}}', 'x-component': 'Checkbox', 'x-read-pretty': true },
    },
    {
      name: 'startedAt',
      type: 'date',
      uiSchema: { type: 'string', title: '{{t("Started At")}}', 'x-component': 'DatePicker', 'x-read-pretty': true },
    },
    {
      name: 'completedAt',
      type: 'date',
      uiSchema: { type: 'string', title: '{{t("Completed At")}}', 'x-component': 'DatePicker', 'x-read-pretty': true },
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
    {
      interface: 'obo',
      type: 'belongsTo',
      name: 'student',
      target: 'users',
      foreignKey: 'studentId',
      uiSchema: { type: 'object', title: '{{t("Student")}}', 'x-component': 'AssociationField' },
    },
    {
      interface: 'obo',
      type: 'belongsTo',
      name: 'enrollment',
      target: 'lms_enrollments',
      foreignKey: 'enrollmentId',
      onDelete: 'CASCADE',
      uiSchema: { type: 'object', title: '{{t("Enrollment")}}', 'x-component': 'AssociationField' },
    },
  ],
} as CollectionOptions;
