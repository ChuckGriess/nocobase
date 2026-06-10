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
 * LMS automation workflows, seeded as `workflows` + `flow_nodes` records.
 *
 * Notes:
 * - The "completion → certificate" workflow is `sync` so the certificate exists
 *   immediately when an enrollment flips to `completed`. Its create node runs
 *   first, so certificate issuance never depends on notification delivery.
 * - Notification nodes use `ignoreFail: true` and a channel name configured in
 *   Notification Manager. Until a channel exists they are inert — they never
 *   break the core automation. Configure email/in-app channels per docs §8.
 * - Collection-update triggers use `changed: ['status']` so they only fire on a
 *   real status transition (avoids duplicate certificates / repeat notifications).
 */

interface NodeDef {
  type: string;
  title: string;
  config: Record<string, unknown>;
}

interface WorkflowDef {
  key: string;
  title: string;
  type: 'collection' | 'schedule';
  enabled: boolean;
  sync?: boolean;
  config: Record<string, unknown>;
  nodes: NodeDef[];
}

const inAppNotification = (title: string, content: string): NodeDef => ({
  type: 'notification',
  title,
  config: { channelName: 'in-app-message', ignoreFail: true, content },
});

export const LMS_WORKFLOWS: WorkflowDef[] = [
  // 1. Welcome notification when a student enrolls
  {
    key: 'lms_enrollment_welcome',
    title: 'LMS: Enrollment welcome',
    type: 'collection',
    enabled: true,
    config: {
      collection: 'lms_enrollments',
      mode: 1, // after create
      appends: ['student', 'course'],
      condition: { $and: [{ status: { $eq: 'active' } }] },
    },
    nodes: [inAppNotification('Notify student', 'Welcome! You are now enrolled in {{$context.data.course.title}}.')],
  },

  // 2. Issue a certificate when an enrollment completes (keystone automation)
  {
    key: 'lms_completion_certificate',
    title: 'LMS: Completion → certificate',
    type: 'collection',
    enabled: true,
    sync: true,
    config: {
      collection: 'lms_enrollments',
      mode: 2, // after update
      changed: ['status'],
      appends: ['student', 'course'],
      condition: { $and: [{ status: { $eq: 'completed' } }] },
    },
    nodes: [
      {
        type: 'create',
        title: 'Create certificate',
        config: {
          collection: 'lms_certificates',
          params: {
            values: {
              enrollmentId: '{{$context.data.id}}',
              studentId: '{{$context.data.studentId}}',
              courseId: '{{$context.data.courseId}}',
            },
          },
        },
      },
      inAppNotification(
        'Notify student',
        'Congratulations! Your certificate for {{$context.data.course.title}} has been issued.',
      ),
    ],
  },

  // 3. Notify the instructor when a student submits an assignment
  {
    key: 'lms_submission_instructor',
    title: 'LMS: Submission → instructor',
    type: 'collection',
    enabled: true,
    config: {
      collection: 'lms_submissions',
      mode: 1, // after create
      appends: ['assignment', 'student'],
    },
    nodes: [
      inAppNotification('Notify instructor', 'New submission for "{{$context.data.assignment.title}}" awaits grading.'),
    ],
  },

  // 4. Notify the student when their submission is graded
  {
    key: 'lms_graded_student',
    title: 'LMS: Graded → student',
    type: 'collection',
    enabled: true,
    config: {
      collection: 'lms_submissions',
      mode: 2, // after update
      changed: ['status'],
      appends: ['student', 'assignment'],
      condition: { $and: [{ status: { $eq: 'graded' } }] },
    },
    nodes: [
      inAppNotification(
        'Notify student',
        'Your submission for "{{$context.data.assignment.title}}" was graded: {{$context.data.score}}.',
      ),
    ],
  },

  // 5. Daily overdue-assignment reminder (schedule shell — refine query/loop in UI).
  //    Seeded disabled so it doesn't fire an incomplete flow; enable after adding
  //    the query + loop nodes per docs §8.5.
  {
    key: 'lms_overdue_reminder',
    title: 'LMS: Overdue assignment reminder',
    type: 'schedule',
    enabled: false,
    config: {
      mode: 0, // static cron schedule
      cron: '0 8 * * *', // daily at 08:00
    },
    nodes: [],
  },
];

/**
 * Idempotently seed the LMS workflows. No-ops when the workflow plugin is absent.
 */
export async function seedWorkflows(db: Database): Promise<void> {
  if (!db.hasCollection('workflows')) {
    return;
  }

  const workflowsRepo = db.getRepository('workflows');

  for (const def of LMS_WORKFLOWS) {
    const existing = await workflowsRepo.findOne({ filter: { key: def.key } });
    if (existing) {
      continue;
    }

    const workflow = await workflowsRepo.create({
      values: {
        key: def.key,
        title: def.title,
        type: def.type,
        enabled: def.enabled,
        sync: def.sync ?? false,
        current: true,
        config: def.config,
      },
    });

    // Build a linear node chain (each node downstream of the previous one)
    let upstreamId: number | null = null;
    for (const node of def.nodes) {
      const created = await (workflow as any).createNode({
        type: node.type,
        title: node.title,
        config: node.config,
        upstreamId,
      });
      upstreamId = created.id;
    }
  }
}
