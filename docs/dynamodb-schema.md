# DynamoDB Database Schema - Habit Tracker

## Översikt

Vi kommer skapa 3 tabeller:
1. **Users** - Användarinformation (komplement till Cognito)
2. **Habits** - Användarnas vanor
3. **HabitCompletions** - Logg över när vanor är genomförda

## Varför DynamoDB?

- Serverless (passar perfekt med Lambda)
- Skalbar automatiskt
- Pay-per-use (billigt för små projekt)
- Snabb (låg latency)
- Fungerar perfekt med AWS ekosystemet

---

## TABELL 1: Users

**Syfte:** Lagra användardata (komplement till Cognito som bara hanterar autentisering)

### Schema:

| Attribut | Typ | Beskrivning | Exempel |
|----------|-----|-------------|---------|
| **userId** (PK) | String | Cognito User Sub (unique ID) | `"abc123-def456-ghi789"` |
| email | String | Användarens email | `"user@example.com"` |
| name | String | Användarens namn | `"Anna Andersson"` |
| createdAt | String (ISO) | När användare registrerades | `"2024-02-27T10:30:00Z"` |
| updatedAt | String (ISO) | Senast uppdaterad | `"2024-02-27T10:30:00Z"` |
| preferences | Map | Användarinställningar | `{theme: "dark", notifications: true}` |

### Primärnyckel:
- **Partition Key (PK):** `userId`

### Användning:
```javascript
// Skapa användare
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

## TABELL 2: Habits

**Syfte:** Lagra alla vanor som användare skapar

### Schema:

| Attribut | Typ | Beskrivning | Exempel |
|----------|-----|-------------|---------|
| **habitId** (PK) | String | Unik ID för vanan (UUID) | `"habit-uuid-12345"` |
| **userId** (SK/GSI) | String | Vem som äger vanan | `"abc123-def456"` |
| name | String | Namn på vanan | `"Träna"` |
| description | String | Beskrivning | `"30 min cardio"` |
| frequency | String | Hur ofta (daily, weekly, etc) | `"daily"` |
| targetDays | List | Vilka dagar (om weekly) | `["monday", "wednesday", "friday"]` |
| color | String | Färgkod för UI | `"#FF6B6B"` |
| icon | String | Ikon-namn | `"fitness"` |
| category | String | Kategori | `"health"` |
| reminderTime | String | Påminnelsetid (optional) | `"08:00"` |
| createdAt | String (ISO) | När vanan skapades | `"2024-02-27T10:30:00Z"` |
| updatedAt | String (ISO) | Senast uppdaterad | `"2024-02-27T10:30:00Z"` |
| isActive | Boolean | Om vanan är aktiv | `true` |

### Primärnyckel:
- **Partition Key (PK):** `habitId`

### Global Secondary Index (GSI):
- **GSI Name:** `UserIdIndex`
- **Partition Key:** `userId`
- **Sort Key:** `createdAt`
- **Syfte:** Hämta alla vanor för en specifik användare

### Användning:
```javascript
// Skapa vana
{
  habitId: "habit-uuid-12345",
  userId: "abc123-def456",
  name: "Morgonjogg",
  description: "Springa 5km",
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

// Query: Hämta alla vanor för en användare
// GSI: UserIdIndex
// Key: userId = "abc123-def456"
```
---

## TABELL 3: HabitCompletions

**Syfte:** Logga när användare genomför sina vanor (för statistik!)

### Schema:

| Attribut | Typ | Beskrivning | Exempel |
|----------|-----|-------------|---------|
| **completionId** (PK) | String | Unik ID (UUID) | `"comp-uuid-67890"` |
| **habitId** (GSI1) | String | Vilken vana | `"habit-uuid-12345"` |
| **userId** (GSI2) | String | Vem som genomförde | `"abc123-def456"` |
| completedDate | String | Datum (YYYY-MM-DD) | `"2024-02-27"` |
| completedAt | String (ISO) | Exakt tidpunkt | `"2024-02-27T18:45:00Z"` |
| notes | String | Anteckningar (optional) | `"Kändes bra!"` |
| mood | String | Humör efter (optional) | `"happy"` |

### Primärnyckel:
- **Partition Key (PK):** `completionId`

### Global Secondary Index 1 (GSI1):
- **GSI Name:** `HabitIdDateIndex`
- **Partition Key:** `habitId`
- **Sort Key:** `completedDate`
- **Syfte:** Hämta alla completions för en specifik vana, sorterat per datum

### Global Secondary Index 2 (GSI2):
- **GSI Name:** `UserIdDateIndex`
- **Partition Key:** `userId`
- **Sort Key:** `completedDate`
- **Syfte:** Hämta alla completions för en användare, sorterat per datum

### Användning:
```javascript
// Markera vana som genomförd
{
  completionId: "comp-uuid-67890",
  habitId: "habit-uuid-12345",
  userId: "abc123-def456",
  completedDate: "2024-02-27",
  completedAt: "2024-02-27T18:45:00Z",
  notes: "Sprang 6km idag!",
  mood: "energized"
}

// Query 1: Hämta completions för en vana
// GSI: HabitIdDateIndex
// Key: habitId = "habit-uuid-12345"
// Range: completedDate mellan startDate och endDate

// Query 2: Hämta alla completions för en användare
// GSI: UserIdDateIndex
// Key: userId = "abc123-def456"
// Range: completedDate mellan startDate och endDate
```

---

## Query-exempel

### 1. Hämta alla vanor för en användare:
```
Table: Habits
GSI: UserIdIndex
Query: userId = "abc123-def456"
Sort: createdAt (DESC)
```

### 2. Hämta completions för en vana (senaste 30 dagarna):
```
Table: HabitCompletions
GSI: HabitIdDateIndex
Query: habitId = "habit-uuid-12345"
Range: completedDate BETWEEN "2024-01-28" AND "2024-02-27"
```

### 3. Beräkna streak för en vana:
```
Table: HabitCompletions
GSI: HabitIdDateIndex
Query: habitId = "habit-uuid-12345"
Range: completedDate <= TODAY
Sort: DESC
Logic: Räkna konsekutiva dagar bakåt
```

### 4. Statistik för användare (alla vanor):
```
Table: HabitCompletions
GSI: UserIdDateIndex
Query: userId = "abc123-def456"
Range: completedDate BETWEEN startDate AND endDate
Aggregate: COUNT per habitId
```
---

## Kostnadsuppskattning

För en MVP med få användare:
- **Read/Write Capacity:** On-Demand (betala per request)
- **Storage:** Första 25 GB gratis
- **Uppskattad kostnad:** $0-5/månad för utveckling och testning

---

## Säkerhet

- Alla tabeller är privata (endast accessible via Lambda med rätt IAM roles)
- userId valideras mot Cognito JWT token
- Användare kan bara se/ändra sin egen data
- Lambda functions har minimal IAM permissions (principle of least privilege)

---

## Skalbarhet

DynamoDB kan hantera:
- Miljoner requests per sekund
- Obegränsad storage
- Automatisk partitionering

---

## Anmärkningar

### Varför inte en tabell med allt?
- DynamoDB är NoSQL - separata tabeller ger bättre query performance
- Tydligare datamodell
- Enklare att underhålla

### Varför String för datum istället för Number (timestamp)?
- ISO-format är lättare att läsa och debugga
- Fungerar bra med DynamoDB sort keys
- Enkel att konvertera till Date-objekt i JavaScript

### Varför UUID för IDs?
- Garanterat unika
- Ingen collision risk
- Fungerar bra i distribuerade system
- JavaScript har `crypto.randomUUID()` built-in
