
const app = require('./app');
const env = require('./config/env');

const PORT = process.env.PORT || env.port || 5000;

app.listen(PORT, () => {
  console.log(`Wash n' Dash API server running on port ${PORT}`);
});
