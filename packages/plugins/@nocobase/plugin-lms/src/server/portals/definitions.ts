/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { PortalGroup } from './seed-portals';

/**
 * Instructor portal — list/management pages for the instructor role.
 * Columns, item actions (Edit/Delete/Grade) and drill-down detail pages are
 * configured in the visual editor (hybrid: code seeds structure, UI does polish).
 */
export const INSTRUCTOR_PORTAL: PortalGroup = {
  key: 'instructor',
  title: 'Instructor Portal',
  icon: 'ReadOutlined',
  roleName: 'instructor',
  pages: [
    {
      key: 'instructor_courses',
      title: 'My Courses',
      icon: 'BookOutlined',
      collection: 'lms_courses',
      columns: [
        { field: 'title' },
        { field: 'status' },
        { field: 'category' },
        { field: 'durationMinutes' },
        { field: 'instructor', targetLabelField: 'nickname' },
      ],
    },
    {
      key: 'instructor_assignments',
      title: 'Assignments',
      icon: 'FileTextOutlined',
      collection: 'lms_assignments',
      columns: [
        { field: 'title' },
        { field: 'course', targetLabelField: 'title' },
        { field: 'dueDate' },
        { field: 'maxScore' },
      ],
    },
    {
      key: 'instructor_enrollments',
      title: 'Enrollments',
      icon: 'TeamOutlined',
      collection: 'lms_enrollments',
      columns: [
        { field: 'student', targetLabelField: 'nickname' },
        { field: 'course', targetLabelField: 'title' },
        { field: 'status' },
        { field: 'progressPercent' },
        { field: 'enrolledAt' },
      ],
    },
    {
      key: 'instructor_submissions',
      title: 'Grading',
      icon: 'CheckSquareOutlined',
      collection: 'lms_submissions',
      columns: [
        { field: 'student', targetLabelField: 'nickname' },
        { field: 'assignment', targetLabelField: 'title' },
        { field: 'status' },
        { field: 'score' },
        { field: 'submittedAt' },
      ],
    },
    {
      key: 'instructor_announcements',
      title: 'Announcements',
      icon: 'NotificationOutlined',
      collection: 'lms_announcements',
      columns: [
        { field: 'title' },
        { field: 'course', targetLabelField: 'title' },
        { field: 'isActive' },
        { field: 'publishedAt' },
      ],
    },
  ],
};

/**
 * Student portal — discovery + learning pages for the student role.
 * The "Enroll" action (Course Catalog) and "Mark Complete" action (Lesson
 * Player) are added as custom-request actions in the visual editor, calling
 * `lms_enrollments:enroll` and `lms_lesson_completions:completeLesson`
 * respectively. The catalog block can be switched from Table to Grid Card in
 * the UI. See docs/lms-setup.md §7.
 */
export const STUDENT_PORTAL: PortalGroup = {
  key: 'student',
  title: 'My Learning',
  icon: 'ReadOutlined',
  roleName: 'student',
  pages: [
    {
      key: 'student_catalog',
      title: 'Course Catalog',
      icon: 'AppstoreOutlined',
      collection: 'lms_courses',
      columns: [
        { field: 'title' },
        { field: 'description' },
        { field: 'category' },
        { field: 'durationMinutes' },
        { field: 'instructor', targetLabelField: 'nickname' },
      ],
    },
    {
      key: 'student_enrollments',
      title: 'My Courses',
      icon: 'BookOutlined',
      collection: 'lms_enrollments',
      columns: [
        { field: 'course', targetLabelField: 'title' },
        { field: 'status' },
        { field: 'progressPercent' },
        { field: 'enrolledAt' },
        { field: 'completedAt' },
      ],
    },
    {
      key: 'student_certificates',
      title: 'My Certificates',
      icon: 'TrophyOutlined',
      collection: 'lms_certificates',
      columns: [
        { field: 'certificateNumber' },
        { field: 'course', targetLabelField: 'title' },
        { field: 'issuedAt' },
        { field: 'expiryDate' },
      ],
    },
  ],
};
