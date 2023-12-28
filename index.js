const express = require('express');
const auth = require('./routes/auth');
const posts = require('./routes/posts');
const users = require('./routes/users');
const app = express();
app.use(express.json());
if(process.env.NODE_ENV != "production") require('dotenv').config();
const LISTEN_PORT = process.env.PORT;

app.use('/auth', auth);
app.use('/posts', posts);
app.use('/users', users)

app.listen(LISTEN_PORT, () => {
    console.log("Goodgifts REST API is running on port "+ LISTEN_PORT);

});