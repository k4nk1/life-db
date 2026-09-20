const path = require('path');

process.env.DATABASE_URL = `file:${path.resolve(__dirname, 'prisma/test.db')}`;

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
};
