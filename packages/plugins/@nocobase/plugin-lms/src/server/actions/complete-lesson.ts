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
 * POST /api/lms_lesson_completions:completeLesson
 * Body: { lessonId, enrollmentId }
 *
 * Marks a lesson as complete for an enrollment and recalculates course progress.
 * Idempotent — duplicate calls are safe.
 */
export async function completeLesson(ctx: Context, next: Next) {
  const { lessonId, enrollmentId } =
    ctx.action.params.values ?? (ctx.request.body as { lessonId: number; enrollmentId: number });
  const currentUser = ctx.state.currentUser;

  if (!currentUser) {
    ctx.throw(401, 'Authentication required');
  }

  if (!lessonId || !enrollmentId) {
    ctx.throw(400, 'lessonId and enrollmentId are required');
  }

  const db = ctx.db;
  const completionRepo = db.getRepository('lms_lesson_completions');
  const enrollmentRepo = db.getRepository('lms_enrollments');
  const lessonRepo = db.getRepository('lms_lessons');
  const moduleRepo = db.getRepository('lms_modules');

  // Verify the enrollment belongs to this user
  const enrollment = await enrollmentRepo.findOne({
    filter: { id: enrollmentId, studentId: currentUser.id, status: 'active' },
  });
  if (!enrollment) {
    ctx.throw(403, 'Enrollment not found or not active');
  }

  const courseId = enrollment.get('courseId') as number;

  // Idempotent — skip if already completed
  const existing = await completionRepo.findOne({
    filter: { lessonId, enrollmentId },
  });
  if (!existing) {
    await completionRepo.create({
      values: {
        lessonId,
        enrollmentId,
        studentId: currentUser.id,
        completedAt: new Date(),
      },
    });
  }

  // Recalculate progress: completedLessons / totalLessons in the course.
  // Resolve the course's module IDs first, then count lessons within them —
  // this avoids a nested association filter in count(), which is unreliable.
  const modules = await moduleRepo.find({ filter: { courseId }, fields: ['id'] });
  const moduleIds = modules.map((m) => m.get('id'));
  const totalLessons = moduleIds.length > 0 ? await lessonRepo.count({ filter: { moduleId: { $in: moduleIds } } }) : 0;

  const completedLessons = await completionRepo.count({
    filter: { enrollmentId },
  });

  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const isComplete = progressPercent >= 100;

  await enrollmentRepo.update({
    filter: { id: enrollmentId },
    values: {
      progressPercent,
      ...(isComplete ? { status: 'completed', completedAt: new Date() } : {}),
    },
  });

  ctx.body = { progressPercent, completed: isComplete };
  return next();
}
