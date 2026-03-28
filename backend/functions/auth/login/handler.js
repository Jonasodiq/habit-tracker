const { CognitoIdentityProviderClient, InitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');
const response = require('../../../lib/response');
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'eu-north-1' });

// POST /login
module.exports.login = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password } = body;

    if (!email || !password) {
      return response.badRequest('email och password krävs');
    }

    const authResult = await cognito.send(
      new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: CLIENT_ID,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      }),
    );

    const tokens = authResult.AuthenticationResult;

    return response.success({
      accessToken: tokens.AccessToken,
      idToken: tokens.IdToken,
      refreshToken: tokens.RefreshToken,
    });
  } catch (err) {
    if (err.name === 'NotAuthorizedException') {
      return response.badRequest('Fel e-post eller lösenord');
    }
    if (err.name === 'UserNotFoundException') {
      return response.badRequest('Användaren hittades inte');
    }
    console.error('login error:', err);
    return response.serverError('Kunde inte logga in');
  }
};
