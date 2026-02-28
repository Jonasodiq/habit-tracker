exports.healthCheck = async (event) => {
  console.log('Health check called');

  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*', // CORS för frontend
      'Access-Control-Allow-Credentials': true,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'ok',
      message: 'Habit Tracker API is running!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      region: process.env.AWS_REGION,
      tables: {
        users: process.env.USERS_TABLE,
        habits: process.env.HABITS_TABLE,
        completions: process.env.COMPLETIONS_TABLE,
      },
      cognito: {
        userPoolId: process.env.COGNITO_USER_POOL_ID ? 'Configured' : 'Missing',
        clientId: process.env.COGNITO_CLIENT_ID ? 'Configured' : 'Missing',
      },
    }),
  };

  return response;
};