# Habit Tracker — Deployment Guide

## Prerequisites

* Node.js 18+
* AWS CLI configured (`aws configure`)
* Serverless Framework 4 (`npm install -g serverless`)
* Expo CLI (`npm install -g expo-cli`)
* EAS CLI (`npm install -g eas-cli`)
* AWS account with sufficient permissions

---

## 1. AWS Setup

### 1.1 IAM Role

Create an IAM role for Lambda with the following policies:

* `AmazonDynamoDBFullAccess`
* `CloudWatchLogsFullAccess`
* `AWSLambdaBasicExecutionRole`

Note the ARN — it will be used in `serverless.yml`:

```yaml
iam:
  role: arn:aws:iam::ACCOUNT_ID:role/habit-tracker-backend-dev-eu-north-1-lambdaRole
```

### 1.2 AWS Profile

Configure AWS CLI with a habit-tracker profile:

```bash
aws configure --profile habit-tracker
# AWS Access Key ID: your key
# AWS Secret Access Key: your secret key
# Default region: eu-north-1
# Default output format: json
```

---

## 2. Cognito Configuration

### 2.1 Create User Pool

1. Go to AWS Console → Cognito → Create User Pool
2. Settings:

   * **Sign-in:** Email
   * **Password policy:** Minimum 8 characters, numbers, uppercase letters
   * **MFA:** Disabled
   * **Email verification:** Enabled

### 2.2 App Client

1. Create an App Client without a secret
2. Note:

   * `User Pool ID` → `eu-north-1_XXXXXXXX`
   * `Client ID` → long string

### 2.3 Environment Variables

Add to `backend/.env`:

```
COGNITO_USER_POOL_ID=eu-north-1_XXXXXXXX
COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 3. DynamoDB Setup

### 3.1 Tables

Create the following tables manually or via Serverless:

| Table                        | Partition Key    | Sort Key | GSI                                            |
| ---------------------------- | ---------------- | -------- | ---------------------------------------------- |
| habit-tracker-users          | userId (S)       | —        | —                                              |
| habit-tracker-habits         | habitId (S)      | —        | UserIdIndex (userId)                           |
| habit-tracker-completions    | completionId (S) | —        | UserIdIndex, HabitIdDateIndex, UserIdDateIndex |
| habit-tracker-insights-cache | userId (S)       | —        | —                                              |

### 3.2 IAM Permissions for insights-cache

Add inline policy to the Lambda role:

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

### 4.2 Environment Variables

Create `backend/.env`:

```
COGNITO_USER_POOL_ID=eu-north-1_XXXXXXXX
COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXX
ANTHROPIC_API_KEY=sk-ant-XXXXXXXX
```

### 4.3 Deploy

```bash
# First time
serverless deploy

# Deploy a single function
serverless deploy function -f getHabits

# Different stages
serverless deploy --stage prod
serverless deploy --stage dev
```

### 4.4 Verify

```bash
# Check logs
serverless logs -f getHabits --tail

# Test endpoint
curl -X GET https://API_ID.execute-api.eu-north-1.amazonaws.com/dev/habits \
  -H "Authorization: Bearer TOKEN"
```

### 4.5 Remove

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

### 5.2 Environment Variables

Create `frontend/.env`:

```
EXPO_PUBLIC_COGNITO_USER_POOL_ID=eu-north-1_XXXXXXXX
EXPO_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_API_BASE_URL=https://API_ID.execute-api.eu-north-1.amazonaws.com/dev
```

### 5.3 Run Locally

```bash
# Start development server
npx expo start

# iOS simulator
npx expo start --ios

# Android emulator
npx expo start --android
```

### 5.4 Production Build with EAS

#### Configure EAS

```bash
eas login
eas build:configure
```

#### iOS

```bash
# TestFlight (internal distribution)
eas build --platform ios --profile preview

# App Store
eas build --platform ios --profile production
eas submit --platform ios
```

#### Android

```bash
# Internal distribution
eas build --platform android --profile preview

# Google Play
eas build --platform android --profile production
eas submit --platform android
```

### 5.5 Update `app.json` for Production

```json
{
  "expo": {
    "name": "HabitTracker",
    "slug": "habit-tracker",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourname.habittracker",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.yourname.habittracker",
      "versionCode": 1
    }
  }
}
```

---

## 6. Environments

| Environment | Backend                          | Frontend                         |
| ----------- | -------------------------------- | -------------------------------- |
| Dev         | `serverless deploy --stage dev`  | `npx expo start`                 |
| Prod        | `serverless deploy --stage prod` | `eas build --profile production` |

---

## 7. Troubleshooting

### Backend

```bash
# Check Lambda logs
aws logs tail /aws/lambda/habit-tracker-api-dev-getHabits --follow --region eu-north-1

# Invoke Lambda directly
serverless invoke -f getHabits --log
```

### Frontend

```bash
# Clear cache
npx expo start --clear

# Clear Metro cache
rm -rf .expo node_modules/.cache
npx expo start --clear
```

---

## 8. Architecture

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
