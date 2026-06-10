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
  name: 'lms_courses',
  title: 'Courses',
  sortable: 'sort',
  createdBy: true,
  updatedBy: true,
  logging: true,
  indexes: [{ fields: ['instructorId'] }, { fields: ['status'] }],
  fields: [
    {
      name: 'id',
      type: 'bigInt',
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      uiSchema: { type: 'number', title: '{{t("ID")}}', 'x-component': 'InputNumber', 'x-read-pretty': true },
    },
    {
      name: 'title',
      type: 'string',
      allowNull: false,
      uiSchema: { type: 'string', title: '{{t("Title")}}', 'x-component': 'Input', required: true },
    },
    {
      name: 'slug',
      type: 'uid',
      prefix: 'course_',
      unique: true,
      uiSchema: { type: 'string', title: '{{t("Slug")}}', 'x-component': 'Input' },
    },
    {
      name: 'description',
      type: 'text',
      uiSchema: {
        type: 'string',
        title: '{{t("Description")}}',
        'x-component': 'RichText',
      },
    },
    {
      name: 'thumbnail',
      type: 'string',
      uiSchema: { type: 'string', title: '{{t("Thumbnail URL")}}', 'x-component': 'Input' },
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
          { label: '{{t("Archived")}}', value: 'archived', color: 'red' },
        ],
      },
    },
    {
      name: 'category',
      type: 'string',
      uiSchema: { type: 'string', title: '{{t("Category")}}', 'x-component': 'Input' },
    },
    {
      name: 'durationMinutes',
      type: 'integer',
      uiSchema: { type: 'number', title: '{{t("Duration (minutes)")}}', 'x-component': 'InputNumber' },
    },
    {
      name: 'sort',
      type: 'integer',
    },
    // Relationships
    {
      interface: 'obo',
      type: 'belongsTo',
      name: 'instructor',
      target: 'users',
      foreignKey: 'instructorId',
      uiSchema: { type: 'object', title: '{{t("Instructor")}}', 'x-component': 'AssociationField' },
    },
    {
      interface: 'o2m',
      type: 'hasMany',
      name: 'modules',
      target: 'lms_modules',
      foreignKey: 'courseId',
    },
    {
      interface: 'o2m',
      type: 'hasMany',
      name: 'enrollments',
      target: 'lms_enrollments',
      foreignKey: 'courseId',
    },
    {
      interface: 'o2m',
      type: 'hasMany',
      name: 'assignments',
      target: 'lms_assignments',
      foreignKey: 'courseId',
    },
    {
      interface: 'o2m',
      type: 'hasMany',
      name: 'announcements',
      target: 'lms_announcements',
      foreignKey: 'courseId',
    },
  ],
} as CollectionOptions;
