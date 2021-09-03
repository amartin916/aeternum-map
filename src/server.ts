import dotenv from 'dotenv';
dotenv.config();

const { PORT, MONGODB_URI, SCREENSHOTS_PATH } = process.env;

if (typeof PORT !== 'string') {
  throw new Error('PORT is not set');
}
if (typeof MONGODB_URI !== 'string') {
  throw new Error('MONGODB_URI is not set');
}
if (typeof SCREENSHOTS_PATH !== 'string') {
  throw new Error('SCREENSHOTS_PATH environment variable is not set');
}

import express from 'express';
import router from './lib/router';
import { connectToMongoDb } from './lib/db';
import { ensureMarkersSchema, ensureMarkersIndexes } from './lib/markers';
import { ensureCommentsIndexes, ensureCommentsSchema } from './lib/comments';

const app = express();

// Middleware to set CORS headers
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Middleware that parses json and looks at requests where the Content-Type header matches the type option.
app.use(express.json());

// Serve API requests from the router
app.use('/api', router);

// Static screenshots folder
app.use('/screenshots', express.static(SCREENSHOTS_PATH));

// Static screenshots folder
app.use('/assets', express.static('src/assets'));

// All other requests are answered with a 404
app.get('*', (_req, res) => {
  res.status(404).send('Not found');
});

connectToMongoDb(MONGODB_URI).then(async () => {
  console.log('Connected to MongoDB');
  await ensureMarkersIndexes();
  await ensureMarkersSchema();
  await ensureCommentsIndexes();
  await ensureCommentsSchema();

  app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
  });
});
