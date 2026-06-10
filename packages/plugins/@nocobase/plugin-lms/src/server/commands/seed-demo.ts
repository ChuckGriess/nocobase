/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/server';
import { seedDemoContent } from '../demo/demo-content';

/**
 * CLI: `yarn nocobase lms:seed-demo`
 * Populates idempotent evaluation content (demo users, courses, modules,
 * lessons, a quiz, assignments). Auto-loaded from server/commands/.
 */
export default function (app: Application) {
  app
    .command('lms:seed-demo')
    .preload()
    .action(async () => {
      const result = await seedDemoContent(app.db);
      app.log.info(
        result.skipped ? '[plugin-lms] demo content already present — skipped' : '[plugin-lms] demo content seeded',
      );
    });
}
