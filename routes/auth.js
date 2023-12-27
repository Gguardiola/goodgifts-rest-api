const router = require('express').Router();
const {check, validationResult} = require('express-validator');
const axios = require('axios');
if(process.env.NODE_ENV != "production") require('dotenv').config();
const AUTH_SERVICE_HOST = process.env.AUTH_SERVICE_HOST; 
//Explanation: These are the routes that will be used by the client to signup and login.

// POST /auth/signup
router.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    try {
        const response = await axios.post(`${AUTH_SERVICE_HOST}/signup`, { email, password });
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

// POST /auth/login
router.post('/login', async (req, res) => {
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

module.exports = router;