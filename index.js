const express = require('express');
const app = express();
app.use(express.json());

const auth = require('./routes/auth');
const users = require('./routes/users');
const friends = require('./routes/friends');
const wishlists = require('./routes/wishlists');
const items = require('./routes/items');

if(process.env.NODE_ENV != "production") require('dotenv').config();
const LISTEN_PORT = process.env.PORT;

app.use('/auth', auth);
app.use('/users', users);
app.use('/friends', friends);
app.use('/wishlists', wishlists);
app.use('items', items);

app.listen(LISTEN_PORT, () => {
    console.log("Goodgifts REST API is running on port "+ LISTEN_PORT);

});