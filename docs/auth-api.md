# Habit Tracker API — Dokumentation

Base URL: https://o3ltnav2ad.execute-api.eu-north-1.amazonaws.com/dev

## Publiga endpoints (ingen autentisering krävs)

| Metod | Endpoint | Body | Svar |
|-------|----------|------|------|
| POST | /auth/users | { email, password, name } | { user, idToken, accessToken, refreshToken } |
| POST | /auth/login | { email, password } | { idToken, accessToken, refreshToken } |

## Skyddade endpoints (kräver Authorization: Bearer <idToken>)

### Användare
| Metod | Endpoint | Body | Svar |
|-------|----------|------|------|
| GET | /auth/users/me | — | { user } |
| PATCH | /auth/users/me | { name } | { user } |

### Vanor
| Metod | Endpoint | Body | Svar |
|-------|----------|------|------|
| GET | /habits | — | { habits: [...] } |
| POST | /habits | { name, description?, color?, icon? } | { habit } |
| PATCH | /habits/{habitId} | { name?, description?, color?, icon? } | { habit } |
| DELETE | /habits/{habitId} | — | { message } |

### Completions
| Metod | Endpoint | Body | Svar |
|-------|----------|------|------|
| GET | /completions | — | { completions: [...] } |
| POST | /completions | { habitId } | { completion } |
| DELETE | /completions/{completionId} | — | { message } |

## Noteringar
- `userId` hämtas alltid från JWT-token på backend — skickas aldrig i body
- POST /completions deduplicerar — kan bara slutföra samma vana en gång per dag
- Alla skyddade endpoints returnerar 401 om token saknas eller är ogiltig