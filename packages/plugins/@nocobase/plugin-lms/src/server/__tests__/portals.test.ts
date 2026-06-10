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
import { INSTRUCTOR_PORTAL, STUDENT_PORTAL } from '../portals/definitions';
import { seedPortal } from '../portals/seed-portals';

describe('instructor portal seeding', () => {
  let app: MockServer;
  let db: Database;

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
        'ui-schema-storage',
        'client',
        'lms',
      ],
    });
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('creates the instructor group route and one page per definition', async () => {
    const routes = db.getRepository('desktopRoutes');
    const group = await routes.findOne({ filter: { type: 'group', title: INSTRUCTOR_PORTAL.title } });
    expect(group).toBeTruthy();

    const pages = await routes.find({ filter: { type: 'page', parentId: group.get('id') } });
    expect(pages.length).toBe(INSTRUCTOR_PORTAL.pages.length);
  });

  it('inserts a uiSchema for each page route', async () => {
    const uiSchemas = db.getRepository<any>('uiSchemas');
    const courseSchema = await uiSchemas.findById('lms_instructor_courses_page').catch(() => null);
    expect(courseSchema).toBeTruthy();
  });

  it('seeds table columns for each page', async () => {
    const uiSchemas = db.getRepository<any>('uiSchemas');
    // First defined column of the instructor My Courses page
    const col = await uiSchemas.findOne({ filter: { 'x-uid': 'lms_instructor_courses_col_title' } });
    expect(col).toBeTruthy();
    expect(col.get('schema')['x-component']).toBe('TableV2.Column');

    const cell = await uiSchemas.findOne({ filter: { 'x-uid': 'lms_instructor_courses_cell_title' } });
    expect(cell.get('schema')['x-collection-field']).toBe('lms_courses.title');

    // Association column carries fieldNames pointing at the target label field
    const assocCell = await uiSchemas.findOne({ filter: { 'x-uid': 'lms_student_enrollments_cell_course' } });
    expect(assocCell.get('schema')['x-component-props'].fieldNames).toEqual({ label: 'title', value: 'id' });
  });

  it('creates a hidden tabs child route pointing at the page grid', async () => {
    const routes = db.getRepository('desktopRoutes');
    const page = await routes.findOne({ filter: { schemaUid: 'lms_instructor_courses_page' } });
    const tab = await routes.findOne({ filter: { type: 'tabs', parentId: page.get('id') } });
    expect(tab).toBeTruthy();
    expect(tab.get('schemaUid')).toBe('lms_instructor_courses_grid');
    expect(tab.get('tabSchemaName')).toBe('grid');
    expect(tab.get('hidden')).toBe(true);
  });

  it('binds each portal to its own role (instructor vs student are isolated)', async () => {
    const instructorRoutes = await db.getRepository('roles.desktopRoutes', 'instructor').find();
    // 1 group + N pages + N hidden tab routes
    expect(instructorRoutes.length).toBe(INSTRUCTOR_PORTAL.pages.length * 2 + 1);

    const studentRoutes = await db.getRepository('roles.desktopRoutes', 'student').find();
    expect(studentRoutes.length).toBe(STUDENT_PORTAL.pages.length * 2 + 1);

    // The instructor must not see the student catalog page, and vice versa
    const instructorTitles = instructorRoutes.map((r: any) => r.get('title'));
    expect(instructorTitles).not.toContain('Course Catalog');
    const studentTitles = studentRoutes.map((r: any) => r.get('title'));
    expect(studentTitles).toContain('Course Catalog');
    expect(studentTitles).not.toContain('Grading');
  });

  it('seeds both the instructor and student groups', async () => {
    const routes = db.getRepository('desktopRoutes');
    const instructor = await routes.findOne({ filter: { type: 'group', title: INSTRUCTOR_PORTAL.title } });
    const student = await routes.findOne({ filter: { type: 'group', title: STUDENT_PORTAL.title } });
    expect(instructor).toBeTruthy();
    expect(student).toBeTruthy();
  });

  it('is idempotent — re-seeding does not duplicate routes', async () => {
    const routes = db.getRepository('desktopRoutes');
    const before = await routes.count();
    await seedPortal(db, INSTRUCTOR_PORTAL);
    await seedPortal(db, INSTRUCTOR_PORTAL);
    const after = await routes.count();
    expect(after).toBe(before);
  });
});
