const rateLimit = require('express-rate-limit');

const requestLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Too many requests from this IP, please try again later.',
});

module.exports = requestLimiter;