const axios = require('axios');
if(process.env.NODE_ENV != "production") require('dotenv').config();
const AUTH_SERVICE_HOST = process.env.AUTH_SERVICE_HOST;

module.exports = async (req, res, next) => {

    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ success: false, message: 'Token not provided' });
    }

    try {
        const response = await axios.post(`${AUTH_SERVICE_HOST}/validate`, { authorization });
        if (!response.data.success) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        next();
    } catch (error) {
        console.error('Error validating token:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}