/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';

describe('LMS actions', () => {
  let app: MockServer;
  let db: Database;
  let agent: ReturnType<MockServer['agent']>;
  let user: any;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: ['field-sort', 'users', 'auth', 'acl', 'data-source-manager', 'system-settings', 'lms'],
    });
    db = app.db;

    const userRepo = db.getRepository('users');
    user = await userRepo.findOne({ appends: ['roles'] });
    agent = app.agent();
    await agent.login(user);
  });

  afterEach(async () => {
    await app.destroy();
  });

  // Helper: build a published course with `moduleCount` modules each holding `lessonsPerModule` lessons
  const buildCourse = async (moduleCount = 1, lessonsPerModule = 2) => {
    const course = await db.getRepository('lms_courses').create({
      values: { title: 'Test Course', status: 'published', instructorId: user.id },
    });
    const lessonIds: number[] = [];
    for (let m = 0; m < moduleCount; m++) {
      const module = await db.getRepository('lms_modules').create({
        values: { title: `Module ${m}`, courseId: course.get('id'), status: 'published' },
      });
      for (let l = 0; l < lessonsPerModule; l++) {
        const lesson = await db.getRepository('lms_lessons').create({
          values: { title: `Lesson ${m}-${l}`, moduleId: module.get('id'), type: 'text' },
        });
        lessonIds.push(lesson.get('id') as number);
      }
    }
    return { courseId: course.get('id') as number, lessonIds };
  };

  describe('enroll', () => {
    it('creates an active enrollment for the current user', async () => {
      const { courseId } = await buildCourse();
      const res = await agent.resource('lms_enrollments').enroll({ values: { courseId } });
      expect(res.status).toBe(200);
      expect(res.body.data.studentId).toBe(user.id);
      expect(res.body.data.status).toBe('active');
    });

    it('is idempotent — returns the existing enrollment on repeat', async () => {
      const { courseId } = await buildCourse();
      const first = await agent.resource('lms_enrollments').enroll({ values: { courseId } });
      const second = await agent.resource('lms_enrollments').enroll({ values: { courseId } });
      expect(first.body.data.id).toBe(second.body.data.id);
      const count = await db.getRepository('lms_enrollments').count({ filter: { courseId, studentId: user.id } });
      expect(count).toBe(1);
    });

    it('rejects enrollment in an unpublished course', async () => {
      const course = await db.getRepository('lms_courses').create({
        values: { title: 'Draft Course', status: 'draft', instructorId: user.id },
      });
      const res = await agent.resource('lms_enrollments').enroll({ values: { courseId: course.get('id') } });
      expect(res.status).toBe(403);
    });
  });

  describe('completeLesson', () => {
    it('updates progress incrementally and completes at 100%', async () => {
      const { courseId, lessonIds } = await buildCourse(2, 2); // 4 lessons total
      const enrollment = (await agent.resource('lms_enrollments').enroll({ values: { courseId } })).body.data;

      // Complete first lesson → 25%
      const r1 = await agent
        .resource('lms_lesson_completions')
        .completeLesson({ values: { lessonId: lessonIds[0], enrollmentId: enrollment.id } });
      expect(r1.body.data.progressPercent).toBe(25);
      expect(r1.body.data.completed).toBe(false);

      // Complete remaining lessons → 100% + status completed
      for (let i = 1; i < lessonIds.length; i++) {
        await agent
          .resource('lms_lesson_completions')
          .completeLesson({ values: { lessonId: lessonIds[i], enrollmentId: enrollment.id } });
      }
      const final = await db.getRepository('lms_enrollments').findOne({ filter: { id: enrollment.id } });
      expect(final.get('progressPercent')).toBe(100);
      expect(final.get('status')).toBe('completed');
    });

    it('is idempotent — completing the same lesson twice does not double-count', async () => {
      const { courseId, lessonIds } = await buildCourse(1, 2);
      const enrollment = (await agent.resource('lms_enrollments').enroll({ values: { courseId } })).body.data;

      await agent
        .resource('lms_lesson_completions')
        .completeLesson({ values: { lessonId: lessonIds[0], enrollmentId: enrollment.id } });
      const r2 = await agent
        .resource('lms_lesson_completions')
        .completeLesson({ values: { lessonId: lessonIds[0], enrollmentId: enrollment.id } });
      expect(r2.body.data.progressPercent).toBe(50);

      const completionCount = await db
        .getRepository('lms_lesson_completions')
        .count({ filter: { enrollmentId: enrollment.id } });
      expect(completionCount).toBe(1);
    });
  });

  describe('submitQuiz', () => {
    const buildQuiz = async (courseId: number) => {
      const quiz = await db.getRepository('lms_quizzes').create({
        values: { title: 'Quiz', courseId, passingScore: 70, maxAttempts: 2 },
      });
      const q1 = await db.getRepository('lms_quiz_questions').create({
        values: { quizId: quiz.get('id'), question: '2+2?', type: 'multiple_choice', correctAnswer: '4', points: 1 },
      });
      const q2 = await db.getRepository('lms_quiz_questions').create({
        values: {
          quizId: quiz.get('id'),
          question: 'Sky color?',
          type: 'short_answer',
          correctAnswer: 'blue',
          points: 1,
        },
      });
      return { quizId: quiz.get('id') as number, q1: q1.get('id') as number, q2: q2.get('id') as number };
    };

    it('grades correctly and marks pass/fail against the passing score', async () => {
      const { courseId } = await buildCourse();
      const enrollment = (await agent.resource('lms_enrollments').enroll({ values: { courseId } })).body.data;
      const { quizId, q1, q2 } = await buildQuiz(courseId);

      // Both correct → 100% → passed
      const passRes = await agent.resource('lms_quiz_attempts').submitQuiz({
        values: {
          quizId,
          enrollmentId: enrollment.id,
          answers: [
            { questionId: q1, answer: '4' },
            { questionId: q2, answer: 'The sky is BLUE' },
          ],
        },
      });
      expect(passRes.body.data.score).toBe(100);
      expect(passRes.body.data.passed).toBe(true);
    });

    it('enforces the maximum attempt limit', async () => {
      const { courseId } = await buildCourse();
      const enrollment = (await agent.resource('lms_enrollments').enroll({ values: { courseId } })).body.data;
      const { quizId, q1, q2 } = await buildQuiz(courseId);

      const wrong = {
        quizId,
        enrollmentId: enrollment.id,
        answers: [
          { questionId: q1, answer: '5' },
          { questionId: q2, answer: 'green' },
        ],
      };
      await agent.resource('lms_quiz_attempts').submitQuiz({ values: wrong }); // attempt 1
      await agent.resource('lms_quiz_attempts').submitQuiz({ values: wrong }); // attempt 2
      const third = await agent.resource('lms_quiz_attempts').submitQuiz({ values: wrong }); // exceeds maxAttempts=2
      expect(third.status).toBe(403);
    });
  });
});
