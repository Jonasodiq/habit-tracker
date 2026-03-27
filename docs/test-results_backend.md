# Backend API — Test Results

- Date: 2026-03-11
- Tester: Jonas
- Environment: AWS (eu-north-1) / dev / Postman

---

## Summary

* Total tests: 27
* Passed: 27
* Failed: 0

---

## AUTH (7/7 ✅)

* POST /auth/users — Registration works
* POST /auth/users — Duplicate email returns 400
* POST /auth/login — Login works
* POST /auth/login — Incorrect password returns 401
* GET /auth/users/me — Retrieves user with token
* GET /auth/users/me — Without token returns 401
* PATCH /auth/users/me — Update works

---

## HABITS (7/7 ✅)

* POST /habits — Creates habit successfully
* POST /habits — Missing name returns 400
* GET /habits — Retrieves all habits
* PATCH /habits/{id} — Updates habit
* PATCH /habits/{id} — Invalid ID returns 404
* DELETE /habits/{id} — Deletes with cascade
* DELETE /habits/{id} — Accessing another user's habit returns 400

---

## COMPLETIONS (6/6 ✅)

* POST /completions — Marks habit as completed
* POST /completions — Deduplication works
* GET /completions — Retrieves all completions
* GET /completions?habitId= — Filtering works
* DELETE /completions/{id} — Deletes completion
* DELETE /completions/{id} — Accessing another user's completion returns 400

---

## STATISTICS & INSIGHTS (7/7 ✅)

* GET /statistics — Returns summary + per-habit data
* GET /insights — AI generates insights
* POST /insights/tips — Tips generated for weakest habit
* All endpoints without token return 401

---

## Security

* Cognito authentication works across all protected endpoints
* Users cannot modify other users' data
* Cascade delete works correctly
