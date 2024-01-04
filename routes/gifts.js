const router = require('express').Router();
const { validationResult, param, query, oneOf, body } = require('express-validator');
const checkAuth = require('../middleware/checkAuth');
const requestLimiter = require('../middleware/requestLimiter');
const db = require('../database/gifts')
const dbUsers = require('../database/users');
const dbItems = require('../database/items');

// GET /gifts/getAll?userId=...&limit=...&offset=...
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
        const userId = req.userId;
        const requestedUser = req.query.userId;
        const { limit, offset } = req.query;
        let user = await dbUsers.checkIfUserExists(requestedUser);
        if(!user.rows.length > 0) {
            console.log("Error: User NOT exists");
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        //NOTE: if the user in the token is the same as the beneficiary of the gift = unauthorized (ONLY THE ONES WITH THAT CONDITION)
        let gifts = await db.retrieveAllUserGifts(requestedUser, userId, limit, offset);
        
        if (!gifts.rows.length > 0) {
            return res.json({ success: true, gifts: [] });
        }
        
        gifts = gifts.rows;
        return res.json({ success: true, gifts });
    } catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /gifts/get?giftId=...
router.get('/get',[
    query('giftId').isLength({ min: 1 }).withMessage('Invalid giftId'),

], checkAuth, async (req, res) => {
    
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const userId = req.userId;
        const giftId = req.query.giftId;

        let gift = await db.retrieveGiftById(userId, giftId);
        if (!gift.rows.length > 0) {
            return res.status(404).json({ success: false, message: 'Gift not found' });
        }
        if(gift.rows[0].gifted_user_id == userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        if (!gift.rows.length > 0) {
            return res.status(404).json({ success: false, message: 'Gift not found' });
        }
        
        gift = gift.rows[0];
        return res.json({ success: true, gift });
    } catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
// POST /gifts/create
router.post('/create',[
    body('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    body('itemId').isLength({ min: 1 }).withMessage('Invalid itemId'),
    body('gifted_user_id').isLength({ min: 1 }).withMessage('Invalid gifted_user_id'),
    body('expiration_date').isLength({ min: 1 }).isISO8601().toDate().withMessage('Invalid date format'),
    body('gift_name').isLength({ min: 1 }).withMessage('Invalid gift_name'),
], checkAuth, async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const userId = req.userId;
        const requestedUser = req.body.userId;
        
        if(userId == requestedUser) {
            const { itemId, gifted_user_id, expiration_date, gift_name } = req.body;
            let user = await dbUsers.checkIfUserExists(userId);

            if(!user.rows.length > 0) {
                console.log("Error: User NOT exists");
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            let gifted_user = await dbUsers.checkIfUserExists(gifted_user_id);

            if(!gifted_user.rows.length > 0) {
                console.log("Error: User NOT exists");
                return res.status(404).json({ success: false, message: 'Gifted user not found' });
            }

            let gift = await db.retrieveUserGift(userId, gift_name);
            if (gift.rows.length > 0) {
                return res.status(409).json({ success: false, message: 'Gift already exists' });
            }

            if(userId != gifted_user_id) {
                let item = await dbItems.retrieveItemById(itemId);

                if (!item.rows.length > 0) {
                    return res.status(404).json({ success: false, message: 'Item not found' });
                }

                await db.createGift(userId, itemId, gifted_user_id, expiration_date, gift_name);
                return res.json({ success: true, message: 'Gift created successfully' });

            } else{
                return res.status(400).json({ success: false, message: 'You cannot create a gift for yourself' });
            }
        } else{
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
    } catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// DELETE /gifts/delete
router.delete('/delete',[   
    body('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    body('giftId').isLength({ min: 1 }).withMessage('Invalid giftId'),    
], checkAuth, async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const userId = req.userId;
        const requestedUser = req.body.userId;
        const giftId = req.body.giftId;

        if(userId == requestedUser) {

            let gift = await db.retrieveGiftById(userId, giftId);
            if (!gift.rows.length > 0) {
                return res.status(404).json({ success: false, message: 'Gift not found' });
            }
            if(gift.rows[0].user_id != userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            await db.deleteGift(userId, giftId);
            return res.json({ success: true, message: 'Gift deleted successfully' });
        }
        else {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
    } catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// PATCH /gifts/edit
router.patch('/edit',[
    body('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    body('giftId').isLength({ min: 1 }).withMessage('Invalid itemId'),
    body('gift_name').isLength({ min: 1 }).withMessage('Invalid gift_name'),
], checkAuth, async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const userId = req.userId;
        const giftId = req.body.giftId;
        const requestedUser = req.body.userId;
        const {gift_name} = req.body;

        let user = await dbUsers.checkIfUserExists(userId);
        if(!user.rows.length > 0) {
            console.log("Error: User NOT exists");
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if(userId == requestedUser) {
            
            gift = await db.retrieveGiftById(userId, giftId);
            if (!gift.rows.length > 0) {
                return res.status(404).json({ success: false, message: 'Gift not found' });
            }

            if (gift.rows[0].gift_name == gift_name) {
                return res.status(409).json({ success: false, message: 'Gift with that name already exists' });
            }
            if(gift.rows[0].user_id != userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            await db.editGift(giftId, gift_name);

            res.json({ success: true, message: 'Gift edited successfully' });
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

// POST /gifts/complete
router.post('/complete',[
    body('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    body('giftId').isLength({ min: 1 }).withMessage('Invalid itemId'),
], checkAuth, async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }
    try {
        const userId = req.userId;
        const giftId = req.body.giftId;
        const requestedUser = req.body.userId;
        let user = await dbUsers.checkIfUserExists(userId);
        if(!user.rows.length > 0) {
            console.log("Error: User NOT exists");
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if(userId == requestedUser) {
            let gift = await db.retrieveGiftById(userId, giftId);
            if (!gift.rows.length > 0) {
                return res.status(404).json({ success: false, message: 'Gift not found' });
            }
            if(gift.rows[0].user_id != userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            if(gift.rows[0].is_delivered){
                return res.status(400).json({ success: false, message: 'Gift already completed' });
            }
            await db.completeGift(giftId);
            return res.json({ success: true, message: 'Gift completed successfully' });
        }
        else {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
    } catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /gifts/recieved?userId=...&limit=...&offset=...
router.get('/recieved',[
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
        const userId = req.userId;
        const requestedUser = req.query.userId;
        const { limit, offset } = req.query;
        let user = await dbUsers.checkIfUserExists(requestedUser);
        if(!user.rows.length > 0) {
            console.log("Error: User NOT exists");
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        let gifts = await db.retrieveUserRecievedGifts(requestedUser, limit, offset);
        if (!gifts.rows.length > 0) {
            return res.json({ success: true, gifts: [] });
        }
        gifts = gifts.rows;
        return res.json({ success: true, gifts });

    } catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /gifts/implications/requests?giftId=...&limit=...&offset=...
router.get('/implications/requests',[
    query('giftId').isLength({ min: 1 }).withMessage('Invalid giftId'),
    query('limit').isInt({ min: 1 }).toInt().withMessage('Invalid limit'),
    query('offset').isInt({ min: 0 }).toInt().withMessage('Invalid offset'),
], checkAuth, async (req, res) => {
    
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {

        const userId = req.userId;
        const giftId = req.query.giftId;
        const { limit, offset } = req.query;    

        let gift = await db.retrieveGiftById(userId, giftId);
        if (!gift.rows.length > 0) {
            return res.status(404).json({ success: false, message: 'Gift not found' });
        }
        if(gift.rows[0].user_id != userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        let requests = await db.retrieveImplicationRequests(giftId, limit, offset);
        if (!requests.rows.length > 0) {
            return res.status(404).json({ success: true, requests: [] });
        }
        requests = requests.rows;
        return res.json({ success: true, requests });
    } catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /gifts/implications?giftId=...&limit=...&offset=...
router.get('/implications',[
    query('giftId').isLength({ min: 1 }).withMessage('Invalid giftId'),
    query('limit').isInt({ min: 1 }).toInt().withMessage('Invalid limit'),
    query('offset').isInt({ min: 0 }).toInt().withMessage('Invalid offset'),

], checkAuth, async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()}); 
    }

    try {

        const userId = req.userId;
        const giftId = req.query.giftId;
        const { limit, offset } = req.query;
        let user = await dbUsers.checkIfUserExists(userId);
        if(!user.rows.length > 0) {
            console.log("Error: User NOT exists");
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        let gift = await db.retrieveGiftById(userId, giftId);
        if (!gift.rows.length > 0) {
            return res.status(404).json({ success: false, message: 'Gift not found' });
        }
        if(gift.rows[0].gifted_user_id == userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        let implications = await db.retrieveImplications(giftId, limit, offset);
        if (!implications.rows.length > 0) {
            return res.status(404).json({ success: true, implications: [] });
        }
        implications = implications.rows;
        return res.json({ success: true, implications });

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /gifts/implications/sended?userId=...&limit=...&offset=...
router.get('/implications/sended',[
    query('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    query('limit').isInt({ min: 1 }).toInt().withMessage('Invalid limit'),
    query('offset').isInt({ min: 0 }).toInt().withMessage('Invalid offset'),
], checkAuth, async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array()); 
        return res.status(400).json({success: false, message: errors.array()});
    }

    try{

        const userId = req.userId;
        const requestedUser = req.query.userId;
        const {limit, offset} = req.query;

        let user = await dbUsers.checkIfUserExists(requestedUser);
        if(!user.rows.length > 0) {
            console.log("Error: User NOT exists");
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if(userId == requestedUser) {

            let implications = await db.retrieveUserImplicationsRequested(userId, limit, offset);
            if (!implications.rows.length > 0) {
                return res.json({ success: true, implications: [] });
            }
            implications = implications.rows;
            return res.json({ success: true, implications });
        } else {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
    

    } catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

//POST /gifts/implications/send
router.post('/implications/send',[
    body('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    body('giftId').isLength({ min: 1 }).withMessage('Invalid giftId'),
], checkAuth, async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {

        const userId = req.userId;
        const requestedUser = req.body.userId;
        const giftId = req.body.giftId;

        if(userId == requestedUser) {
                
                let gift = await db.retrieveGiftById(userId, giftId);
                if (!gift.rows.length > 0) {
                    return res.status(404).json({ success: false, message: 'Gift not found' });
                }
                if(gift.rows[0].gifted_user_id == userId) {
                    return res.status(401).json({ success: false, message: 'Unauthorized' });
                }
                if(gift.rows[0].is_delivered){
                    return res.status(400).json({ success: false, message: 'Gift already completed' });
                }
                let implication = await db.retrieveImplication(requestedUser, giftId);
                if (implication.rows.length > 0) {
                    return res.status(409).json({ success: false, message: 'Implication already exists' });
                }
                await db.sendImplication(requestedUser, giftId);
                return res.json({ success: true, message: 'Implication sent successfully' });
            }
        else{
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

    } catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /gifts/implications/accept
router.post('/implications/accept',[
    body('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    body('giftId').isLength({ min: 1 }).withMessage('Invalid giftId'),
    body('implicationUserId').isLength({ min: 1 }).withMessage('Invalid implicationUserId'),
], checkAuth, async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array()); 
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const userId = req.userId;
        const requestedUser = req.body.userId;
        const giftId = req.body.giftId;
        const implicationUserId = req.body.implicationUserId;

        if(userId == requestedUser) {
                
                let gift = await db.retrieveGiftById(userId, giftId);
                if (!gift.rows.length > 0) {
                    return res.status(404).json({ success: false, message: 'Gift not found' });
                }
                if(gift.rows[0].user_id != userId) {
                    return res.status(401).json({ success: false, message: 'Unauthorized' });
                }
                let implication = await db.retrieveImplication(implicationUserId, giftId);
                if (!implication.rows.length > 0) {
                    return res.status(404).json({ success: false, message: 'Implication not found' });
                }
                if(implication.rows[0].is_implicated){
                    return res.status(400).json({ success: false, message: 'Implication already accepted' });
                }

                await db.acceptImplication(implicationUserId, giftId);
                return res.json({ success: true, message: 'Implication accepted successfully' });
            }
            else {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
    } catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// DELETE /gifts/implications/reject
router.delete('/implications/reject',[
    body('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    body('giftId').isLength({ min: 1 }).withMessage('Invalid giftId'),
    body('implicationUserId').isLength({ min: 1 }).withMessage('Invalid implicationUserId'),

], checkAuth, async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array()); 
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const userId = req.userId;
        const requestedUser = req.body.userId;
        const {giftId, implicationUserId} = req.body;
        
        if(userId == requestedUser) {
            let gift = await db.retrieveGiftById(userId, giftId);
            if (!gift.rows.length > 0) {
                return res.status(404).json({ success: false, message: 'Gift not found' });
            }
            if(gift.rows[0].user_id != userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            let implication = await db.retrieveImplication(implicationUserId, giftId);
            if (!implication.rows.length > 0) {
                return res.status(404).json({ success: false, message: 'Implication not found' });
            }

            await db.deleteImplication(implicationUserId, giftId);
            return res.json({ success: true, message: 'Implication rejected successfully' });

        } else {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

    } catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// DELETE /implications/delete
router.delete('/implications/delete',[
    body('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    body('giftId').isLength({ min: 1 }).withMessage('Invalid giftId'),
], checkAuth, async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array()); 
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const userId = req.userId;
        const requestedUser = req.body.userId;
        const giftId = req.body.giftId;

        if(userId == requestedUser) {
            let gift = await db.retrieveGiftById(userId, giftId);
            if (!gift.rows.length > 0) {
                return res.status(404).json({ success: false, message: 'Gift not found' });
            }
            if(gift.rows[0].gifted_user_id == userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            let implication = await db.retrieveImplication(requestedUser, giftId);
            if (!implication.rows.length > 0) {
                return res.status(404).json({ success: false, message: 'Implication not found' });
            }

            await db.deleteImplication(requestedUser, giftId);
            return res.json({ success: true, message: 'Implication deleted successfully' });
        } else {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
    } 
    catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;