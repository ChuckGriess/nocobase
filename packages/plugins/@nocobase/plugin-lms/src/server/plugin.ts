/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { enroll } from './actions/enroll';
import { completeLesson } from './actions/complete-lesson';
import { submitQuiz } from './actions/submit-quiz';
import { seedPortal } from './portals/seed-portals';
import { INSTRUCTOR_PORTAL, STUDENT_PORTAL } from './portals/definitions';
import { seedWorkflows } from './workflows/seed-workflows';

// Collections are auto-loaded by the framework from `server/collections/`
// (Plugin.loadCollections), so they are not registered manually here.

/**
 * LMS role definitions.
 *
 * `snippets` uses the NocoBase ACL snippet system:
 *   - 'pm.*'            → Plugin manager access
 *   - 'ui.*'            → UI schema editor access
 *   - '!ui.*'           → Deny UI editor
 *   - 'pm'              → Plugin manager page
 */
const LMS_ROLES = [
  {
    name: 'instructor',
    title: 'Instructor',
    description: 'Can manage their own courses, modules, lessons, assignments, and view student progress.',
    default: false,
    hidden: false,
    allowConfigure: false,
    allowNewMenu: false,
    snippets: ['!ui.*', '!pm', '!pm.*'],
    strategy: { actions: ['view', 'create', 'update', 'destroy'] },
  },
  {
    name: 'student',
    title: 'Student',
    description: 'Can browse published courses, enroll, track progress, submit assignments, and take quizzes.',
    default: true,
    hidden: false,
    allowConfigure: false,
    allowNewMenu: false,
    snippets: ['!ui.*', '!pm', '!pm.*'],
    strategy: { actions: ['view'] },
  },
];

/**
 * Resource-level ACL rules installed on first run.
 * These define what each role can do on each LMS collection.
 */
const LMS_ACL_RESOURCES = [
  // ── Instructors ──────────────────────────────────────────────────────────
  {
    roleName: 'instructor',
    resource: 'lms_courses',
    actions: {
      list: { fields: [] },
      get: { fields: [] },
      create: { fields: [] },
      update: { filter: { createdById: '{{ ctx.state.currentUser.id }}' }, fields: [] },
      destroy: { filter: { createdById: '{{ ctx.state.currentUser.id }}' } },
    },
  },
  {
    roleName: 'instructor',
    resource: 'lms_modules',
    actions: {
      list: { fields: [] },
      get: { fields: [] },
      create: { fields: [] },
      update: { fields: [] },
      destroy: {},
    },
  },
  {
    roleName: 'instructor',
    resource: 'lms_lessons',
    actions: { list: { fields: [] }, get: { fields: [] }, create: { fields: [] }, update: { fields: [] }, destroy: {} },
  },
  {
    roleName: 'instructor',
    resource: 'lms_assignments',
    actions: { list: { fields: [] }, get: { fields: [] }, create: { fields: [] }, update: { fields: [] }, destroy: {} },
  },
  {
    roleName: 'instructor',
    resource: 'lms_submissions',
    actions: { list: { fields: [] }, get: { fields: [] }, update: { fields: [] } },
  },
  {
    roleName: 'instructor',
    resource: 'lms_quizzes',
    actions: { list: { fields: [] }, get: { fields: [] }, create: { fields: [] }, update: { fields: [] }, destroy: {} },
  },
  {
    roleName: 'instructor',
    resource: 'lms_quiz_questions',
    actions: { list: { fields: [] }, get: { fields: [] }, create: { fields: [] }, update: { fields: [] }, destroy: {} },
  },
  {
    roleName: 'instructor',
    resource: 'lms_enrollments',
    actions: { list: { fields: [] }, get: { fields: [] } },
  },
  {
    roleName: 'instructor',
    resource: 'lms_certificates',
    actions: { list: { fields: [] }, get: { fields: [] }, create: { fields: [] } },
  },
  {
    roleName: 'instructor',
    resource: 'lms_announcements',
    actions: { list: { fields: [] }, get: { fields: [] }, create: { fields: [] }, update: { fields: [] }, destroy: {} },
  },

  // ── Students ─────────────────────────────────────────────────────────────
  {
    roleName: 'student',
    resource: 'lms_courses',
    actions: {
      list: { filter: { status: 'published' }, fields: [] },
      get: { filter: { status: 'published' }, fields: [] },
    },
  },
  {
    roleName: 'student',
    resource: 'lms_modules',
    actions: { list: { fields: [] }, get: { fields: [] } },
  },
  {
    roleName: 'student',
    resource: 'lms_lessons',
    actions: { list: { fields: [] }, get: { fields: [] } },
  },
  {
    roleName: 'student',
    resource: 'lms_enrollments',
    actions: {
      list: { filter: { studentId: '{{ ctx.state.currentUser.id }}' }, fields: [] },
      get: { filter: { studentId: '{{ ctx.state.currentUser.id }}' }, fields: [] },
      enroll: {},
    },
  },
  {
    roleName: 'student',
    resource: 'lms_lesson_completions',
    actions: {
      list: { filter: { studentId: '{{ ctx.state.currentUser.id }}' }, fields: [] },
      completeLesson: {},
    },
  },
  {
    roleName: 'student',
    resource: 'lms_assignments',
    actions: { list: { fields: [] }, get: { fields: [] } },
  },
  {
    roleName: 'student',
    resource: 'lms_submissions',
    actions: {
      list: { filter: { studentId: '{{ ctx.state.currentUser.id }}' }, fields: [] },
      get: { filter: { studentId: '{{ ctx.state.currentUser.id }}' }, fields: [] },
      create: { fields: [] },
    },
  },
  {
    roleName: 'student',
    resource: 'lms_quizzes',
    actions: { list: { fields: [] }, get: { fields: [] } },
  },
  {
    roleName: 'student',
    resource: 'lms_quiz_attempts',
    actions: {
      list: { filter: { studentId: '{{ ctx.state.currentUser.id }}' }, fields: [] },
      submitQuiz: {},
    },
  },
  {
    roleName: 'student',
    resource: 'lms_certificates',
    actions: { list: { filter: { studentId: '{{ ctx.state.currentUser.id }}' }, fields: [] }, get: { fields: [] } },
  },
  {
    roleName: 'student',
    resource: 'lms_announcements',
    actions: { list: { filter: { isActive: true }, fields: [] }, get: { filter: { isActive: true }, fields: [] } },
  },
];

