import { Sequelize } from '@sequelize/core';
import { PostgresDialect } from '@sequelize/postgres';
import { getRequiredSecret } from '@/utils/secrets.js';

// Load dotenv only in development
if (process.env.NODE_ENV !== 'production') {
  await import('dotenv/config');
}

const dbName = getRequiredSecret('APP_DB_NAME', 'Database name');
const dbUser = getRequiredSecret('APP_DB_USER', 'Database user');
const dbPassword = getRequiredSecret('APP_DB_PASSWORD', 'Database password');
const dbHost = process.env.APP_DB_HOST ?? 'localhost';
const dbPort = parseInt(process.env.APP_DB_PORT ?? '5432', 10);

const db = new Sequelize({
  dialect: PostgresDialect,
  database: dbName,
  user: dbUser,
  password: dbPassword,
  host: dbHost,
  port: dbPort,
  ssl: false,
  clientMinMessages: 'notice',
  pool: {
    max: 3,
    min: 1,
    acquire: 30000,
    idle: 10000,
  },
});

export default db;
