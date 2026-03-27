# Habit Tracker API — Documentation

**Base URL:** [https://o3ltnav2ad.execute-api.eu-north-1.amazonaws.com/dev](https://o3ltnav2ad.execute-api.eu-north-1.amazonaws.com/dev)

## Public Endpoints (No Authentication Required)

| Method | Endpoint    | Body                      | Response                                     |
| ------ | ----------- | ------------------------- | -------------------------------------------- |
| POST   | /auth/users | { email, password, name } | { user, idToken, accessToken, refreshToken } |
| POST   | /auth/login | { email, password }       | { idToken, accessToken, refreshToken }       |

## Protected Endpoints (Require Authorization: Bearer <idToken>)

### Users

| Method | Endpoint       | Body     | Response |
| ------ | -------------- | -------- | -------- |
| GET    | /auth/users/me | —        | { user } |
| PATCH  | /auth/users/me | { name } | { user } |

### Habits

| Method | Endpoint          | Body                                   | Response          |
| ------ | ----------------- | -------------------------------------- | ----------------- |
| GET    | /habits           | —                                      | { habits: [...] } |
| POST   | /habits           | { name, description?, color?, icon? }  | { habit }         |
| PATCH  | /habits/{habitId} | { name?, description?, color?, icon? } | { habit }         |
| DELETE | /habits/{habitId} | —                                      | { message }       |

### Completions

| Method | Endpoint                    | Body        | Response               |
| ------ | --------------------------- | ----------- | ---------------------- |
| GET    | /completions                | —           | { completions: [...] } |
| POST   | /completions                | { habitId } | { completion }         |
| DELETE | /completions/{completionId} | —           | { message }            |

## Notes

* `userId` is always derived from the JWT token on the backend — it is never sent in the request body.
* POST /completions is deduplicated — the same habit can only be completed once per day.
* All protected endpoints return **401 Unauthorized** if the token is missing or invalid.
