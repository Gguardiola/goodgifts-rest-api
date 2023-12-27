const express = require('express');
const auth = require('./routes/auth');
const posts = require('./routes/posts');
const app = express();
app.use(express.json());
if(process.env.NODE_ENV != "production") require('dotenv').config();
const LISTEN_PORT = process.env.PORT;

app.get('/', (req, res) => {
    res.send('Hello World!');

});

app.use('/auth', auth);
app.use('/posts', posts);


app.listen(LISTEN_PORT, () => {
    console.log("Goodgifts REST API is running on port "+ LISTEN_PORT);

});