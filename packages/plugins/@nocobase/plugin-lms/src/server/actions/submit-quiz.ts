/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context, Next } from '@nocobase/actions';

interface QuizAnswer {
  questionId: number;
  answer: string | string[];
}

/**
 * POST /api/lms_quiz_attempts:submitQuiz
 * Body: { quizId, enrollmentId, answers: QuizAnswer[], startedAt }
 *
 * Grades the quiz, records the attempt, and returns score + pass/fail.
 */
export async function submitQuiz(ctx: Context, next: Next) {
  const { quizId, enrollmentId, answers, startedAt } =
    ctx.action.params.values ??
    (ctx.request.body as { quizId: number; enrollmentId: number; answers: QuizAnswer[]; startedAt?: string });

  const currentUser = ctx.state.currentUser;
  if (!currentUser) ctx.throw(401, 'Authentication required');
  if (!quizId || !enrollmentId || !Array.isArray(answers)) {
    ctx.throw(400, 'quizId, enrollmentId, and answers are required');
  }

  const db = ctx.db;
  const quizRepo = db.getRepository('lms_quizzes');
  const questionRepo = db.getRepository('lms_quiz_questions');
  const attemptRepo = db.getRepository('lms_quiz_attempts');
  const enrollmentRepo = db.getRepository('lms_enrollments');

  // Verify enrollment
  const enrollment = await enrollmentRepo.findOne({
    filter: { id: enrollmentId, studentId: currentUser.id, status: 'active' },
  });
  if (!enrollment) ctx.throw(403, 'Active enrollment not found');

  // Fetch quiz + its passing score
  const quiz = await quizRepo.findOne({ filter: { id: quizId } });
  if (!quiz) ctx.throw(404, 'Quiz not found');

  // Check attempt limits
  const maxAttempts = (quiz.get('maxAttempts') as number) ?? 3;
  const attemptCount = await attemptRepo.count({ filter: { quizId, enrollmentId } });
  if (attemptCount >= maxAttempts) {
    ctx.throw(403, `Maximum attempts (${maxAttempts}) reached`);
  }

  // Load questions and grade
  const questions = await questionRepo.find({ filter: { quizId } });
  let earnedPoints = 0;
  let totalPoints = 0;
  const gradedAnswers: Record<number, { correct: boolean; earnedPoints: number }> = {};

  for (const question of questions) {
    const qId = question.get('id') as number;
    const qType = question.get('type') as string;
    const correctAnswer = question.get('correctAnswer') as string;
    const points = (question.get('points') as number) ?? 1;
    totalPoints += points;

    const submitted = answers.find((a) => a.questionId === qId);
    if (!submitted) {
      gradedAnswers[qId] = { correct: false, earnedPoints: 0 };
      continue;
    }

    let isCorrect = false;
    if (qType === 'multiple_choice' || qType === 'true_false') {
      isCorrect = String(submitted.answer).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase();
    } else if (qType === 'short_answer') {
      // Short-answer grading: case-insensitive contains match
      isCorrect = String(submitted.answer).trim().toLowerCase().includes(String(correctAnswer).trim().toLowerCase());
    }

    const earned = isCorrect ? points : 0;
    earnedPoints += earned;
    gradedAnswers[qId] = { correct: isCorrect, earnedPoints: earned };
  }

  const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passingScore = (quiz.get('passingScore') as number) ?? 70;
  const passed = scorePercent >= passingScore;

  const attempt = await attemptRepo.create({
    values: {
      quizId,
      enrollmentId,
      studentId: currentUser.id,
      answers: gradedAnswers,
      score: scorePercent,
      passed,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      completedAt: new Date(),
    },
  });

  ctx.body = { attemptId: attempt.get('id'), score: scorePercent, passed, gradedAnswers };
  return next();
}
