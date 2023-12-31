const router = require('express').Router();
const { validationResult, param, query, oneOf, body } = require('express-validator');
const checkAuth = require('../middleware/checkAuth');
const requestLimiter = require('../middleware/requestLimiter');
const db = require('../database/items')
const dbUsers = require('../database/users');
const dbWishlists = require('../database/wishlists');
const dbGifts = require('../database/gifts');

//GET /gifts/getAll?userId=...&limit=...&offset=...
//NOTE: if the user in the token is the same as the beneficiary of the gift = unauthorized (ONLY THE ONES WITH THAT CONDITION)
//headers: {Authorization: Bearer token}

//GET /gifts/getId?giftName=... 
//headers: {Authorization: Bearer token}

//GET /gifts/get?giftId=...
//NOTE: if the user in the token is the same as the beneficiary of the gift = unauthorized

// POST /gifts/create
//NOTE: the user in the token is the creator of the gift
//headers: {Authorization: Bearer token}
// body: {userId -> gifted, wishlistName, itemName, itemDescription, itemPrice, itemLink, image_name}

// DELETE /gifts/delete
//NOTE: the user in the token is the creator of the gift
//headers: {Authorization: Bearer token}
// body: {userId -> logged, gift_id}

// PATCH /gifts/edit
//NOTE: the user in the token is the creator of the gift
//headers: {Authorization: Bearer token}
// body: {userId -> logged, gift_id, itemName, itemDescription, itemPrice, itemLink, image_name}

// GET /gifts/getImplicationRequests?giftId=...
//NOTE: the user in the token is the creator of the gift otherwise unauthorized
//headers: {Authorization: Bearer token}

// POST /gifts/implication/accept
//NOTE: the user in the token is the creator of the gift otherwise unauthorized
//headers: {Authorization: Bearer token}
// body: {userId, gift_id}

// DELETE /gifts/implication/reject
//NOTE: the user in the token is the creator of the gift otherwise unauthorized
//headers: {Authorization: Bearer token}
// body: {userId, gift_id}

// GET /gifts/getImplications?giftId=...
//NOTE: if the user in the token is the same as the beneficiary of the gift = unauthorized

// POST /gifts/complete
//NOTE: the user in the token is the creator of the gift

//headers: {Authorization: Bearer token}
// body: {userId -> logged, gift_id}



module.exports = router;