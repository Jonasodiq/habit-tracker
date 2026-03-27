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

// Register new user — creates account in Cognito + DynamoDB
export async function register(email: string, password: string, name: string): Promise<AuthResult> {
  const { data } = await axios.post(`${BASE_URL}/auth/users`, { email, password, name });
  await saveTokens(data);
  return data;
}

// Log in with email + password
export async function login(email: string, password: string): Promise<AuthResult> {
  const { data } = await axios.post(`${BASE_URL}/auth/login`, { email, password });
  // login response does not have user — fetch from storage or build minimal object
  await saveTokens(data);
  return data;
}

// Log out — clear all stored data
export async function logout(): Promise<void> {
  await AsyncStorage.clear();
}

// Get logged in user from storage
export async function getStoredUser(): Promise<User | null> {
  const json = await AsyncStorage.getItem(KEYS.user);
  return json ? JSON.parse(json) : null;
}

// Check if the user is logged in
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
