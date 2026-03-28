import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add idToken automatically on every call
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@auth:idToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;

/*    Design Choices Summary
  Choice / Tool                    | Reason / Benefit                                                                   | Source
  ---------------------------------|------------------------------------------------------------------------------------|------------------------------------------------------------
  axios.create()                   | Creates a pre-configured instance – baseURL and headers set once                   | Axios Docs: https://axios-http.com/docs/intro
  Request interceptor for JWT      | Automatic token handling – components do not need to manage auth                   | Axios Interceptors: https://axios-http.com/docs/interceptors
  AsyncStorage for token           | Persistent tokens survive app restarts – keeps user logged in                      | AsyncStorage: https://react-native-async-storage.github.io/async-storage/
  EXPO_PUBLIC_-prefix              | Exposes environment variable to the compiled mobile bundle                         | Expo Env Vars: https://docs.expo.dev/guides/environment-variables/
  Bearer schema                    | RFC 6750 standard for OAuth/JWT tokens – required by API Gateway Cognito authorizer| MDN: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization
  Centralized Content-Type header  | All requests automatically use 'application/json' – avoids repetition in every call| Best practice
*/
