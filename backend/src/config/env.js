
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'wash_n_dash_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },

  jwtSecret: process.env.JWT_SECRET || 'development_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
};
