# Insights API

## GET /insights

Generates personalized insights based on the user's habits and completions.

### Headers

```
Authorization: Bearer <idToken>
```

### Response

```json
{
  "insights": [
    {
      "id": "insight_1",
      "type": "struggling | comeback | perfect_week | consistency | improvement | best_streak | best_day | most_completed",
      "message": "Personalized message (localized, e.g. Swedish)",
      "habitId": "uuid or null",
      "value": 17,
      "priority": 1
    }
  ],
  "generatedAt": "2026-03-08T13:22:27.666Z",
  "dataPoints": 12,
  "habitsAnalyzed": 3
}
```

---

## Insight Types

| Type           | Description                     | Threshold       |
| -------------- | ------------------------------- | --------------- |
| struggling     | Habit below 30% completion rate | 7 days of data  |
| comeback       | Streak broken but resumed       | 2+ completions  |
| perfect_week   | All habits completed for 7 days | 7 days of data  |
| consistency    | Average >80% over last 14 days  | 14 days of data |
| improvement    | +20% vs previous week           | 14 days of data |
| best_streak    | Highest active streak (min 3)   | 3+ days         |
| best_day       | Best weekday performance        | 14 days of data |
| most_completed | Most total completions          | 5+ completions  |

---

## Notes

* Maximum of **3 insights** are returned
* Insights are sorted by **priority** (ascending, where 1 = highest priority)
* `habitId` is `null` for global insights
* Messages are intended to be user-facing and localized
