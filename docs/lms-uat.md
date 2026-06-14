# LMS User Acceptance Test Script

Environment: local dev (`yarn dev`) at **http://localhost:13000** with demo
content seeded (`yarn nocobase lms:seed-demo`).

> Shell note: the API steps below are written for **bash/zsh**. If your shell
> is fish, run `bash` first, then paste the blocks.

## Accounts

| Role | Login | Password |
|---|---|---|
| Admin (root) | `admin@nocobase.com` | `admin123` |
| Instructor | `instructor@lms.dev` | `instructor123` |
| Student | `student@lms.dev` | `student123` |

## Demo data

- Courses: **Introduction to NocoBase** (published, 4 lessons, 1 quiz, 1
  assignment), **Automating with Workflows** (published, 2 lessons, 1
  assignment), **Plugin Development (Coming Soon)** (draft).
- Quiz: *Collections Knowledge Check* (quiz id 1, course 1) — 2 questions,
  passing score 70, max 3 attempts.
- On a fresh seed the demo student also has one **submitted (ungraded)
  assignment** and one **passed quiz attempt**, so the instructor's Grading and
  Quiz Results pages have data out of the box.
- The demo student starts with **no enrollments** (reset before UAT).

---

## A. Authentication & access control

| # | Step | Expected | Pass |
|---|---|---|---|
| A1 | Open http://localhost:13000 → sign in as **student** | Lands in the app; top bar shows only the **My Learning** group | Pass |
| A2 | As student, look for UI-editor pencil / Settings gear in the top bar | Neither is visible (students cannot edit UI or manage plugins) | Pass |
| A3 | Sign out, sign in as **instructor** | Only the **Instructor Portal** group is visible | Pass |
| A4 | Sign out, sign in as **admin** | Both portal groups visible, plus UI editor pencil and Settings | Pass |
| A5 | Sign in with a wrong password | Login rejected with an error message | Pass |

## B. Student portal (UI)

Sign in as **student**.

| # | Step | Expected | Pass |
|---|---|---|---|
| B1 | Open **My Learning → Course Catalog** | Table shows **2** courses (Introduction to NocoBase, Automating with Workflows) with Title, Description, Category, Duration, Instructor columns | Pass |
| B2 | Confirm the draft course is absent | "Plugin Development (Coming Soon)" is **not** listed | Pass |
| B3 | Open **My Courses** | Empty table (no enrollments yet) | Pass |
| B4 | Open **My Certificates** | Empty table | Pass |

## C. Learner journey (API + UI)

The Enroll / Mark Complete buttons are not in the UI yet (see *Known
limitations*), so this journey is driven through the same REST endpoints the
buttons will call. Paste into a **bash** terminal:

```bash
# Sign in as the student and capture a token
ST=$(curl -s -X POST http://localhost:13000/api/auth:signIn \
  -H 'Content-Type: application/json' \
  -d '{"account":"student@lms.dev","password":"student123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# C1 — Enroll in course 1 (captures the enrollment id for later steps)
EN=$(curl -s -X POST http://localhost:13000/api/lms_enrollments:enroll \
  -H "Authorization: Bearer $ST" -H 'Content-Type: application/json' \
  -d '{"courseId":1}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d['id']); import os; print('status:', d['status'], '| progress:', d['progressPercent'], file=os.sys.stderr)")
echo "enrollment id: $EN"
```

| # | Step | Expected | Pass |
|---|---|---|---|
| C1 | Run the enroll call above | Prints `status: active \| progress: 0` and the enrollment id; **My Courses** page now shows the course | Pass |
| C2 | Run the enroll call **again** | Same enrollment id returned (no duplicate row in My Courses) | Pass |

```bash
# C3 — Complete lessons 1-3 (watch progressPercent climb)
for L in 1 2 3; do
  curl -s -X POST http://localhost:13000/api/lms_lesson_completions:completeLesson \
    -H "Authorization: Bearer $ST" -H 'Content-Type: application/json' \
    -d "{\"lessonId\":$L,\"enrollmentId\":$EN}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print('progress:', d['progressPercent'])"
done
```

| # | Step | Expected | Pass |
|---|---|---|---|
| C3 | Complete lessons 1–3 | Progress prints 25 → 50 → 75; **My Courses** shows the same number | Pass |

> Stop here and do section **D (Quiz)** before completing the final lesson —
> quiz attempts require an *active* enrollment, and the course auto-completes
> at 100%.

## D. Quiz

```bash
# D1 — Submit a passing attempt (both answers correct)
curl -s -X POST http://localhost:13000/api/lms_quiz_attempts:submitQuiz \
  -H "Authorization: Bearer $ST" -H 'Content-Type: application/json' \
  -d "{\"quizId\":1,\"enrollmentId\":$EN,\"answers\":[
        {\"questionId\":1,\"answer\":\"hasMany\"},
        {\"questionId\":2,\"answer\":\"true\"}]}" | python3 -m json.tool

# D2 — Submit a failing attempt (wrong answers)
curl -s -X POST http://localhost:13000/api/lms_quiz_attempts:submitQuiz \
  -H "Authorization: Bearer $ST" -H 'Content-Type: application/json' \
  -d "{\"quizId\":1,\"enrollmentId\":$EN,\"answers\":[
        {\"questionId\":1,\"answer\":\"belongsTo\"},
        {\"questionId\":2,\"answer\":\"false\"}]}" | python3 -m json.tool
```

