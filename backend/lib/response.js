const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
};

const json = (statusCode, body) => ({
  statusCode,
  headers: HEADERS,
  body: JSON.stringify(body),
});

module.exports = {
  success: (data) => json(200, data),
  created: (data) => json(201, data),
  badRequest: (message) => json(400, { error: message }),
  notFound: (message) => json(404, { error: message }),
  serverError: (message) => json(500, { error: message }),
};

/*    Design Choices Summary
  Choice / Tool             | Reason / Benefit                                                | Source
  --------------------------|-----------------------------------------------------------------|------------------------------------------------------------
  Centralized HEADERS       | Defined once and reused for all Lambda responses (DRY principle)| CORS: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
  JSON.stringify(body)      | API Gateway requires the body to be a string, not an object     | AWS Lambda docs: https://docs.aws.amazon.com/lambda/latest/dg/services-apigateway.html
  CORS wildcard (*)         | Allows Expo Go / mobile apps to access API during development   | CORS: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
  Named response methods    | `response.success()` etc. is more readable than `json(200, ...)`| General coding practice / readability
  Semantic HTTP status codes| Makes API predictable and easier to debug for the frontend      | HTTP status codes: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
*/
