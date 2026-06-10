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
  name: 'lms_enrollments',
  title: 'Enrollments',
  createdBy: true,
  updatedBy: true,
  logging: true,
  // Note: one-active-enrollment-per-course is enforced in the `enroll` action
  // (a partial unique index isn't portable); these indexes are for query speed.
  indexes: [
    { fields: ['studentId'] },
    { fields: ['courseId'] },
    { fields: ['status'] },
    { fields: ['studentId', 'courseId'] },
  ],
  fields: [
    {
      name: 'id',
      type: 'bigInt',
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    {
      name: 'status',
      type: 'string',
      defaultValue: 'active',
      uiSchema: {
        type: 'string',
        title: '{{t("Status")}}',
        'x-component': 'Select',
        enum: [
          { label: '{{t("Active")}}', value: 'active', color: 'blue' },
          { label: '{{t("Completed")}}', value: 'completed', color: 'green' },
          { label: '{{t("Cancelled")}}', value: 'cancelled', color: 'red' },
        ],
      },
    },
    {
      name: 'progressPercent',
      type: 'float',
      defaultValue: 0,
      uiSchema: { type: 'number', title: '{{t("Progress (%)")}}', 'x-component': 'InputNumber', 'x-read-pretty': true },
    },
    {
      name: 'enrolledAt',
      type: 'date',
      uiSchema: { type: 'string', title: '{{t("Enrolled At")}}', 'x-component': 'DatePicker', 'x-read-pretty': true },
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
      name: 'student',
      target: 'users',
      foreignKey: 'studentId',
      uiSchema: { type: 'object', title: '{{t("Student")}}', 'x-component': 'AssociationField' },
    },
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
      name: 'lessonCompletions',
      target: 'lms_lesson_completions',
      foreignKey: 'enrollmentId',
    },
    {
      interface: 'o2m',
      type: 'hasMany',
      name: 'quizAttempts',
      target: 'lms_quiz_attempts',
      foreignKey: 'enrollmentId',
    },
    {
      interface: 'o2m',
      type: 'hasMany',
      name: 'certificates',
      target: 'lms_certificates',
      foreignKey: 'enrollmentId',
    },
  ],
} as CollectionOptions;
