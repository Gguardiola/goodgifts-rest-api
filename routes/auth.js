const router = require('express').Router();
const {check, validationResult} = require('express-validator');
const axios = require('axios');
if(process.env.NODE_ENV != "production") require('dotenv').config();
const AUTH_SERVICE_HOST = process.env.AUTH_SERVICE_HOST;

router.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    try {
        const response = await axios.post(`${AUTH_SERVICE_HOST}/signup`, { email, password });
        if (!response.data.success) {
            return res.status(400).json({ success: false, message: response.data.message });
        }
        res.json({token: response.data.token});

    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
    
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const response = await axios.post(`${AUTH_SERVICE_HOST}/login`, { email, password });
        if (!response.data.success) {
            return res.status(400).json({ success: false, message: response.data.message });
        }
        res.json({token: response.data.token});

    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }

});

router.get("/all", (req, res) => {
    res.json(users);
});
module.exports = router;