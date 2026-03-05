import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const KEYS = {
  idToken: '@auth:idToken',
  accessToken: '@auth:accessToken',
  refreshToken: '@auth:refreshToken',
  user: '@auth:user',
};

export interface User {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResult {
  user: User;
  idToken: string;
  accessToken: string;
  refreshToken: string;
}

// Registrera ny användare — skapar konto i Cognito + DynamoDB
export async function register(email: string, password: string, name: string): Promise<AuthResult> {
  const { data } = await axios.post(`${BASE_URL}/auth/users`, { email, password, name });
  await saveTokens(data);
  return data;
}

// Logga in med email + lösenord.
export async function login(email: string, password: string): Promise<AuthResult> {
  const { data } = await axios.post(`${BASE_URL}/auth/login`, { email, password });
  // login-svaret har inte user — hämta från storage eller bygg minimalt objekt
  await saveTokens(data);
  return data;
}

// Logga ut — rensa all lagrad data.
export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.idToken);
  await AsyncStorage.removeItem(KEYS.accessToken);
  await AsyncStorage.removeItem(KEYS.refreshToken);
  await AsyncStorage.removeItem(KEYS.user);
}

// Hämta inloggad användare från storage.
export async function getStoredUser(): Promise<User | null> {
  const json = await AsyncStorage.getItem(KEYS.user);
  return json ? JSON.parse(json) : null;
}

// Kontrollera om användaren är inloggad.
export async function isLoggedIn(): Promise<boolean> {
  const token = await AsyncStorage.getItem(KEYS.idToken);
  return !!token;
}

async function saveTokens(data: Partial<AuthResult>): Promise<void> {
  if (data.idToken)      await AsyncStorage.setItem(KEYS.idToken, data.idToken);
  if (data.accessToken)  await AsyncStorage.setItem(KEYS.accessToken, data.accessToken);
  if (data.refreshToken) await AsyncStorage.setItem(KEYS.refreshToken, data.refreshToken);
  if (data.user)         await AsyncStorage.setItem(KEYS.user, JSON.stringify(data.user));
}
