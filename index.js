const express = require('express');
const app = express();
// const cors = require('cors');
// app.use(cors());
app.set('trust proxy', true);
app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

const auth = require('./routes/auth');
const users = require('./routes/users');
const friends = require('./routes/friends');
const wishlists = require('./routes/wishlists');
const items = require('./routes/items');
const gifts = require('./routes/gifts');

if(process.env.NODE_ENV != "production") require('dotenv').config();
const LISTEN_PORT = process.env.PORT;

app.use('/goodgifts/auth', auth);
app.use('/goodgifts/users', users);
app.use('/goodgifts/friends', friends);
app.use('/goodgifts/wishlists', wishlists);
app.use('/goodgifts/items', items);
app.use('/goodgifts/gifts', gifts);

app.listen(LISTEN_PORT, () => {
    console.log("Goodgifts REST API is running on port "+ LISTEN_PORT);

});