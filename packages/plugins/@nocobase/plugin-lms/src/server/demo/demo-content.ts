/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type Database from '@nocobase/database';

/**
 * Seeds realistic demo content for evaluating the LMS:
 *   - a Demo Instructor and Demo Student (with the seeded roles + known passwords)
 *   - three courses (two published, one draft) with modules, lessons, a quiz, and
 *     an assignment.
 *
 * Idempotent: keyed on the first course's slug. Safe to re-run.
 * This is evaluation data — it is NOT run on install; trigger it explicitly via
 * the `lms:seed-demo` CLI command.
 */
export async function seedDemoContent(db: Database): Promise<{ skipped: boolean }> {
  const coursesRepo = db.getRepository('lms_courses');

  const marker = await coursesRepo.findOne({ filter: { slug: 'demo-intro-nocobase' } });
  if (marker) {
    return { skipped: true };
  }

  const instructor = await ensureUser(db, {
    username: 'instructor',
    email: 'instructor@lms.dev',
    nickname: 'Demo Instructor',
    password: 'instructor123',
    role: 'instructor',
  });
  const student = await ensureUser(db, {
    username: 'student',
    email: 'student@lms.dev',
    nickname: 'Demo Student',
    password: 'student123',
    role: 'student',
  });

  const instructorId = instructor.get('id') as number;

  // ── Course 1: Introduction to NocoBase (published) ───────────────────────
  const intro = await coursesRepo.create({
    values: {
      title: 'Introduction to NocoBase',
      slug: 'demo-intro-nocobase',
      status: 'published',
      category: 'Fundamentals',
      durationMinutes: 90,
      description: 'A hands-on tour of NocoBase: collections, blocks, and the admin UI.',
      instructorId,
      modules: [
        {
          title: 'Getting Started',
          sort: 1,
          status: 'published',
          lessons: [
            {
              title: 'What is NocoBase?',
              type: 'video',
              sort: 1,
              durationMinutes: 8,
              videoUrl: 'https://example.com/intro.mp4',
            },
            {
              title: 'Installation & First Run',
              type: 'text',
              sort: 2,
              durationMinutes: 12,
              content: 'Install with yarn, configure your database, and start the dev server.',
            },
          ],
        },
        {
          title: 'Working with Collections',
          sort: 2,
          status: 'published',
          lessons: [
            {
              title: 'Defining Collections',
              type: 'text',
              sort: 1,
              durationMinutes: 15,
              content: 'Collections are your data tables. Define fields, types, and indexes.',
            },
            {
              title: 'Relationships',
              type: 'text',
              sort: 2,
              durationMinutes: 15,
              content: 'Model belongsTo, hasMany, and belongsToMany relationships between collections.',
            },
          ],
        },
      ],
    },
  });

  // Quiz for course 1 + questions
  const introQuiz = await db.getRepository('lms_quizzes').create({
    values: {
      title: 'Collections Knowledge Check',
      description: 'Verify your understanding of NocoBase collections.',
      passingScore: 70,
      maxAttempts: 3,
      courseId: intro.get('id'),
      questions: [
        {
          question: 'Which relationship type links one record to many?',
          type: 'multiple_choice',
          options: [
            { label: 'belongsTo', value: 'belongsTo' },
            { label: 'hasMany', value: 'hasMany' },
            { label: 'hasOne', value: 'hasOne' },
          ],
          correctAnswer: 'hasMany',
          points: 1,
          sort: 1,
        },
        {
          question: 'A collection in NocoBase maps to a database table.',
          type: 'true_false',
          correctAnswer: 'true',
          points: 1,
          sort: 2,
        },
      ],
    },
  });

  // Assignment for course 1
  await db.getRepository('lms_assignments').create({
    values: {
      title: 'Build Your First Collection',
      description: 'Create a "books" collection with title, author, and publishedAt fields.',
      instructions: 'Submit a screenshot of your collection schema and a short note on the field types you chose.',
      maxScore: 100,
      sort: 1,
      courseId: intro.get('id'),
    },
  });

  // ── Course 2: Advanced Workflows (published) ─────────────────────────────
  const workflows = await coursesRepo.create({
    values: {
      title: 'Automating with Workflows',
      slug: 'demo-advanced-workflows',
      status: 'published',
      category: 'Automation',
      durationMinutes: 75,
      description: 'Build automations using collection and schedule triggers.',
      instructorId,
      modules: [
        {
          title: 'Triggers',
          sort: 1,
          status: 'published',
          lessons: [
            {
              title: 'Collection Event Triggers',
              type: 'text',
              sort: 1,
              durationMinutes: 20,
              content: 'Fire workflows on create, update, or destroy events.',
            },
            {
              title: 'Schedule Triggers',
              type: 'text',
              sort: 2,
              durationMinutes: 20,
              content: 'Run workflows on a cron schedule or off a date field.',
            },
          ],
        },
      ],
    },
  });

  await db.getRepository('lms_assignments').create({
    values: {
      title: 'Automate a Notification',
      description: 'Create a workflow that notifies a user when a record is created.',
      maxScore: 100,
      sort: 1,
      courseId: workflows.get('id'),
    },
  });

  // ── Course 3: Draft (unpublished — should be hidden from students) ───────
  await coursesRepo.create({
    values: {
      title: 'Plugin Development (Coming Soon)',
      slug: 'demo-plugin-dev',
      status: 'draft',
      category: 'Advanced',
      description: 'Work in progress — not yet visible to students.',
      instructorId,
    },
  });

  // A published announcement + an enrollment so the student portal has content
  await db.getRepository('lms_announcements').create({
    values: {
      title: 'Welcome to the Learning Center',
      content: 'New courses are now available. Browse the catalog to enroll.',
      isActive: true,
      publishedAt: new Date(),
      authorId: instructorId,
    },
  });

  await db.getRepository('lms_enrollments').create({
    values: {
      studentId: student.get('id'),
      courseId: intro.get('id'),
      status: 'active',
      enrolledAt: new Date(),
      progressPercent: 0,
    },
  });

  void introQuiz;
  return { skipped: false };
}

async function ensureUser(
  db: Database,
  opts: { username: string; email: string; nickname: string; password: string; role: string },
) {
  const usersRepo = db.getRepository('users');
  const existing = await usersRepo.findOne({ filter: { email: opts.email } });
  if (existing) {
    return existing;
  }
  return usersRepo.create({
    values: {
      username: opts.username,
      email: opts.email,
      nickname: opts.nickname,
      password: opts.password,
      roles: [opts.role],
    },
  });
}
