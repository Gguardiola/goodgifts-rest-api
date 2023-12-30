const router = require('express').Router();
const { validationResult, param, query, oneOf, body } = require('express-validator');
const checkAuth = require('../middleware/checkAuth');
const requestLimiter = require('../middleware/requestLimiter');
const db = require('../database/wishlists')
const dbUsers = require('../database/users')
const decodeString = require('../utils/decodeString');

// GET /wishlists/getAll?userId=...&limit=...&offset=...
router.get('/getAll',[
    query('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    query('limit').isInt({ min: 1 }).toInt().withMessage('Invalid limit'),
    query('offset').isInt({ min: 0 }).toInt().withMessage('Invalid offset'),

], checkAuth, async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const requestedUser = req.query.userId;
        const {limit, offset} = req.query;
        let user = await dbUsers.checkIfUserExists(requestedUser);
        if(!user.rows.length > 0) {
            console.log("Error: User NOT exists");
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        let wishlists = await db.retrieveUserWishlists(requestedUser, limit, offset);
        
        if (!wishlists.rows.length > 0) {
            return res.json({ success: true, wishlists: [] });
        }
        
        wishlists = wishlists.rows;
        return res.json({ success: true, wishlists });
      } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
});

// GET /wishlists/get?userId=... &wishlistName=...
router.get('/get',[
    query('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    query('wishlistName').isLength({ min: 5 }).isString().withMessage('Invalid wishlistName')

], checkAuth, async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const requestedUser = req.query.userId;
        const wishlistName =  decodeString(req.query.wishlistName);
        let user = await dbUsers.checkIfUserExists(requestedUser);
        if(!user.rows.length > 0) {
            console.log("Error: User NOT exists");
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        let wishlist = await db.retrieveWishlist(requestedUser, wishlistName);

        if (!wishlist.rows.length > 0) {
            return res.status(404).json({ success: false, message: 'Wishlist not found' });
        }

        wishlist = wishlist.rows[0];
        let items = await db.retrieveWishlistItems(requestedUser, wishlistName);

        if (!items.rows.length > 0) {
            return res.json({ success: true, wishlistName: wishlist.wishlist_name, createdAt: wishlist.created_at, items: [] });
        }
        items = items.rows;
        return res.json({ success: true, wishlistName: wishlist.wishlist_name, createdAt: wishlist.created_at, items });

    } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /wishlists/create
router.post('/create',[
    body('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    body('wishlistName').isLength({ min: 5 }).isString().withMessage('Invalid wishlistName')

], requestLimiter, checkAuth, async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const userId = req.userId;
        const wishlistName = req.body.wishlistName;
        const requestedUser = req.body.userId;
        if (userId == requestedUser) {
            let wishlist = await db.retrieveWishlist(userId, wishlistName);
            if (wishlist.rows.length > 0) {
                return res.status(400).json({ success: false, message: 'Wishlist already exists' });
            }
            await db.createWishlist(userId, wishlistName);
            return res.json({ success: true, message: 'Wishlist created successfully' });
        }
        else {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

    } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// DELETE /wishlists/delete
router.delete('/delete',[
    body('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    body('wishlistName').isLength({ min: 5 }).isString().withMessage('Invalid wishlistName')

], requestLimiter, checkAuth, async (req, res) => {
    
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const userId = req.userId;
        const wishlistName = req.body.wishlistName;
        const requestedUser = req.body.userId;
        if (userId == requestedUser) {
            let wishlist = await db.retrieveWishlist(userId, wishlistName);
            if (!wishlist.rows.length > 0) {
                return res.status(404).json({ success: false, message: 'Wishlist not found' });
            }
            await db.deleteWishlist(userId, wishlistName);
            return res.json({ success: true, message: 'Wishlist deleted successfully' });
        }
        else {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// PATCH /wishlists/edit
router.patch('/edit',[
    body('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    body('wishlistName').isLength({ min: 5 }).isString().withMessage('Invalid wishlistName'),
    body('newName').isLength({ min: 5 }).isString().withMessage('Invalid newName')

], requestLimiter, checkAuth, async (req, res) => {
    
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const userId = req.userId;
        const wishlistName = req.body.wishlistName;
        const newName = req.body.newName;
        const requestedUser = req.body.userId;
        if (userId == requestedUser) {
            let wishlist = await db.retrieveWishlist(userId, wishlistName);
            if (!wishlist.rows.length > 0) {
                return res.status(404).json({ success: false, message: 'Wishlist not found' });
            }
            await db.editWishlist(userId, wishlistName, newName);
            return res.json({ success: true, message: 'Wishlist edited successfully' });
        }
        else {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});



////// ITEMS //////

//PAGINATION!
//GET /items/get/:itemId/:userId
//headers: {Authorization: Bearer token}

// POST /items/add
//headers: {Authorization: Bearer token}
// body: {userId, wishlistName, itemName, itemDescription, itemPrice, itemLink, image_name}

// DELETE /items/delete
//headers: {Authorization: Bearer token}
// body: {userId, wishlistName, itemName}

// PATCH /items/edit
//headers: {Authorization: Bearer token}
// body: {userId, wishlistName, itemName, newName, itemDescription, itemPrice, itemLink, image_name}

///// GIFTS /////

//PAGINATION!
//GET /gifts/getAll/:userId/:state
//headers: {Authorization: Bearer token}

//GET /gifts/get/:giftName
//headers: {Authorization: Bearer token}

// POST /gifts/create
//headers: {Authorization: Bearer token}
// body: {userId -> gifted, wishlistName, itemName, itemDescription, itemPrice, itemLink, image_name}

// DELETE /gifts/delete
//headers: {Authorization: Bearer token}
// body: {userId -> logged, gift_id}

// PATCH /gifts/edit
//headers: {Authorization: Bearer token}
// body: {userId -> logged, gift_id, itemName, itemDescription, itemPrice, itemLink, image_name}

// GET /gifts/getImplicationRequests/:giftId
//headers: {Authorization: Bearer token}

// POST /gifts/implication/accept
//headers: {Authorization: Bearer token}
// body: {userId, gift_id}

// DELETE /gifts/implication/reject
//headers: {Authorization: Bearer token}
// body: {userId, gift_id}

// GET /gifts/getImplications/:giftId

// POST /gifts/complete
//headers: {Authorization: Bearer token}
// body: {userId -> logged, gift_id}



module.exports = router;