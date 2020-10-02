const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log(err);
  console.log('UNCAUGHT EXCEPTION! Shutting down....');
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB =
  'mongodb+srv://ghaith:7x5cxmkv7x5cxmkv@cluster0.xrkih.mongodb.net/natrous?retryWrites=true&w=majority';

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB connection successful');
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on Port ${port}`);
});

process.on('unHandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLER REJECTION! Shutting down....');
  server.close(() => {
    process.exit(1);
  });
});
