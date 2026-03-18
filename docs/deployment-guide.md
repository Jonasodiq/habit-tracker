# Habit Tracker — Deployment Guide

## Förutsättningar

- Node.js 18+
- AWS CLI konfigurerat (`aws configure`)
- Serverless Framework 4 (`npm install -g serverless`)
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- AWS-konto med rätt behörigheter

---

## 1. AWS-setup

### 1.1 IAM-roll
Skapa en IAM-roll för Lambda med följande policies:
- `AmazonDynamoDBFullAccess`
- `CloudWatchLogsFullAccess`
- `AWSLambdaBasicExecutionRole`

Notera ARN:et — används i `serverless.yml`:
```yaml
iam:
  role: arn:aws:iam::ACCOUNT_ID:role/habit-tracker-backend-dev-eu-north-1-lambdaRole
```

### 1.2 AWS Profil
Konfigurera AWS CLI med habit-tracker profil:
```bash
aws configure --profile habit-tracker
# AWS Access Key ID: din nyckel
# AWS Secret Access Key: din hemliga nyckel
# Default region: eu-north-1
# Default output format: json
```

---

## 2. Cognito-konfiguration

### 2.1 Skapa User Pool
1. Gå till AWS Console → Cognito → Create User Pool
2. Inställningar:
   - **Sign-in:** Email
   - **Password policy:** Minst 8 tecken, siffror, versaler
   - **MFA:** Ingen
   - **Email verification:** Aktiverat

### 2.2 App Client
1. Skapa App Client utan secret
2. Notera:
   - `User Pool ID` → `eu-north-1_XXXXXXXX`
   - `Client ID` → lång sträng

### 2.3 Miljövariabler
Lägg till i `backend/.env`:
```
COGNITO_USER_POOL_ID=eu-north-1_XXXXXXXX
COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 3. DynamoDB-setup

### 3.1 Tabeller
Skapa dessa tabeller manuellt eller via Serverless:

| Tabell | Partition Key | Sort Key | GSI |
|--------|--------------|----------|-----|
| habit-tracker-users | userId (S) | — | — |
| habit-tracker-habits | habitId (S) | — | UserIdIndex (userId) |
| habit-tracker-completions | completionId (S) | — | UserIdIndex, HabitIdDateIndex, UserIdDateIndex |
| habit-tracker-insights-cache | userId (S) | — | — |

### 3.2 IAM-behörigheter för insights-cache
Lägg till inline policy på Lambda-rollen:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem"],
      "Resource": "arn:aws:dynamodb:eu-north-1:ACCOUNT_ID:table/habit-tracker-insights-cache-dev"
    },
    {
      "Effect": "Allow",
      "Action": ["cognito-idp:AdminUpdateUserAttributes"],
      "Resource": "arn:aws:cognito-idp:eu-north-1:ACCOUNT_ID:userpool/eu-north-1_XXXXXXXX"
    }
  ]
}
```

---

## 4. Serverless Deployment

### 4.1 Installation
```bash
cd backend
npm install
```

### 4.2 Miljövariabler
Skapa `backend/.env`:
```
COGNITO_USER_POOL_ID=eu-north-1_XXXXXXXX
COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXX
ANTHROPIC_API_KEY=sk-ant-XXXXXXXX
```

### 4.3 Deploya
```bash
# Första gången
serverless deploy

# Uppdatera enskild funktion
serverless deploy function -f getHabits

# Olika miljöer
serverless deploy --stage prod
serverless deploy --stage dev
```

### 4.4 Verifiera
```bash
# Kolla logs
serverless logs -f getHabits --tail

# Testa endpoint
curl -X GET https://API_ID.execute-api.eu-north-1.amazonaws.com/dev/habits \
  -H "Authorization: Bearer TOKEN"
```

### 4.5 Ta ner
```bash
serverless remove
```

---

## 5. Frontend — Expo Build

### 5.1 Installation
```bash
cd frontend
npm install
```

### 5.2 Miljövariabler
Skapa `frontend/.env`:
```
EXPO_PUBLIC_COGNITO_USER_POOL_ID=eu-north-1_XXXXXXXX
EXPO_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_API_BASE_URL=https://API_ID.execute-api.eu-north-1.amazonaws.com/dev
```

### 5.3 Köra lokalt
```bash
# Starta utvecklingsserver
npx expo start

# iOS simulator
npx expo start --ios

# Android emulator
npx expo start --android
```

### 5.4 Produktionsbygge med EAS

#### Konfigurera EAS
```bash
eas login
eas build:configure
```

#### iOS
```bash
# TestFlight (intern distribution)
eas build --platform ios --profile preview

# App Store
eas build --platform ios --profile production
eas submit --platform ios
```

#### Android
```bash
# Intern distribution
eas build --platform android --profile preview

# Google Play
eas build --platform android --profile production
eas submit --platform android
```

### 5.5 Uppdatera `app.json` för produktion
```json
{
  "expo": {
    "name": "HabitTracker",
    "slug": "habit-tracker",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.dittnamn.habittracker",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.dittnamn.habittracker",
      "versionCode": 1
    }
  }
}
```

---

## 6. Miljöer

| Miljö | Backend | Frontend |
|-------|---------|----------|
| Dev | `serverless deploy --stage dev` | `npx expo start` |
| Prod | `serverless deploy --stage prod` | `eas build --profile production` |

---

## 7. Felsökning

### Backend
```bash
# Kolla Lambda logs
aws logs tail /aws/lambda/habit-tracker-api-dev-getHabits --follow --region eu-north-1

# Testa Lambda direkt
serverless invoke -f getHabits --log
```

### Frontend
```bash
# Rensa cache
npx expo start --clear

# Rensa Metro cache
rm -rf .expo node_modules/.cache
npx expo start --clear
```

---

## 8. Arkitektur

```
Frontend (Expo/React Native)
    ↓ HTTPS
API Gateway
    ↓
Lambda Functions (Node.js 18)
    ↓
DynamoDB + Cognito + Claude API
```

**Region:** eu-north-1 (Stockholm)  
**Framework:** Serverless Framework 4  
**Runtime:** Node.js 18.x