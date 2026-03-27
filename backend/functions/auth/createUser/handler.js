const {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminConfirmSignUpCommand,
  InitiateAuthCommand,
} = require('@aws-sdk/client-cognito-identity-provider');
const { dynamo, PutCommand } = require('../../../lib/dynamodb');
const response = require('../../../lib/response');

const TABLE = process.env.USERS_TABLE;
const POOL_ID = process.env.COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;

const cognito = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'eu-north-1',
});

// POST /auth
module.exports.createUser = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password, name } = body;

    if (!email || !password) {
      return response.badRequest('email och password krävs');
    }

    // 1. Register i Cognito
    const signUpResult = await cognito.send(
      new SignUpCommand({
        ClientId: CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'name', Value: name || '' },
        ],
      }),
    );

    const sub = signUpResult.UserSub;

    // 2. Confirm 
    await cognito.send(
      new AdminConfirmSignUpCommand({
        UserPoolId: POOL_ID,
        Username: email,
      }),
    );

    // 3. Log in and get token
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

    // 4. Save to DynamoDB
    const user = {
      userId: sub,
      email: email,
      name: name || '',
      createdAt: new Date().toISOString(),
    };

    await dynamo.send(
      new PutCommand({
        TableName: TABLE,
        Item: user,
        ConditionExpression: 'attribute_not_exists(userId)',
      }),
    );

    return response.created({
      user,
      accessToken: tokens.AccessToken,
      idToken: tokens.IdToken,
      refreshToken: tokens.RefreshToken,
    });
  } catch (err) {
    if (err.name === 'UsernameExistsException') {
      return response.badRequest('E-postadressen används redan');
    }
    if (
      err.name === 'InvalidPasswordException' ||
      err.name === 'InvalidParameterException'
    ) {
      return response.badRequest(err.message);
    }
    console.error('createUser error:', err);
    return response.serverError('Kunde inte skapa användare');
  }
};
