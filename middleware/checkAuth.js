const axios = require('axios');
if(process.env.NODE_ENV != "production") require('dotenv').config();
const AUTH_SERVICE_HOST = process.env.AUTH_SERVICE_HOST;

//Explanation: This is a middleware function that will be used to validate the token sent by the client.
module.exports = async (req, res, next) => {

    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(400).json({ success: false, message: 'Token not provided' });
    }
    try {
        const response = await axios.post(
            `${AUTH_SERVICE_HOST}/validate`,
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
        let fetchUserId = response.data.userId;
        if (typeof fetchUserId === 'string') {
            req.userId = fetchUserId.replace(/^"|"$/g, '');
          } else {
            req.userId = fetchUserId;
            // Handle the case where fetchUserId is not a string (optional)
            console.error('fetchUserId is not a string:', fetchUserId);
          }

        next();
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response details:', error.response.data);
            return res.status(error.response.status).json(error.response.data);
        } else {
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}