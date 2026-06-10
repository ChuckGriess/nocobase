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
import { LMS_WORKFLOWS, seedWorkflows } from '../workflows/seed-workflows';

describe('LMS workflows', () => {
  let app: MockServer;
  let db: Database;
  let agent: ReturnType<MockServer['agent']>;
  let user: any;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: [
        'field-sort',
        'users',
        'auth',
        'acl',
        'data-source-manager',
        'system-settings',
        'workflow',
        'workflow-notification',
        'lms',
      ],
    });
    db = app.db;
    user = await db.getRepository('users').findOne({ appends: ['roles'] });
    agent = app.agent();
    await agent.login(user);
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('seeds all five LMS workflows, enabled flags as defined', async () => {
    const workflows = await db.getRepository('workflows').find({ filter: { key: { $like: 'lms_%' } } });
    expect(workflows.length).toBe(LMS_WORKFLOWS.length);

    const certWf = workflows.find((w: any) => w.get('key') === 'lms_completion_certificate');
    expect(certWf.get('enabled')).toBe(true);
    expect(certWf.get('sync')).toBe(true);

    const overdue = workflows.find((w: any) => w.get('key') === 'lms_overdue_reminder');
    expect(overdue.get('enabled')).toBe(false); // schedule shell, disabled until completed in UI
  });

  it('is idempotent — re-seeding does not duplicate workflows or nodes', async () => {
    const wfRepo = db.getRepository('workflows');
    const nodeRepo = db.getRepository('flow_nodes');
    const wfBefore = await wfRepo.count();
    const nodesBefore = await nodeRepo.count();

    await seedWorkflows(db);
    await seedWorkflows(db);

    expect(await wfRepo.count()).toBe(wfBefore);
    expect(await nodeRepo.count()).toBe(nodesBefore);
  });

  it('issues a certificate automatically when an enrollment completes', async () => {
    // Build a published course with one module + two lessons
    const course = await db.getRepository('lms_courses').create({
      values: { title: 'WF Course', status: 'published', instructorId: user.id },
    });
    const module = await db.getRepository('lms_modules').create({
      values: { title: 'M1', courseId: course.get('id'), status: 'published' },
    });
    const lessons = await Promise.all(
      [0, 1].map((i) =>
        db
          .getRepository('lms_lessons')
          .create({ values: { title: `L${i}`, moduleId: module.get('id'), type: 'text' } }),
      ),
    );

    const enrollment = (await agent.resource('lms_enrollments').enroll({ values: { courseId: course.get('id') } })).body
      .data;

    // No certificate yet
    expect(await db.getRepository('lms_certificates').count({ filter: { enrollmentId: enrollment.id } })).toBe(0);

    // Complete every lesson — the last one flips the enrollment to "completed",
    // which (sync workflow) creates the certificate.
    for (const lesson of lessons) {
      await agent
        .resource('lms_lesson_completions')
        .completeLesson({ values: { lessonId: lesson.get('id'), enrollmentId: enrollment.id } });
    }

    const certificates = await db.getRepository('lms_certificates').find({ filter: { enrollmentId: enrollment.id } });
    expect(certificates.length).toBe(1);
    const cert = certificates[0];
    expect(cert.get('studentId')).toBe(user.id);
    expect(cert.get('courseId')).toBe(course.get('id'));
    expect(cert.get('issuedAt')).toBeTruthy(); // defaultToCurrentTime
    expect(cert.get('certificateNumber')).toMatch(/^CERT-/);
  });
});
