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
  name: 'lms_certificates',
  title: 'Certificates',
  createdBy: false,
  updatedBy: false,
  logging: true,
  indexes: [{ fields: ['enrollmentId'] }, { fields: ['studentId'] }, { fields: ['courseId'] }],
  fields: [
    {
      name: 'id',
      type: 'bigInt',
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    {
      name: 'certificateNumber',
      type: 'uid',
      prefix: 'CERT-',
      unique: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Certificate Number")}}',
        'x-component': 'Input',
        'x-read-pretty': true,
      },
    },
    {
      name: 'issuedAt',
      type: 'date',
      defaultToCurrentTime: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Issued At")}}',
        'x-component': 'DatePicker',
        'x-read-pretty': true,
      },
    },
    {
      name: 'expiryDate',
      type: 'date',
      uiSchema: {
        type: 'string',
        title: '{{t("Expiry Date")}}',
        'x-component': 'DatePicker',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      uiSchema: { type: 'object', title: '{{t("Metadata")}}', 'x-component': 'JsonEditor' },
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
      uiSchema: { type: 'object', title: '{{t("Course")}}', 'x-component': 'AssociationField' },
    },
  ],
} as CollectionOptions;