export class PluginLMSServer extends Plugin {
  async load() {
    // The `lms:seed-demo` CLI command is auto-loaded from server/commands/.

    // Custom actions
    this.app.resource({
      name: 'lms_enrollments',
      actions: { enroll },
    });

    this.app.resource({
      name: 'lms_lesson_completions',
      actions: { completeLesson },
    });

    this.app.resource({
      name: 'lms_quiz_attempts',
      actions: { submitQuiz },
    });

    // Make custom actions available to ACL
    this.app.acl.allow('lms_enrollments', 'enroll', 'loggedIn');
    this.app.acl.allow('lms_lesson_completions', 'completeLesson', 'loggedIn');
    this.app.acl.allow('lms_quiz_attempts', 'submitQuiz', 'loggedIn');
  }

  async install() {
    await this.seedRoles();
    await this.seedAclResources();
    await this.seedPortals();
    await seedWorkflows(this.db);
  }

  async upgrade() {
    // Re-apply ACL + portal + workflow scaffolding on upgrade (all idempotent)
    await this.seedAclResources();
    await this.seedPortals();
    await seedWorkflows(this.db);
  }

  private async seedPortals() {
    await seedPortal(this.db, INSTRUCTOR_PORTAL);
    await seedPortal(this.db, STUDENT_PORTAL);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ────────────────────────────────────────────────────────────────────────

  private async seedRoles() {
    const rolesRepo = this.db.getRepository('roles');

    for (const roleDef of LMS_ROLES) {
      const exists = await rolesRepo.findOne({ filter: { name: roleDef.name } });
      if (!exists) {
        await rolesRepo.create({ values: roleDef });
        this.app.log.info(`[plugin-lms] Created role: ${roleDef.name}`);
      }
    }
  }

  private async seedAclResources() {
    const resourceRepo = this.db.getRepository('dataSourcesRolesResources');
    const actionRepo = this.db.getRepository('dataSourcesRolesResourcesActions');
    const scopeRepo = this.db.getRepository('dataSourcesRolesResourcesScopes');

    for (const def of LMS_ACL_RESOURCES) {
      let resource = await resourceRepo.findOne({
        filter: { roleName: def.roleName, name: def.resource, dataSourceKey: 'main' },
      });

      if (!resource) {
        resource = await resourceRepo.create({
          values: {
            roleName: def.roleName,
            name: def.resource,
            dataSourceKey: 'main',
            usingActionsConfig: true,
          },
        });
      }

      for (const [actionName, actionConfig] of Object.entries(def.actions)) {
        const existingAction = await actionRepo.findOne({
          filter: { rolesResourceId: resource.get('id'), name: actionName },
        });
        if (existingAction) {
          continue;
        }

        // A row-level filter is stored in a Scope record (the ACL reads
        // scope.scope as the action filter); `fields` lives on the action.
        const { filter, fields } = actionConfig as { filter?: Record<string, unknown>; fields?: string[] };
        let scopeId: number | undefined;
        if (filter) {
          const scope = await scopeRepo.create({
            values: {
              dataSourceKey: 'main',
              resourceName: def.resource,
              name: `lms:${def.roleName}:${def.resource}:${actionName}`,
              scope: filter,
            },
          });
          scopeId = scope.get('id') as number;
        }

        await actionRepo.create({
          values: {
            rolesResourceId: resource.get('id'),
            name: actionName,
            fields: fields ?? [],
            ...(scopeId ? { scopeId } : {}),
          },
        });
      }
    }

    this.app.log.info('[plugin-lms] ACL resources seeded');
  }
}
