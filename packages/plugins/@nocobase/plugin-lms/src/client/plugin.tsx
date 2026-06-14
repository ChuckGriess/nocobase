/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';

export class PluginLMSClient extends Plugin {
  async load() {
    // UI pages for the LMS are built through the NocoBase page builder.
    // This plugin registers the client-side locale and any custom components.
    await this.app.i18n.loadResourceBundle('en-US', '@nocobase/plugin-lms', enUS);
    await this.app.i18n.loadResourceBundle('zh-CN', '@nocobase/plugin-lms', zhCN);
  }
}

const enUS = {
  LMS: 'Learning Management System',
  Courses: 'Courses',
  Modules: 'Modules',
  Lessons: 'Lessons',
  Enrollments: 'Enrollments',
  Assignments: 'Assignments',
  Quizzes: 'Quizzes',
  Certificates: 'Certificates',
  Announcements: 'Announcements',
  'My Courses': 'My Courses',
  'Course Catalog': 'Course Catalog',
  Enroll: 'Enroll',
  'Mark Complete': 'Mark Complete',
  Progress: 'Progress',
  'Submit Assignment': 'Submit Assignment',
  Certificate: 'Certificate',
  'Issued At': 'Issued At',
  Instructor: 'Instructor',
  Student: 'Student',
  Published: 'Published',
  Draft: 'Draft',
  Archived: 'Archived',
  Active: 'Active',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
  Graded: 'Graded',
  Submitted: 'Submitted',
  Passed: 'Passed',
  Failed: 'Failed',
  Quiz: 'Quiz',
  'Quiz Results': 'Quiz Results',
  'Score (%)': 'Score (%)',
  'Completed At': 'Completed At',
  Enrollment: 'Enrollment',
  Answers: 'Answers',
  'Started At': 'Started At',
};

const zhCN = {
  LMS: '学习管理系统',
  Courses: '课程',
  Modules: '模块',
  Lessons: '课时',
  Enrollments: '报名',
  Assignments: '作业',
  Quizzes: '测验',
  Certificates: '证书',
  Announcements: '公告',
  'My Courses': '我的课程',
  'Course Catalog': '课程目录',
  Enroll: '报名',
  'Mark Complete': '标记完成',
  Progress: '进度',
  'Submit Assignment': '提交作业',
  Certificate: '证书',
  'Issued At': '颁发时间',
  Instructor: '讲师',
  Student: '学生',
  Published: '已发布',
  Draft: '草稿',
  Archived: '已归档',
  Active: '活跃',
  Completed: '已完成',
  Cancelled: '已取消',
  Graded: '已评分',
  Submitted: '已提交',
  Passed: '通过',
  Failed: '未通过',
  Quiz: '测验',
  'Quiz Results': '测验结果',
  'Score (%)': '分数 (%)',
  'Completed At': '完成时间',
  Enrollment: '报名',
  Answers: '答案',
  'Started At': '开始时间',
};
