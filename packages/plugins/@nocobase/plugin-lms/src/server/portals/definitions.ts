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
    { key: 'instructor_courses', title: 'My Courses', icon: 'BookOutlined', collection: 'lms_courses' },
    { key: 'instructor_assignments', title: 'Assignments', icon: 'FileTextOutlined', collection: 'lms_assignments' },
    { key: 'instructor_enrollments', title: 'Enrollments', icon: 'TeamOutlined', collection: 'lms_enrollments' },
    { key: 'instructor_submissions', title: 'Grading', icon: 'CheckSquareOutlined', collection: 'lms_submissions' },
    {
      key: 'instructor_announcements',
      title: 'Announcements',
      icon: 'NotificationOutlined',
      collection: 'lms_announcements',
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
    { key: 'student_catalog', title: 'Course Catalog', icon: 'AppstoreOutlined', collection: 'lms_courses' },
    { key: 'student_enrollments', title: 'My Courses', icon: 'BookOutlined', collection: 'lms_enrollments' },
    { key: 'student_certificates', title: 'My Certificates', icon: 'TrophyOutlined', collection: 'lms_certificates' },
  ],
};
