const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const http = require('http');
const app = require('./app');
const mongoose = require('mongoose');
const server = http.createServer(app);

console.log('Starting app..');
console.log('Waiting for connection to MongoDB');

mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true})
  .then(() => {
    console.log('Connected to MongoDB!')
    console.log('Starting webserver..')
    server.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`)
    });
  })
  .catch((e) => {
    console.log('Could not connect to MongoDB server! Shutting down...')
    console.log(e)
    process.exit(1);
  });
