const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());

const auth = require('./routes/auth');
const users = require('./routes/users');
const friends = require('./routes/friends');
const wishlists = require('./routes/wishlists');
const items = require('./routes/items');
const gifts = require('./routes/gifts');

if(process.env.NODE_ENV != "production") require('dotenv').config();
const LISTEN_PORT = process.env.PORT;

app.use('/auth', auth);
app.use('/users', users);
app.use('/friends', friends);
app.use('/wishlists', wishlists);
app.use('/items', items);
app.use('/gifts', gifts);

app.listen(LISTEN_PORT, () => {
    console.log("Goodgifts REST API is running on port "+ LISTEN_PORT);

});