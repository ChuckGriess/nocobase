/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context, Next } from '@nocobase/actions';

/**
 * POST /api/lms_enrollments:enroll
 * Body: { courseId }
 *
 * Enrolls the currently authenticated user in a course.
 * Idempotent — returns the existing enrollment if already enrolled.
 */
export async function enroll(ctx: Context, next: Next) {
  const { courseId } = ctx.action.params.values ?? (ctx.request.body as { courseId: number });
  const currentUser = ctx.state.currentUser;

  if (!currentUser) {
    ctx.throw(401, 'Authentication required');
  }

  if (!courseId) {
    ctx.throw(400, 'courseId is required');
  }

  const db = ctx.db;
  const enrollmentRepo = db.getRepository('lms_enrollments');
  const courseRepo = db.getRepository('lms_courses');

  // Verify course exists and is published
  const course = await courseRepo.findOne({ filter: { id: courseId } });
  if (!course) {
    ctx.throw(404, 'Course not found');
  }
  if (course.get('status') !== 'published') {
    ctx.throw(403, 'Course is not available for enrollment');
  }

  // Idempotent: return existing enrollment if present
  const existing = await enrollmentRepo.findOne({
    filter: { courseId, studentId: currentUser.id, status: { $ne: 'cancelled' } },
  });
  if (existing) {
    ctx.body = existing;
    return next();
  }

  const enrollment = await enrollmentRepo.create({
    values: {
      courseId,
      studentId: currentUser.id,
      status: 'active',
      enrolledAt: new Date(),
      progressPercent: 0,
    },
  });

  ctx.body = enrollment;
  return next();
}
