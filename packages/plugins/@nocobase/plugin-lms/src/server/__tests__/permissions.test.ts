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

describe('LMS roles & ACL seeding', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: ['field-sort', 'users', 'auth', 'acl', 'data-source-manager', 'system-settings', 'lms'],
    });
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('seeds the instructor and student roles', async () => {
    const roles = db.getRepository('roles');
    expect(await roles.findOne({ filter: { name: 'instructor' } })).toBeTruthy();
    const student = await roles.findOne({ filter: { name: 'student' } });
    expect(student).toBeTruthy();
    expect(student.get('default')).toBe(true); // new SSO users land here
  });

  // The row-level filter is stored on the linked scope record (scope.scope),
  // which the ACL reads as the action filter.
  const getActionScope = async (roleName: string, resourceName: string, actionName: string) => {
    const resource = await db
      .getRepository('dataSourcesRolesResources')
      .findOne({ filter: { roleName, name: resourceName } });
    expect(resource).toBeTruthy();
    const action = await db
      .getRepository('dataSourcesRolesResourcesActions')
      .findOne({ filter: { rolesResourceId: resource.get('id'), name: actionName }, appends: ['scope'] });
    expect(action).toBeTruthy();
    return action.get('scope') as { scope?: Record<string, unknown> } | null;
  };

  it('restricts students to published courses and their own enrollments', async () => {
    const coursesListScope = await getActionScope('student', 'lms_courses', 'list');
    expect(coursesListScope?.scope).toMatchObject({ status: 'published' });

    const enrollListScope = await getActionScope('student', 'lms_enrollments', 'list');
    expect(JSON.stringify(enrollListScope?.scope)).toContain('currentUser.id');
  });

  it('restricts instructors to updating their own courses', async () => {
    const updateScope = await getActionScope('instructor', 'lms_courses', 'update');
    expect(JSON.stringify(updateScope?.scope)).toContain('currentUser.id');
  });
});
