const router = require('express').Router();
const { validationResult, param, query, oneOf, body } = require('express-validator');
const checkAuth = require('../middleware/checkAuth');
const requestLimiter = require('../middleware/requestLimiter');
const db = require('../database/items')
const dbUsers = require('../database/users');
const dbWishlists = require('../database/wishlists');

//FIXME: delete cascade when deleting a wishlist! (must delete the items, gifts and implications)

//GET /items/getAll?userId=...&limit=...&offset=...
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
        const { limit, offset } = req.query;
        let user = await dbUsers.checkIfUserExists(requestedUser);
        if(!user.rows.length > 0) {
            console.log("Error: User NOT exists");
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        let items = await db.retrieveAllUserItems(requestedUser, limit, offset);
        
        if (!items.rows.length > 0) {
            return res.status(404).json({ success: true, items: [] });
        }
        
        items = items.rows;
        return res.json({ success: true, items });
    } catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

//GET /items/get?userId=...&itemName=...
router.get('/get',[
    query('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    query('itemName').isLength({ min: 1 }).withMessage('Invalid itemName'),

], checkAuth, async (req, res) => {
    
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const requestedUser = req.query.userId;
        const itemName = decodeURIComponent(req.query.itemName);
        let user = await dbUsers.checkIfUserExists(requestedUser);
        if(!user.rows.length > 0) {
            console.log("Error: User NOT exists");
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        let item = await db.retrieveUserItem(requestedUser, itemName);
        
        if (!item.rows.length > 0) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        
        item = item.rows[0];
        return res.json({ success: true, item });
    } catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /items/create
router.post('/create',[
    body('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    body('item_name').isLength({ min: 1 }).withMessage('Invalid item_name'),
    body('item_description').isLength({ min: 1 }).withMessage('Invalid item_description'),
    body('item_url').isLength({ min: 1 }).withMessage('Invalid item_url'),
    body('image_name').isLength({ min: 1 }).withMessage('Invalid image_name'),
], checkAuth, async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const userId = req.userId;
        const requestedUser = req.body.userId;
        const { item_name, item_description, item_url, image_name } = req.body;
        
        if (userId == requestedUser) {

            let item = await db.retrieveUserItem(requestedUser, item_name);
            if (item.rows.length > 0) {
                return res.status(409).json({ success: false, message: 'Item already exists' });
            }
            await db.createItem(requestedUser, item_name, item_description, item_url, image_name);
            return res.json({ success: true, message: 'Item created' });

        }
        else {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
    }
    catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }   
});

// DELETE /items/delete
router.delete('/delete',[
    body('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    body('item_name').isLength({ min: 1 }).withMessage('Invalid item name'),
], checkAuth, async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const userId = req.userId;
        const requestedUser = req.body.userId;
        const { item_name } = req.body;

        if (userId == requestedUser) {
            let item = await db.retrieveUserItem(requestedUser, item_name);
            if (!item.rows.length > 0) {
                return res.status(404).json({ success: false, message: 'Item not found' });
            }
            item = item.rows[0];
            const itemId = item.id;
            await db.deleteItem(requestedUser, itemId);
            return res.json({ success: true, message: 'Item deleted successfully' });
        }
        else {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
    }
    catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// PATCH /items/edit
router.patch('/edit',[
    body('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    body('itemId').isLength({ min: 1 }).withMessage('Invalid itemId'),
    oneOf([
        body('item_name').isLength({ min: 1 }).withMessage('Invalid item_name'),
        body('item_description').isLength({ min: 1 }).withMessage('Invalid item_description'),
        body('item_url').isLength({ min: 1 }).withMessage('Invalid item_url'),
        body('image_name').isLength({ min: 1 }).withMessage('Invalid image_name'),
      ])
], checkAuth, async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const userId = req.userId;
        const itemId = req.body.itemId;
        const requestedUser = req.body.userId;
        const {item_name, item_description, item_url, image_name} = req.body;

        if(userId == requestedUser) {
            
            item = await db.retrieveItemById(itemId);
            if (!item.rows.length > 0) {
                return res.status(404).json({ success: false, message: 'Item not found' });
            }
            
            const editFields = { item_name, item_description, item_url, image_name};
            const filteredEditFields = Object.fromEntries(
            Object.entries(editFields).filter(([key, value]) => value !== undefined)
            )
            if (Object.keys(filteredEditFields).length === 0) {
            return res.status(400).json({ success: false, message: 'At least one field is required' });
            }
            console.log('Editing item with the following fields:', filteredEditFields);
            await db.editItem(itemId, filteredEditFields);

            res.json({ success: true, message: 'Item edited successfully' });
        }
        else {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
    } 
    catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /items/addToWishlist
router.post('/addToWishlist',[
    body('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    body('itemId').isLength({ min: 1 }).withMessage('Invalid itemId'),
    body('wishlistName').isLength({ min: 1 }).withMessage('Invalid wishlistName'),
], checkAuth, async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const userId = req.userId;
        const itemId = req.body.itemId;
        const wishlistName = req.body.wishlistName;
        const requestedUser = req.body.userId;

        if(userId == requestedUser) {
            
            item = await db.retrieveItemById(itemId);
            if (!item.rows.length > 0) {
                return res.status(404).json({ success: false, message: 'Item not found' });
            }
            
            wishlist = await dbWishlists.retrieveWishlist(userId, wishlistName);
            if (!wishlist.rows.length > 0) {
                return res.status(404).json({ success: false, message: 'Wishlist not found' });
            }
            wishlist = wishlist.rows[0];
            const wishlistId = wishlist.id;
            // check if item aleready exists in wishlist
            const itemExists = await db.checkIfItemExistsInWishlist(requestedUser, wishlistId, itemId);
            if (itemExists.rows.length > 0) {
                return res.status(409).json({ success: false, message: 'Item already exists in wishlist' });
            }

            await db.addItemToWishlist(requestedUser, wishlistId, itemId);

            res.json({ success: true, message: 'Item added to wishlist successfully' });
        }
        else {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
    } 
    catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// DELETE /items/deleteFromWishlist
router.delete('/deleteFromWishlist',[
    body('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    body('itemId').isLength({ min: 1 }).withMessage('Invalid itemId'),
    body('wishlistName').isLength({ min: 1 }).withMessage('Invalid wishlistName'),
], checkAuth, async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const userId = req.userId;
        const itemId = req.body.itemId;
        const wishlistName = req.body.wishlistName;
        const requestedUser = req.body.userId;

        if(userId == requestedUser) {
            
            item = await db.retrieveItemById(itemId);
            if (!item.rows.length > 0) {
                return res.status(404).json({ success: false, message: 'Item not found' });
            }
            
            wishlist = await dbWishlists.retrieveWishlist(userId, wishlistName);
            if (!wishlist.rows.length > 0) {
                return res.status(404).json({ success: false, message: 'Wishlist not found' });
            }
            wishlist = wishlist.rows[0];
            const wishlistId = wishlist.id;
            //check if item exists in wishlist
            const itemExists = await db.checkIfItemExistsInWishlist(requestedUser, wishlistId, itemId);
            if (!itemExists.rows.length > 0) {
                return res.status(404).json({ success: false, message: 'Item not found in wishlist' });
            }
            await db.deleteItemFromWishlist(requestedUser, wishlistId, itemId);

            res.json({ success: true, message: 'Item deleted from wishlist successfully' });
        }
        else {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
    } 
    catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

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