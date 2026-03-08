# Insights API

## GET /insights

Genererar personliga insikter baserat på användarens vanor och completions.

### Headers
Authorization: Bearer <idToken>

### Response
```json
{
  "insights": [
    {
      "id": "insight_1",
      "type": "struggling | comeback | perfect_week | consistency | improvement | best_streak | best_day | most_completed",
      "message": "Personligt meddelande på svenska",
      "habitId": "uuid eller null",
      "value": 17,
      "priority": 1
    }
  ],
  "generatedAt": "2026-03-08T13:22:27.666Z",
  "dataPoints": 12,
  "habitsAnalyzed": 3
}
```

### Insiktstyper
| Type | Beskrivning | Tröskel |
|------|-------------|---------|
| struggling | Vana under 30% completion | 7 dagars data |
| comeback | Streak bruten men återupptagen | 2+ completions |
| perfect_week | Alla vanor klara 7 dagar | 7 dagars data |
| consistency | Snitt >80% senaste 14 dagar | 14 dagars data |
| improvement | +20% vs förra veckan | 14 dagars data |
| best_streak | Högst aktiv streak (min 3) | 3+ dagar |
| best_day | Bästa veckodag | 14 dagars data |
| most_completed | Flest totala completions | 5+ completions |

### Max 3 insikter returneras, sorterade efter prioritet.