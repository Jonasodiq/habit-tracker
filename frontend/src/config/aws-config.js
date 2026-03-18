export const AWS_CONFIG = {
  region:              'eu-north-1',
  userPoolId:          process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID,
  userPoolWebClientId: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID,
};

export const API_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
};

export default AWS_CONFIG;