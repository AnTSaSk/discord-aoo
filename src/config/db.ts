import 'dotenv/config';
import { Sequelize } from 'sequelize';

const dbName = process.env.APP_DB_NAME || '';
const dbUser = process.env.APP_DB_USER || '';
const dbPassword = process.env.APP_DB_PASSWORD || '';

const db = new Sequelize(
  dbName,
  dbUser,
  dbPassword,
  {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'database.sqlite',
  }
);

export default db;
