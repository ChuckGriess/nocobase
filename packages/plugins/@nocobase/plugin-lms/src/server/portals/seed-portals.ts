/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type Database from '@nocobase/database';
import { buildTableBlockPage, ColumnDef } from './schema-builders';

export interface PortalPage {
  /** Stable key — drives deterministic schema x-uids (idempotency). */
  key: string;
  title: string;
  icon?: string;
  collection: string;
  /** Table columns seeded on the page (further configurable in the visual editor). */
  columns?: ColumnDef[];
}

export interface PortalGroup {
  key: string;
  title: string;
  icon?: string;
  /** Role that should see this portal's menu. */
  roleName: string;
  pages: PortalPage[];
}

/**
 * Seed a portal: a desktopRoutes group with table-block pages, each backed by a
 * uiSchema, all bound to `group.roleName`. Idempotent — existing records (matched
 * by page schemaUid / group title) are left untouched, and only newly created
 * routes are bound to the role so re-runs never duplicate.
 *
 * No-ops when the desktopRoutes collection is absent (headless/API-only apps).
 */
export async function seedPortal(db: Database, group: PortalGroup): Promise<void> {
  if (!db.hasCollection('desktopRoutes')) {
    return;
  }

  const routesRepo = db.getRepository('desktopRoutes');
  const uiSchemas = db.getRepository<any>('uiSchemas');
  const newlyCreatedRouteIds: Array<number | string> = [];

  // ── Group route ────────────────────────────────────────────────────────────
  let groupRoute = await routesRepo.findOne({
    filter: { type: 'group', title: group.title, parentId: null },
  });
  if (!groupRoute) {
    groupRoute = await routesRepo.create({
      values: { type: 'group', title: group.title, icon: group.icon ?? 'AppstoreOutlined', hideInMenu: false },
    });
    newlyCreatedRouteIds.push(groupRoute.get('id') as number);
  }

  // ── Page routes ──────────────────────────────────────────────────────────
  let sort = 0;
  for (const page of group.pages) {
    sort += 1;
    const { schema, pageUid, tabUid, tabSchemaName, blockUid, firstColumnUid } = buildTableBlockPage({
      key: page.key,
      collection: page.collection,
      columns: page.columns,
    });

    const existing = await routesRepo.findOne({ filter: { schemaUid: pageUid } });
    if (existing) {
      // Repair pass: pages seeded without the hidden `tabs` child route render
      // an empty body (PageContent reads children[0].schemaUid).
      const existingTab = await routesRepo.findOne({
        filter: { type: 'tabs', parentId: existing.get('id') },
      });
      if (!existingTab) {
        const tabRoute = await routesRepo.create({
          values: {
            type: 'tabs',
            schemaUid: tabUid,
            tabSchemaName,
            parentId: existing.get('id'),
            hidden: true,
          },
        });
        newlyCreatedRouteIds.push(tabRoute.get('id') as number);
      }

      // Repair pass: re-insert pages whose table block predates the current
      // block shape (marked by `x-use-decorator-props`) — the old shape
      // renders an empty column — or that were seeded before columns existed.
      const blockRow = await uiSchemas.findOne({ filter: { 'x-uid': blockUid } });
      const blockNode = blockRow?.get('schema') as Record<string, unknown> | undefined;
      const staleBlock = blockNode && !blockNode['x-use-decorator-props'];
      const missingColumns =
        blockNode && firstColumnUid && !(await uiSchemas.findOne({ filter: { 'x-uid': firstColumnUid } }));
      if (staleBlock || missingColumns) {
        await uiSchemas.remove(pageUid);
        await uiSchemas.insert(schema);
      }
      continue;
    }

    // Insert the page UI schema (guarded — insert is a no-op-safe if already present)
    const hasSchema = await uiSchemas.findById?.(pageUid).catch?.(() => null);
    if (!hasSchema) {
      await uiSchemas.insert(schema);
    }

    const pageRoute = await routesRepo.create({
      values: {
        type: 'page',
        title: page.title,
        icon: page.icon ?? 'FileOutlined',
        schemaUid: pageUid,
        menuSchemaUid: `${pageUid}_menu`,
        parentId: groupRoute.get('id'),
        sort,
        enableTabs: false,
        enableHeader: true,
        displayTitle: true,
        hideInMenu: false,
      },
    });
    newlyCreatedRouteIds.push(pageRoute.get('id') as number);

    // Hidden tab route — the page body renders this tab's schema (the grid).
    const tabRoute = await routesRepo.create({
      values: {
        type: 'tabs',
        schemaUid: tabUid,
        tabSchemaName,
        parentId: pageRoute.get('id'),
        hidden: true,
      },
    });
    newlyCreatedRouteIds.push(tabRoute.get('id') as number);
  }

  // ── Bind newly created routes to the role ────────────────────────────────
  if (newlyCreatedRouteIds.length > 0 && db.hasCollection('roles')) {
    const roleRoutesRepo = db.getRepository('roles.desktopRoutes', group.roleName);
    await roleRoutesRepo.add(newlyCreatedRouteIds);
  }
}
