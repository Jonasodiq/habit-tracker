# Backend API — Testresultat
Datum: 2026-03-11
Testare: Jonas
Miljö: AWS (eu-north-1) / dev / Postman

## Sammanfattning
- Totalt: 27 tester
- Godkända: 27
- Underkända: 0

## AUTH (7/7 ✅)
- POST /auth/users — Registrering fungerar
- POST /auth/users — Duplicate email ger 400
- POST /auth/login — Inloggning fungerar
- POST /auth/login — Fel lösenord ger 401
- GET /auth/users/me — Hämtar användare med token
- GET /auth/users/me — Utan token ger 401
- PATCH /auth/users/me — Uppdatering fungerar

## HABITS (7/7 ✅)
- POST /habits — Skapar vana korrekt
- POST /habits — Utan name ger 400
- GET /habits — Hämtar alla vanor
- PATCH /habits/{id} — Uppdaterar vana
- PATCH /habits/{id} — Fejkat ID ger 404
- DELETE /habits/{id} — Tar bort med cascade
- DELETE /habits/{id} — Annans habit ger 400

## COMPLETIONS (6/6 ✅)
- POST /completions — Markerar vana klar
- POST /completions — Deduplicering fungerar
- GET /completions — Hämtar alla completions
- GET /completions?habitId= — Filtrering fungerar
- DELETE /completions/{id} — Tar bort completion
- DELETE /completions/{id} — Annans completion ger 400

## STATISTICS & INSIGHTS (7/7 ✅)
- GET /statistics — Returnerar summary + per-habit data
- GET /insights — Claude AI genererar insikter
- POST /insights/tips — Tips genereras för svagaste vana
- Alla endpoints utan token ger 401

## Säkerhet
- Cognito-autentisering fungerar på alla skyddade endpoints
- Användare kan inte modifiera andras data
- Cascade delete fungerar korrekt