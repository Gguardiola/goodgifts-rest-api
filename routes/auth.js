const router = require('express').Router();
const axios = require('axios');
const checkAuth = require('../middleware/checkAuth');
const requestLimiter = require('../middleware/requestLimiter');
if(process.env.NODE_ENV != "production") require('dotenv').config();
const AUTH_SERVICE_HOST = process.env.AUTH_SERVICE_HOST; 
//Explanation: These are the routes that will be used by the client to signup and login.

const dbUsers = require('../database/dbUsers');
const dbWishlists = require('../database/dbWishlists');
// POST /auth/signup
router.post('/signup', requestLimiter, async (req, res) => {
    const { email, password, username, lastname, birthday } = req.body;

    try {
        const response = await axios.post(`${AUTH_SERVICE_HOST}/signup`, { email, password, username, lastname, birthday });
        if (!response.data.success) {
            return res.status(response.status).json(response.data);
        }
        res.json({success: true, message: 'Signup successful'});
        const currentUserId = await dbUsers.retrieveUserId(email);
        dbWishlists.createWishlist(currentUserId.rows[0].id, "My Wishlist");

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response details:', error.response.data);
            return res.status(error.response.status).json(error.response.data);
        } else {
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
    
});

// POST /auth/login
router.post('/login', requestLimiter, async (req, res) => {
    const { email, password } = req.body;

    try {
        const response = await axios.post(`${AUTH_SERVICE_HOST}/login`, { email, password });
        if (!response.data.success) {
            return res.status(response.status).json(response.data);
        }
        res.json({success: true, token: response.data.token});

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response details:', error.response.data);
            return res.status(error.response.status).json(error.response.data);
        } else {
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

});

// POST /auth/logout
router.post('/logout', checkAuth, async (req, res) => {
    
    try {
        const response = await axios.post(
            `${AUTH_SERVICE_HOST}/logout`,
            {},
            {
                headers: {
                    Authorization: req.headers.authorization
                }
            }
        );
        if (!response.data.success) {
            return res.status(response.status).json(response.data);
        }
        res.json({success: true, message: 'Logout successful'});

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response details:', error.response.data);
            return res.status(error.response.status).json(error.response.data);
        } else {
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

});

module.exports = router;