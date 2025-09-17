try {
  require('dotenv').config();
  console.log('📄 .env yüklendi');
} catch (e) {
  console.log('📄 No .env file found - using hosting environment variables');
}
module.exports = {};
