const app = require('./app');
require('dotenv').config();
const logger = require('./logger');

let server = app.listen(process.env.PORT, () => {
    logger.info(`Listening to port ${process.env.PORT}`);
});

