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
