# DynamoDB Database Schema — Habit Tracker

## Overview

Create 3 tables:

1. **Users** — User information (complements Cognito)
2. **Habits** — User-defined habits
3. **HabitCompletions** — Log of completed habits

## Why DynamoDB?

* Serverless (fits perfectly with Lambda)
* Automatically scalable
* Pay-per-use (cost-efficient for small projects)
* Low latency (fast)
* Seamless integration with the AWS ecosystem

---

## TABLE 1: Users

**Purpose:** Store user data (Cognito only handles authentication)

### Schema:

| Attribute       | Type         | Description                  | Example                                |
| --------------- | ------------ | ---------------------------- | -------------------------------------- |
| **userId** (PK) | String       | Cognito User Sub (unique ID) | `"abc123-def456-ghi789"`               |
| email           | String       | User email                   | `"user@example.com"`                   |
| name            | String       | User name                    | `"Anna Andersson"`                     |
| createdAt       | String (ISO) | Registration timestamp       | `"2024-02-27T10:30:00Z"`               |
| updatedAt       | String (ISO) | Last updated                 | `"2024-02-27T10:30:00Z"`               |
| preferences     | Map          | User settings                | `{theme: "dark", notifications: true}` |

### Primary Key:

* **Partition Key (PK):** `userId`

### Example:

```javascript
{
  userId: "abc123-def456",
  email: "user@example.com",
  name: "Anna Andersson",
  createdAt: "2024-02-27T10:30:00Z",
  updatedAt: "2024-02-27T10:30:00Z",
  preferences: {
    theme: "light",
    notifications: true
  }
}
```

---

## TABLE 2: Habits

**Purpose:** Store all habits created by users

### Schema:

| Attribute        | Type         | Description                     | Example                             |
| ---------------- | ------------ | ------------------------------- | ----------------------------------- |
| **habitId** (PK) | String       | Unique habit ID (UUID)          | `"habit-uuid-12345"`                |
| **userId** (GSI) | String       | Owner of the habit              | `"abc123-def456"`                   |
| name             | String       | Habit name                      | `"Exercise"`                        |
| description      | String       | Description                     | `"30 min cardio"`                   |
| frequency        | String       | Frequency (daily, weekly, etc.) | `"daily"`                           |
| targetDays       | List         | Days (if weekly)                | `["monday", "wednesday", "friday"]` |
| color            | String       | UI color                        | `"#FF6B6B"`                         |
| icon             | String       | Icon name                       | `"fitness"`                         |
| category         | String       | Category                        | `"health"`                          |
| reminderTime     | String       | Reminder time (optional)        | `"08:00"`                           |
| createdAt        | String (ISO) | Created timestamp               | `"2024-02-27T10:30:00Z"`            |
| updatedAt        | String (ISO) | Last updated                    | `"2024-02-27T10:30:00Z"`            |
| isActive         | Boolean      | Active status                   | `true`                              |

### Primary Key:

* **Partition Key (PK):** `habitId`

### Global Secondary Index (GSI):

* **Name:** `UserIdIndex`
* **Partition Key:** `userId`
* **Sort Key:** `createdAt`
* **Purpose:** Fetch all habits for a specific user

### Example:

```javascript
{
  habitId: "habit-uuid-12345",
  userId: "abc123-def456",
  name: "Morning Run",
  description: "Run 5km",
  frequency: "daily",
  targetDays: [],
  color: "#4ECDC4",
  icon: "running",
  category: "fitness",
  reminderTime: "07:00",
  createdAt: "2024-02-27T10:30:00Z",
  updatedAt: "2024-02-27T10:30:00Z",
  isActive: true
}
```

---

## TABLE 3: HabitCompletions

**Purpose:** Track when users complete habits (for analytics)

### Schema:

| Attribute             | Type         | Description       | Example                  |
| --------------------- | ------------ | ----------------- | ------------------------ |
| **completionId** (PK) | String       | Unique ID (UUID)  | `"comp-uuid-67890"`      |
| **habitId** (GSI1)    | String       | Related habit     | `"habit-uuid-12345"`     |
| **userId** (GSI2)     | String       | User ID           | `"abc123-def456"`        |
| completedDate         | String       | Date (YYYY-MM-DD) | `"2024-02-27"`           |
| completedAt           | String (ISO) | Exact timestamp   | `"2024-02-27T18:45:00Z"` |
| notes                 | String       | Notes (optional)  | `"Felt great!"`          |
| mood                  | String       | Mood (optional)   | `"happy"`                |

### Primary Key:

* **Partition Key (PK):** `completionId`

### GSI 1:

* **Name:** `HabitIdDateIndex`
* **Partition Key:** `habitId`
* **Sort Key:** `completedDate`
* **Purpose:** Fetch completions per habit (sorted by date)

### GSI 2:

* **Name:** `UserIdDateIndex`
* **Partition Key:** `userId`
* **Sort Key:** `completedDate`
* **Purpose:** Fetch completions per user (sorted by date)

### Example:

```javascript
{
  completionId: "comp-uuid-67890",
  habitId: "habit-uuid-12345",
  userId: "abc123-def456",
  completedDate: "2024-02-27",
  completedAt: "2024-02-27T18:45:00Z",
  notes: "Ran 6km today!",
  mood: "energized"
}
```

---

## Query Examples

### Get all habits for a user

```
Table: Habits
GSI: UserIdIndex
Key: userId = "abc123-def456"
Sort: createdAt (DESC)
```

### Get completions for a habit (last 30 days)

```
Table: HabitCompletions
GSI: HabitIdDateIndex
Key: habitId = "habit-uuid-12345"
Range: completedDate BETWEEN "2024-01-28" AND "2024-02-27"
```

### Calculate streak

```
Table: HabitCompletions
GSI: HabitIdDateIndex
Key: habitId = "habit-uuid-12345"
Sort: DESC
Logic: Count consecutive days backwards
```

### User statistics

```
Table: HabitCompletions
GSI: UserIdDateIndex
Key: userId = "abc123-def456"
Range: completedDate BETWEEN startDate AND endDate
Aggregate: COUNT per habitId
```

---

## Cost Estimate

For an MVP:

* On-Demand capacity (pay per request)
* 25 GB free tier storage
* Estimated cost: **$0–5/month** during development

---

## Security

* Tables are private (only accessible via Lambda with IAM roles)
* `userId` is validated via Cognito JWT
* Users can only access their own data
* Least privilege IAM principle applied

---

## Scalability

DynamoDB supports:

* Millions of requests per second
* Virtually unlimited storage
* Automatic partitioning

---

## Notes

### Why not a single table?

* Better query performance
* Clearer data model
* Easier maintenance

### Why ISO strings for dates?

* Human-readable
* Works well with sort keys
* Easy conversion in JavaScript

### Why UUIDs?

* Globally unique
* No collision risk
* Ideal for distributed systems
* Supported via `crypto.randomUUID()`
