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
  name: 'lms_lesson_completions',
  title: 'Lesson Completions',
  createdBy: false,
  updatedBy: false,
  logging: true,
  // A lesson can only be completed once per enrollment — enforce at the DB level.
  indexes: [{ unique: true, fields: ['enrollmentId', 'lessonId'] }, { fields: ['studentId'] }],
  fields: [
    {
      name: 'id',
      type: 'bigInt',
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
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
      name: 'enrollment',
      target: 'lms_enrollments',
      foreignKey: 'enrollmentId',
      onDelete: 'CASCADE',
      uiSchema: { type: 'object', title: '{{t("Enrollment")}}', 'x-component': 'AssociationField' },
    },
    {
      interface: 'obo',
      type: 'belongsTo',
      name: 'lesson',
      target: 'lms_lessons',
      foreignKey: 'lessonId',
      onDelete: 'CASCADE',
      uiSchema: { type: 'object', title: '{{t("Lesson")}}', 'x-component': 'AssociationField' },
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
