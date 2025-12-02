import 'dotenv/config';
import { Sequelize } from '@sequelize/core';
import { PostgresDialect } from '@sequelize/postgres';

const dbName = process.env.APP_DB_NAME || '';
const dbUser = process.env.APP_DB_USER || '';
const dbPassword = process.env.APP_DB_PASSWORD || '';

const db = new Sequelize({
  // @ts-ignore
  dialect: PostgresDialect,
  database: dbName,
  user: dbUser,
  password: dbPassword,
  host: 'localhost',
  port: 5432,
  ssl: false,
  clientMinMessages: 'notice',
});

export default db;
