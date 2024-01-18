const rateLimit = require('express-rate-limit');

const requestLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    keyGenerator: (req) => req.headers['x-forwarded-for'] || req.ip,
});

module.exports = requestLimiter;