| # | Step | Expected | Pass |
|---|---|---|---|
| D1 | Passing attempt | `score: 100`, `passed: true`, per-question `gradedAnswers` | Pass |
| D2 | Failing attempt | `score: 0`, `passed: false` | Pass |
| D3 | Run the D2 command twice more | The 3rd total attempt succeeds; the **4th is rejected** (max 3 attempts) | Pass |

## E. Course completion & certificate

```bash
# E1 — Complete the final lesson (auto-completes the course)
curl -s -X POST http://localhost:13000/api/lms_lesson_completions:completeLesson \
  -H "Authorization: Bearer $ST" -H 'Content-Type: application/json' \
  -d "{\"lessonId\":4,\"enrollmentId\":$EN}" | python3 -m json.tool
```

| # | Step | Expected | Pass |
|---|---|---|---|
| E1 | Complete lesson 4 | Response: `{"progressPercent": 100, "completed": true}` | Pass |
| E2 | Refresh **My Certificates** | A certificate row appeared **automatically** (CERT-… number, course link, issue date) — issued by the `lms_completion_certificate` workflow, no manual step | Pass |
| E3 | Refresh **My Courses** | Status column shows a green **Completed** tag, Completed At set to today | Pass |

## F. Instructor portal (UI)

Sign in as **instructor**.

| # | Step | Expected | Pass |
|---|---|---|---|
| F1 | Open **Instructor Portal → My Courses** | All **3** courses listed, including the Draft (gray tag) | Pass |
| F2 | Open **Enrollments** | The demo student's enrollment with Completed status and 100% progress |  Pass |
| F3 | Open **Assignments** | 2 assignments with course links and max score | Pass |
| F4 | Open **Grading** | Shows the demo student's **submitted** (ungraded) assignment — Student, Assignment, Status, Score (blank until graded), Submitted At | ☐ |
| F5 | Open **Quiz Results** | Auto-graded quiz attempts listed — Student, Quiz, Score (%), Passed, Completed At (quiz grading is automatic, so results land here, not in Grading) | ☐ |
| F6 | Open **Announcements** | Demo announcement(s) listed | Pass |

## G. Admin spot-checks

Sign in as **admin**.

| # | Step | Expected | Pass |
|---|---|---|---|
| G1 | Toggle the UI editor (pencil) on any portal page | "Add block" / column configurators appear; tables are editable | Pass |
| G2 | Settings → Plugin manager → search "oidc" | Plugin listed as **"Auth: OIDC (Microsoft Entra ID / Azure AD)"**, enabled (toggle on). (It is titled by its display name, not the package name `auth-oidc`.) | ☐ |
| G3 | Settings → Authentication → **Add new** | Dropdown lists **OIDC** as a selectable auth type (alongside Password); choosing it opens a settings form for Issuer URL / Client ID / Client Secret / App URL / scope + claims | ☐ |
| G4 | Settings → Workflow | 5 seeded `lms_*` workflows; `lms_overdue_reminder` is disabled | Pass |
| G5 | Settings → Users | The three demo users exist with instructor/student roles assigned | Pass |

## Known limitations (expected UAT findings — do not log as defects)

1. **Enroll / Mark Complete / Submit Assignment / Grade buttons are not in the
   UI yet.** The server actions work (section C/D); wiring them to buttons is
   the remaining visual-editor step from `docs/lms-setup.md` §6–7. (Quiz grading
   is automatic, so Quiz Results needs no button.)
2. **No lesson player page yet** — lessons are completed via API.
3. **Email/in-app notifications are inert** until a notification channel named
   `in-app-message` is created (Settings → Notification). The certificate
   automation works regardless.
4. **OIDC is configurable but not yet active out of the box.** OIDC now appears
   as an auth type (G3); the "Sign in with Microsoft" button only shows once you
   create an OIDC authenticator (needs Azure AD app registration,
   `docs/lms-setup.md` §2/§5).
5. **The overdue-reminder workflow is seeded disabled** by design.

## Resetting for another UAT round

This clears the demo student's learner-journey data. It also clears the demo
quiz attempt and assignment submission, so the instructor's **Grading** (F4) and
**Quiz Results** (F5) pages go empty — they repopulate naturally as you re-run
sections C–E (the quiz step recreates an attempt; create a submission as in the
restore snippet below if you want F4 populated again).

```bash
psql -U chuckgriess -h localhost -d nocobase_lms_dev -c "
delete from lms_lesson_completions where \"studentId\"=3;
delete from lms_certificates where \"studentId\"=3;
delete from lms_quiz_attempts where \"studentId\"=3;
delete from lms_submissions where \"studentId\"=3;
delete from lms_enrollments where \"studentId\"=3;"
```

Optional — restore the demo grading row (F4) without the assignment-submission UI:

```bash
psql -U chuckgriess -h localhost -d nocobase_lms_dev -c "
insert into lms_submissions (\"assignmentId\", \"studentId\", status, content, \"submittedAt\", \"createdAt\", \"updatedAt\")
values (1, 3, 'submitted', 'Demo submission', now(), now(), now());"
```
