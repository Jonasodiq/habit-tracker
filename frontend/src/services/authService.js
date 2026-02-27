import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AWS_CONFIG } from '../config/aws-config';

// Initiera Cognito User Pool
const userPool = new CognitoUserPool({
  UserPoolId: AWS_CONFIG.userPoolId,
  ClientId: AWS_CONFIG.userPoolWebClientId,
});

// Storage keys
const STORAGE_KEYS = {
  USER_TOKEN: '@habit_tracker:user_token',
  USER_DATA: '@habit_tracker:user_data',
  REFRESH_TOKEN: '@habit_tracker:refresh_token',
};

/**
 * AUTH SERVICE
 * Hanterar all autentisering med AWS Cognito
 */
const authService = {
  /**
   * Registrera ny användare
   * @param {string} email - Användarens email
   * @param {string} password - Lösenord
   * @param {string} name - Användarens namn
   * @returns {Promise} - Resolve med användare, reject med error
   */
  signUp: (email, password, name) => {
    return new Promise((resolve, reject) => {
      const attributeList = [];

      // Email attribute (required)
      const dataEmail = {
        Name: 'email',
        Value: email,
      };
      const attributeEmail = new CognitoUserAttribute(dataEmail);
      attributeList.push(attributeEmail);

      // Name attribute (optional)
      if (name) {
        const dataName = {
          Name: 'name',
          Value: name,
        };
        const attributeName = new CognitoUserAttribute(dataName);
        attributeList.push(attributeName);
      }

      // Registrera användare
      userPool.signUp(email, password, attributeList, null, (err, result) => {
        if (err) {
          console.error('SignUp error:', err);
          reject(err);
          return;
        }

        const cognitoUser = result.user;
        console.log('User registered:', cognitoUser.getUsername());
        resolve({
          username: cognitoUser.getUsername(),
          userConfirmed: result.userConfirmed,
          userSub: result.userSub,
        });
      });
    });
  },

  /**
   * Bekräfta email med verification code
   * @param {string} username - Användarnamn (email)
   * @param {string} code - Verifieringskod från email
   * @returns {Promise}
   */
  confirmSignUp: (username, code) => {
    return new Promise((resolve, reject) => {
      const userData = {
        Username: username,
        Pool: userPool,
      };

      const cognitoUser = new CognitoUser(userData);

      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          console.error('Confirmation error:', err);
          reject(err);
          return;
        }

        console.log('Confirmation successful:', result);
        resolve(result);
      });
    });
  },

  /**
   * Skicka om verifieringskod
   * @param {string} username - Användarnamn (email)
   * @returns {Promise}
   */
  resendConfirmationCode: (username) => {
    return new Promise((resolve, reject) => {
      const userData = {
        Username: username,
        Pool: userPool,
      };

      const cognitoUser = new CognitoUser(userData);

      cognitoUser.resendConfirmationCode((err, result) => {
        if (err) {
          console.error('Resend code error:', err);
          reject(err);
          return;
        }

        console.log('Code resent:', result);
        resolve(result);
      });
    });
  },

  /**
   * Logga in användare
   * @param {string} username - Användarnamn (email)
   * @param {string} password - Lösenord
   * @returns {Promise} - Resolve med user data och tokens
   */
  signIn: (username, password) => {
    return new Promise((resolve, reject) => {
      const authenticationData = {
        Username: username,
        Password: password,
      };

      const authenticationDetails = new AuthenticationDetails(authenticationData);

      const userData = {
        Username: username,
        Pool: userPool,
      };

      const cognitoUser = new CognitoUser(userData);

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: async (result) => {
          // Hämta tokens
          const accessToken = result.getAccessToken().getJwtToken();
          const idToken = result.getIdToken().getJwtToken();
          const refreshToken = result.getRefreshToken().getToken();

          // Hämta användarattribut
          cognitoUser.getUserAttributes((err, attributes) => {
            if (err) {
              console.error('Get attributes error:', err);
              reject(err);
              return;
            }

            // Konvertera attribut till objekt
            const userAttributes = {};
            attributes.forEach((attr) => {
              userAttributes[attr.Name] = attr.Value;
            });

            const userData = {
              username: cognitoUser.getUsername(),
              email: userAttributes.email,
              name: userAttributes.name || '',
              emailVerified: userAttributes.email_verified === 'true',
              sub: userAttributes.sub, // Unique user ID
            };

            // Spara tokens och user data lokalt
            authService.saveUserData(userData, accessToken, refreshToken)
              .then(() => {
                console.log('User signed in successfully:', userData.email);
                resolve({
                  user: userData,
                  tokens: {
                    accessToken,
                    idToken,
                    refreshToken,
                  },
                });
              })
              .catch(reject);
          });
        },

        onFailure: (err) => {
          console.error('SignIn error:', err);
          reject(err);
        },

        newPasswordRequired: (userAttributes, requiredAttributes) => {
          // Om användaren behöver byta lösenord (första gången)
          // Detta händer om admin skapar användare i console
          console.log('New password required');
          reject({
            code: 'NewPasswordRequired',
            message: 'User must set a new password',
            userAttributes,
            requiredAttributes,
          });
        },
      });
    });
  },

  /**
   * Logga ut användare
   * @returns {Promise}
   */
  signOut: async () => {
    try {
      const cognitoUser = userPool.getCurrentUser();
      
      if (cognitoUser) {
        cognitoUser.signOut();
      }

      // Rensa lokal storage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.REFRESH_TOKEN,
      ]);

      console.log('User signed out successfully');
      return true;
    } catch (error) {
      console.error('SignOut error:', error);
      throw error;
    }
  },

  /**
   * Hämta nuvarande användare
   * @returns {Promise} - User data eller null
   */
  getCurrentUser: async () => {
    try {
      const cognitoUser = userPool.getCurrentUser();

      if (!cognitoUser) {
        return null;
      }

      return new Promise((resolve, reject) => {
        cognitoUser.getSession((err, session) => {
          if (err) {
            console.error('Get session error:', err);
            reject(err);
            return;
          }

          if (!session.isValid()) {
            resolve(null);
            return;
          }

          cognitoUser.getUserAttributes((err, attributes) => {
            if (err) {
              console.error('Get attributes error:', err);
              reject(err);
              return;
            }

            const userAttributes = {};
            attributes.forEach((attr) => {
              userAttributes[attr.Name] = attr.Value;
            });

            const userData = {
              username: cognitoUser.getUsername(),
              email: userAttributes.email,
              name: userAttributes.name || '',
              emailVerified: userAttributes.email_verified === 'true',
              sub: userAttributes.sub,
            };

            resolve(userData);
          });
        });
      });
    } catch (error) {
      console.error('getCurrentUser error:', error);
      return null;
    }
  },

  /**
   * Hämta access token för API-anrop
   * @returns {Promise<string>} - Access token
   */
  getAccessToken: async () => {
    try {
      const cognitoUser = userPool.getCurrentUser();

      if (!cognitoUser) {
        throw new Error('No current user');
      }

      return new Promise((resolve, reject) => {
        cognitoUser.getSession((err, session) => {
          if (err) {
            reject(err);
            return;
          }

          if (!session.isValid()) {
            reject(new Error('Session is not valid'));
            return;
          }

          const accessToken = session.getAccessToken().getJwtToken();
          resolve(accessToken);
        });
      });
    } catch (error) {
      console.error('getAccessToken error:', error);
      throw error;
    }
  },

  /**
   * Glömt lösenord - skicka reset code
   * @param {string} username - Användarnamn (email)
   * @returns {Promise}
   */
  forgotPassword: (username) => {
    return new Promise((resolve, reject) => {
      const userData = {
        Username: username,
        Pool: userPool,
      };

      const cognitoUser = new CognitoUser(userData);

      cognitoUser.forgotPassword({
        onSuccess: (data) => {
          console.log('Password reset code sent:', data);
          resolve(data);
        },
        onFailure: (err) => {
          console.error('Forgot password error:', err);
          reject(err);
        },
      });
    });
  },

  /**
   * Bekräfta nytt lösenord med reset code
   * @param {string} username - Användarnamn (email)
   * @param {string} code - Verifieringskod från email
   * @param {string} newPassword - Nytt lösenord
   * @returns {Promise}
   */
  confirmPassword: (username, code, newPassword) => {
    return new Promise((resolve, reject) => {
      const userData = {
        Username: username,
        Pool: userPool,
      };

      const cognitoUser = new CognitoUser(userData);

      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => {
          console.log('Password successfully reset');
          resolve();
        },
        onFailure: (err) => {
          console.error('Confirm password error:', err);
          reject(err);
        },
      });
    });
  },

  /**
   * Ändra lösenord (när användare är inloggad)
   * @param {string} oldPassword - Nuvarande lösenord
   * @param {string} newPassword - Nytt lösenord
   * @returns {Promise}
   */
  changePassword: (oldPassword, newPassword) => {
    return new Promise((resolve, reject) => {
      const cognitoUser = userPool.getCurrentUser();

      if (!cognitoUser) {
        reject(new Error('No current user'));
        return;
      }

      cognitoUser.getSession((err, session) => {
        if (err) {
          reject(err);
          return;
        }

        cognitoUser.changePassword(oldPassword, newPassword, (err, result) => {
          if (err) {
            console.error('Change password error:', err);
            reject(err);
            return;
          }

          console.log('Password changed successfully');
          resolve(result);
        });
      });
    });
  },

  /**
   * Spara user data och tokens lokalt
   * @private
   */
  saveUserData: async (userData, accessToken, refreshToken) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, accessToken);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    } catch (error) {
      console.error('Save user data error:', error);
      throw error;
    }
  },

  /**
   * Hämta sparad user data
   * @returns {Promise<Object|null>}
   */
  getSavedUserData: async () => {
    try {
      const userDataString = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userDataString ? JSON.parse(userDataString) : null;
    } catch (error) {
      console.error('Get saved user data error:', error);
      return null;
    }
  },
};

export default authService;