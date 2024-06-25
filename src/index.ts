import express from 'express';
const expressApp = require('./express-app');
const { databaseConnection } = require('./database');

const StartServer = async() => {
    const app = express();
    expressApp(app);
    const PORT: number = parseInt(process.env.PORT as string, 10) || 5002;
    await databaseConnection();
    
    app.listen(PORT, () => {
          console.log(`Payment server is listening to port ${PORT}`);
    })
}

StartServer();