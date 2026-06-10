# LMS Setup & Operations Guide

This guide covers every step to go from a fresh checkout to a running, production-ready Learning Management System on Railway.

---

## Table of Contents

1. [Plugin Registration](#1-plugin-registration)
2. [Azure AD App Registration](#2-azure-ad-app-registration)
3. [Local Development](#3-local-development)
4. [Railway Deployment](#4-railway-deployment)
5. [Post-Deploy: Configure OIDC in NocoBase](#5-post-deploy-configure-oidc-in-nocobase)
6. [Building the Instructor Portal (UI)](#6-building-the-instructor-portal-ui)
7. [Building the Student Portal (UI)](#7-building-the-student-portal-ui)
8. [Workflow Automation Setup](#8-workflow-automation-setup)
9. [Roles & Permissions Reference](#9-roles--permissions-reference)
10. [Data Model Reference](#10-data-model-reference)

---

## 1. Plugin Registration

Both plugins live under `packages/plugins/@nocobase/` and are **auto-discovered**
by NocoBase (they show up in the Plugin Manager). They are **auto-enabled** on
install/upgrade when listed in the `APPEND_PRESET_BUILT_IN_PLUGINS` environment
variable (the dependency plugins — workflow, data-visualization,
notification-manager, etc. — are already built in):

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-lms,@nocobase/plugin-auth-oidc
```

This is already set in `deploy/railway/.env.example` and the local compose file.
Alternatively, enable them by hand in **Settings → Plugin Manager**.

After enabling, run (also runs automatically on container start):
```bash
yarn nocobase upgrade   # syncs the 12 new collections + indexes, seeds roles/ACL
```

> First-time local linking: because these are new workspace packages, run
> `yarn install` once so they are symlinked into `node_modules/@nocobase/`.

---

## 2. Azure AD App Registration

1. Sign in to the [Azure Portal](https://portal.azure.com).
2. Navigate to **Microsoft Entra ID → App registrations → New registration**.
3. Fill in:
   - **Name**: `NocoBase LMS`
   - **Supported account types**: *Accounts in this organizational directory only* (single tenant) or *Any Azure AD directory* (multi-tenant)
   - **Redirect URI**: `Web` → `https://your-app.up.railway.app/api/auth:redirect?authenticator=azure-ad`
     - For local dev add: `http://localhost:13000/api/auth:redirect?authenticator=azure-ad`
4. Click **Register**. Note the **Application (client) ID** and **Directory (tenant) ID**.
5. Go to **Certificates & secrets → New client secret**. Copy the secret value immediately.
6. Go to **Token configuration → Add optional claim** → ID token → add `email`, `preferred_username`.
7. Go to **API permissions** → confirm `openid`, `profile`, `email` (Microsoft Graph delegated) are listed. Click **Grant admin consent**.

Keep these four values for step 5:
| Variable | Where to find it |
|---|---|
| `clientId` | App registration Overview |
| `clientSecret` | Certificates & Secrets |
| `tenantId` | App registration Overview |
| `issuerUrl` | `https://login.microsoftonline.com/{tenantId}/v2.0` |

---

## 3. Local Development

```bash
# 1. Clone and install
git clone <repo-url> && cd nocobase
yarn install

# 2. Configure environment
cp deploy/railway/.env.example .env
# Edit .env — at minimum set APP_KEY and DB_* values

# 3. Start (full dev mode with hot-reload)
yarn dev

# OR use the Docker Compose stack (includes Postgres)
docker compose -f deploy/railway/docker-compose.lms.yml up
```

The app will be available at **http://localhost:13000**.

---

## 4. Railway Deployment

### 4.1 Create the Railway project

```bash
# Install the Railway CLI
npm install -g @railway/cli
railway login
railway init          # creates a new project
```

### 4.2 Add PostgreSQL

In the Railway dashboard: **New Service → Database → PostgreSQL**.
Railway will automatically inject `DATABASE_URL` into your app service.

### 4.3 Add a Volume (persistent uploads)

In the Railway dashboard: **your app service → Volumes → Add Volume**.
Set the mount path to `/app/storage`.

### 4.4 Configure environment variables

In the Railway dashboard: **your app service → Variables → RAW Editor** and paste:

```
APP_ENV=production
APP_PORT=13000
APP_KEY=<output of: openssl rand -hex 32>
APP_URL=https://<your-app>.up.railway.app
STORAGE_PATH=/app/storage
LOGGER_LEVEL=info
```

Leave `DATABASE_URL` as-is (Railway injects it automatically).

### 4.5 Deploy

```bash
railway up            # builds and deploys using deploy/railway/Dockerfile
```

Or connect your GitHub repo in the Railway dashboard for automatic deployments on push.

---

## 5. Post-Deploy: Configure OIDC in NocoBase

1. Log in to the NocoBase admin UI with the default admin credentials.
2. Go to **Settings → Auth → Add authenticator**.
3. Choose type **OIDC**.
4. Fill in:
   | Field | Value |
   |---|---|
   | Name | `azure-ad` *(must match the `?authenticator=` value in the redirect URI)* |
   | Title | `Sign in with Microsoft` |
   | Issuer URL | `https://login.microsoftonline.com/{tenantId}/v2.0` |
   | Client ID | your Azure App client ID |
   | Client Secret | your Azure App client secret |
   | App URL | `https://your-app.up.railway.app` |
   | Scope | `openid profile email` |
5. Save and enable.

The "Sign in with Microsoft" button now appears on the login page.

### 5.1 How the SSO flow works (for reference)

1. The login button calls `GET /api/auth:getAuthUrl?authenticator=azure-ad`, which
   generates `state` + `nonce` + a PKCE verifier, stores them server-side (10-min
   TTL), and returns the Entra ID authorization URL.
2. After the user authenticates, Entra ID redirects to
   `GET /api/auth:redirect?authenticator=azure-ad&code=…&state=…`.
3. The server verifies `state`, `nonce`, PKCE, and the `id_token`
   (issuer/audience/expiry/signature — all validated by `openid-client`), then
   upserts the user (matched by external `sub`, then email) and issues a JWT.
4. The browser is redirected to `${APP_URL}/?authenticator=azure-ad&token=<jwt>`;
   the NocoBase client `AuthProvider` reads the token and establishes the session.
5. New users automatically receive the default `student` role.

### 5.2 Production hardening notes

- **Healthcheck path**: NocoBase responds `200 ok` to any path ending in
  `/__health_check`. `railway.toml` is configured for `/__health_check`. There is
  no `/api/health` route — do not use it.
- **Multi-replica caveat**: the transient login state is held in an in-memory
  cache. If you scale beyond one replica, either keep `numReplicas = 1`
  (default), enable sticky sessions, or switch the OIDC cache to a Redis store
  so the `getAuthUrl` and `redirect` requests can land on different instances.
- **Migration to the official plugin**: NocoBase's commercial edition ships a
  maintained `@nocobase/plugin-auth-oidc` (plus SAML/CAS). To migrate: clone the
  pro plugin under `packages/pro-plugins/`, disable this custom plugin, enable the
  pro one, and recreate the `azure-ad` authenticator record (the
  `usersAuthenticators` mappings keyed by `sub` remain valid). No data migration
  of LMS collections is required.

---

## 6. Building the Instructor Portal (UI)

> **Auto-seeded**: the plugin's `install()`/`upgrade()` already creates the
> "Instructor Portal" menu group and its pages (My Courses, Assignments,
> Enrollments, Grading, Announcements) as `desktopRoutes` + `uiSchemas`, bound to
> the `instructor` role. Each page ships a Table block bound to the right
> collection. **The remaining manual step** is to add columns, item actions
> (Edit/Delete/Grade), and drill-down detail pages in the visual editor —
> described below. The role bindings mean instructors only see this group.

### 6.1 Create an "Instructor" menu group *(already seeded — skip)*

**UI Editor → Add menu item → Group** → "Instructor Portal"

### 6.2 Course Management page

- **Add page** → "My Courses"
- **Add block** → Table → Collection: `lms_courses`
  - Fields to show: `title`, `status`, `instructor`, `durationMinutes`, `createdAt`
  - Filter: `createdById = {{$user.id}}`
  - Actions: View, Edit, Delete, **+ Add course**
- **Add a Detail/Form page** for creating/editing courses
  - Include a sub-table block for **Modules** (linked via `courseId`)
  - Each module row should expand to show **Lessons** (linked via `moduleId`)

### 6.3 Enrollment Analytics page

- **Add block** → Table → Collection: `lms_enrollments`
  - Fields: `student.nickname`, `course.title`, `status`, `progressPercent`, `enrolledAt`, `completedAt`
  - Filter: `course.createdById = {{$user.id}}`
- **Add a Chart block** (requires `plugin-charts`)
  - Metric: count of `lms_enrollments` grouped by `status`

### 6.4 Assignment Grading page

- **Add block** → Table → Collection: `lms_submissions`
  - Fields: `student.nickname`, `assignment.title`, `status`, `score`, `submittedAt`
  - Filter: `assignment.course.createdById = {{$user.id}}`
  - Action: **Grade** → opens form with `score` and `feedback` fields

---

## 7. Building the Student Portal (UI)

> **Auto-seeded**: the "My Learning" menu group and its pages (Course Catalog,
> My Courses, My Certificates) are seeded and bound to the `student` role. The
> manual steps below are: (a) add the **Enroll** custom-request action to the
> catalog, (b) build the **Lesson Player** detail page with a **Mark Complete**
> custom-request action, and (c) optionally switch the catalog Table block to a
> Grid Card block. Custom-request actions post to the endpoints shown below.

### 7.1 Course Catalog page

- **Add block** → Grid Card → Collection: `lms_courses`
  - Filter: `status = published`
  - Fields: `thumbnail`, `title`, `description`, `instructor.nickname`, `durationMinutes`
  - Action: **Enroll** → calls `POST /api/lms_enrollments:enroll` with `{ courseId }`

### 7.2 My Learning page

- **Add block** → Table → Collection: `lms_enrollments`
  - Filter: `studentId = {{$user.id}}`
  - Fields: `course.title`, `status`, `progressPercent`, `enrolledAt`
  - Action: **Continue** → links to the lesson viewer page

### 7.3 Lesson Viewer page

- **Add block** → Detail → Collection: `lms_lessons`
  - Show `title`, `content`, `videoUrl`
  - Action button: **Mark Complete** → calls `POST /api/lms_lesson_completions:completeLesson`
    with `{ lessonId, enrollmentId }`

### 7.4 My Certificates page

- **Add block** → Table → Collection: `lms_certificates`
  - Filter: `studentId = {{$user.id}}`
  - Fields: `certificateNumber`, `course.title`, `issuedAt`

---

## 8. Workflow Automation Setup

> **Auto-seeded**: the plugin seeds five workflows on install/upgrade (idempotent):
> `lms_enrollment_welcome`, `lms_completion_certificate` (sync — issues the
> certificate the instant an enrollment hits `completed`), `lms_submission_instructor`,
> `lms_graded_student`, and `lms_overdue_reminder` (a disabled schedule shell).
> The certificate automation is fully functional out of the box. The notification
> nodes require a channel and are inert (with `ignoreFail`) until you complete the
> two setup steps below.

### 8.0 Enable notification delivery (required for notifications)

1. **In-app channel** — go to **Settings → Notification → Channels** and create an
   in-app channel named `in-app-message` (this is the channel name the seeded
   workflows reference). In-app messages then appear in the user's notification bell.
2. **Email channel (optional)** — create an email channel and set the SMTP
   credentials (`SMTP_*` in `.env.example`). To also email users, add a second
   notification node (or a Mailer node) to each workflow targeting
   `{{$context.data.student.email}}`.
3. **Overdue reminder** — the `lms_overdue_reminder` workflow is seeded **disabled**.
   To activate it, open it in **Settings → Workflow**, add a **Query** node
   (`lms_assignments` due today) → **Loop** over enrolled-but-not-submitted students
   → **Notification** node, then enable it (see §8.5).

The seeded workflows below are described for reference / manual tuning.

### 8.1 Enrollment Welcome Notification *(seeded)*

| Field | Value |
|---|---|
| Trigger | Collection Event — `lms_enrollments` — After create |
| Condition | `status = active` |
| Node 1 | **Mailer** — To: `{{$context.data.student.email}}`, Subject: `Welcome to {{$context.data.course.title}}`, Body: include course title and first lesson link |

### 8.2 Course Completion Detection & Certificate Issuance

| Field | Value |
|---|---|
| Trigger | Collection Event — `lms_enrollments` — After update |
| Condition | `status = completed` AND `$context.data.certificatesCount = 0` |
| Node 1 | **Create record** — Collection: `lms_certificates` — `enrollmentId`, `studentId`, `courseId`, `issuedAt: {{now}}` |
| Node 2 | **Mailer** — send certificate notification email |

### 8.3 Assignment Submission Notification to Instructor

| Field | Value |
|---|---|
| Trigger | Collection Event — `lms_submissions` — After create |
| Node 1 | **Query** — fetch `assignment.course.instructor.email` |
| Node 2 | **Mailer** — notify instructor of new submission |

### 8.4 Assignment Graded Notification to Student

| Field | Value |
|---|---|
| Trigger | Collection Event — `lms_submissions` — After update |
| Condition | `status = graded` |
| Node 1 | **Mailer** — To: `{{$context.data.student.email}}`, include `score` and `feedback` |

### 8.5 Overdue Assignment Reminder (Scheduled)

| Field | Value |
|---|---|
| Trigger | Schedule — daily at 08:00 |
| Node 1 | **Query** — `lms_assignments` where `dueDate = today` |
| Node 2 | **Loop** over results |
| Node 3 (inside loop) | **Query** — enrolled students who haven't submitted |
| Node 4 (inside loop) | **Mailer** — reminder email |

---

## 9. Roles & Permissions Reference

Two roles are seeded automatically on plugin install:

| Role | Default? | Can access UI builder? | Description |
|---|---|---|---|
| `instructor` | No | No | Full CRUD on own courses; read enrollments/submissions for grading |
| `student` | **Yes** | No | Read published courses; enroll; complete lessons; submit assignments; take quizzes |

**Admin** is the built-in NocoBase `root` role — retains full access to everything.

To assign a role, go to **Settings → Users → select user → Roles tab**.

---

## 10. Data Model Reference

```
lms_courses
  ├── lms_modules (courseId)
  │     └── lms_lessons (moduleId)
  │           └── lms_quiz_questions via lms_quizzes (quizId on lesson)
  ├── lms_enrollments (courseId)
  │     ├── lms_lesson_completions (enrollmentId)
  │     ├── lms_quiz_attempts (enrollmentId)
  │     └── lms_certificates (enrollmentId)
  ├── lms_assignments (courseId)
  │     └── lms_submissions (assignmentId)
  ├── lms_quizzes (courseId)
  │     ├── lms_quiz_questions (quizId)
  │     └── lms_quiz_attempts (quizId)
  └── lms_announcements (courseId, nullable = global)
```

All user references (`instructorId`, `studentId`, `authorId`) point to the built-in `users` collection.
