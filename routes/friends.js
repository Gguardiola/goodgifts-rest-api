const router = require('express').Router();
const { validationResult, param, query, oneOf, body } = require('express-validator');
const checkAuth = require('../middleware/checkAuth');
const requestLimiter = require('../middleware/requestLimiter');
const db = require('../database/friends')
const dbUsers = require('../database/users')


// GET /friends/getAll?userId=...&limit=...&offset=...
router.get('/getAll', [
    query('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    query('limit').isInt({ min: 1 }).toInt().withMessage('Invalid limit'),
    query('offset').isInt({ min: 0 }).toInt().withMessage('Invalid offset'),
], checkAuth, async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log("Error validating input: " + errors.array());
        return res.status(400).json({ success: false, message: errors.array() });
    }

    const { userId, limit, offset } = req.query;

    try {
        const user = await dbUsers.checkIfUserExists(userId);
        if (user.rows.length === 0) {
            console.log("Error: User NOT exists");
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const friends = await db.retrieveFriends(userId, limit, offset);
        res.json({ success: true, friends: friends.rows });
    } catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error during friends retrieval:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /friends/check?userId=...&friendId=...
router.get('/check', [
    query('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    query('friendId').isLength({ min: 1 }).withMessage('Invalid friendId'),
], checkAuth, async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log("Error validating input: " + errors.array());
        return res.status(400).json({ success: false, message: errors.array() });
    }

    const { userId, friendId } = req.query;

    try {
        if(userId == friendId) {
            return res.json({ success: true, relation: 'self' });
        }
        const user = await dbUsers.checkIfUserExists(userId);
        if (user.rows.length === 0) {
            console.log("Error: User NOT exists");
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const friend = await dbUsers.checkIfUserExists(friendId);
        if (friend.rows.length === 0) {
            console.log("Error: User NOT exists");
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const friendship = await db.checkIfFriendshipExists(userId, friendId);
        const friendshipBack = await db.checkIfFriendshipExists(friendId, userId);
        if (friendship.rows.length > 0) {
            return res.json({ success: true, relation: 'friends' });
        }
        if (friendshipBack.rows.length > 0) {
            return res.json({ success: true, relation: 'friends' });
        }
        const friendshipRequest = await db.checkIfFriendshipRequestExists(userId, friendId);
        const friendshipRequestBack = await db.checkIfFriendshipRequestExists(friendId, userId);
        if (friendshipRequest.rows.length > 0) {
            return res.json({ success: true, relation: 'request_sent' });
        }
        if (friendshipRequestBack.rows.length > 0) {
            return res.json({ success: true, relation: 'request_received' });
        }
        return res.json({ success: true, relation: 'none' });
    } catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error during friends retrieval:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /friends/add
router.post('/add', [
    body('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    body('friendId').isLength({ min: 1 }).withMessage('Invalid friendId'),
], checkAuth, async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log("Error validating input: " + errors.array());
        return res.status(400).json({ success: false, message: errors.array() });
    }

        const userId = req.userId;
        const requestedUser = req.body.userId;
        const { friendId } = req.body;
    try {
        if(userId == requestedUser) {
            
            if(userId == friendId) {
                console.log("Error: You cannot add yourself as a friend");
                return res.status(400).json({ success: false, message: 'You cannot add yourself as a friend' });
            }
            const user = await dbUsers.checkIfUserExists(userId);
            if (user.rows.length === 0) {
                console.log("Error: User NOT exists");
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            const friend = await dbUsers.checkIfUserExists(friendId);
            if (friend.rows.length === 0) {
                console.log("Error: User NOT exists");
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            const friendshipRequest = await db.checkIfFriendshipRequestExists(userId, friendId);
            const friendshipRequestBack = await db.checkIfFriendshipRequestExists(friendId, userId);
            if (friendshipRequest.rows.length > 0) {
                console.log("Error: Friendship request already exists");
                return res.status(400).json({ success: false, message: 'Friendship request already exists' });
            }
            if (friendshipRequestBack.rows.length > 0) {
                console.log("Error: Friendship request already exists");
                return res.status(400).json({ success: false, message: 'Friendship request already exists' });
            }
            const friendship = await db.checkIfFriendshipExists(userId, friendId);
            const friendshipBack = await db.checkIfFriendshipExists(friendId, userId);
            if (friendship.rows.length > 0) {
                console.log("Error: Friendship already exists");
                return res.status(400).json({ success: false, message: 'Friendship already exists' });
            }
            if (friendshipBack.rows.length > 0) {
                console.log("Error: Friendship already exists");
                return res.status(400).json({ success: false, message: 'Friendship already exists' });
            }
            await db.addFriend(userId, friendId);
            res.json({ success: true, message: 'Friendship added' });
        }
        else {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

    } catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error during friends retrieval:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// DELETE /friends/delete
router.delete('/delete', [
    body('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    body('friendId').isLength({ min: 1 }).withMessage('Invalid friendId'),
], checkAuth, async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log("Error validating input: " + errors.array());
        return res.status(400).json({ success: false, message: errors.array() });
    }

        const userId = req.userId;
        const requestedUser = req.body.userId;
        const { friendId } = req.body;
    try {
        if(userId == requestedUser) {
            if(userId == friendId) {
                console.log("Error: You cannot delete yourself as a friend");
                return res.status(400).json({ success: false, message: 'You cannot delete yourself as a friend' });
            }
            const user = await dbUsers.checkIfUserExists(userId);
            if (user.rows.length === 0) {
                console.log("Error: User NOT exists");
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            const friend = await dbUsers.checkIfUserExists(friendId);
            if (friend.rows.length === 0) {
                console.log("Error: User NOT exists");
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            const friendship = await db.checkIfFriendshipExists(userId, friendId);
            const friendshipBack = await db.checkIfFriendshipExists(friendId, userId);
            if (friendship.rows.length === 0 && friendshipBack.rows.length === 0) {
                console.log("Error: Friendship does not exist");
                return res.status(404).json({ success: false, message: 'Friendship does not exist' });
            }

            await db.deleteFriend(userId, friendId);
            await db.deleteFriend(friendId, userId);
            res.json({ success: true, message: 'Friendship deleted' });
        }
        else {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

    } catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error during friends retrieval:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /friends/requests?&limit=...&offset=...
router.get('/requests', [
    query('limit').isInt({ min: 1 }).toInt().withMessage('Invalid limit'),
    query('offset').isInt({ min: 0 }).toInt().withMessage('Invalid offset'),
], checkAuth, async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log("Error validating input: " + errors.array());
        return res.status(400).json({ success: false, message: errors.array() });
    }
    const userId = req.userId;
    const { limit, offset } = req.query;

    try {
        const user = await dbUsers.checkIfUserExists(userId);
        if (user.rows.length === 0) {
            console.log("Error: User NOT exists");
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const requests = await db.retrieveRequests(userId, limit, offset);

        res.json({ success: true, requests: requests.rows });
    } catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error during friend requests retrieval:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    } 
});

// POST /friends/requests/accept
router.post('/requests/accept', [
    body('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    body('friendId').isLength({ min: 1 }).withMessage('Invalid friendId'),
], checkAuth, async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log("Error validating input: " + errors.array());
        return res.status(400).json({ success: false, message: errors.array() });
    }

        const userId = req.userId;
        const requestedUser = req.body.userId;
        const { friendId } = req.body;
    try {
        if(userId == requestedUser) {
            if(userId == friendId) {
                console.log("Error: You cannot add yourself as a friend");
                return res.status(400).json({ success: false, message: 'You cannot add yourself as a friend' });
            }
            const user = await dbUsers.checkIfUserExists(userId);
            if (user.rows.length === 0) {
                console.log("Error: User NOT exists");
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            const friend = await dbUsers.checkIfUserExists(friendId);
            if (friend.rows.length === 0) {
                console.log("Error: User NOT exists");
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            const friendshipRequest = await db.checkIfFriendshipRequestExists(friendId, userId);
            if (friendshipRequest.rows.length === 0) {
                console.log("Error: Friendship request does not exist");
                return res.status(404).json({ success: false, message: 'Friendship request does not exist' });
            }
            await db.acceptFriendRequest(friendId, userId);
            res.json({ success: true, message: 'Friendship added' });
        }
        else {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

    } catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error during friends retrieval:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// DELETE /friends/requests/reject
router.delete('/requests/reject', [
    body('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    body('friendId').isLength({ min: 1 }).withMessage('Invalid friendId'),
], checkAuth, async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log("Error validating input: " + errors.array());
        return res.status(400).json({ success: false, message: errors.array() });
    }

        const userId = req.userId;

        const requestedUser = req.body.userId;
        const { friendId } = req.body;
    try {
        if(userId == requestedUser) {
            if(userId == friendId) {
                console.log("Error: You cannot reject yourself as a friend");
                return res.status(400).json({ success: false, message: 'You cannot reject yourself as a friend' });
            }
            const user = await dbUsers.checkIfUserExists(userId);
            if (user.rows.length === 0) {
                console.log("Error: User NOT exists");
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            const friend = await dbUsers.checkIfUserExists(friendId);
            if (friend.rows.length === 0) {
                console.log("Error: User NOT exists");
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            const friendshipRequest = await db.checkIfFriendshipRequestExists(friendId, userId);
            if (friendshipRequest.rows.length === 0) {
                console.log("Error: Friendship request does not exist");
                return res.status(404).json({ success: false, message: 'Friendship request does not exist' });
            }
            await db.deleteFriend(friendId, userId);
            res.json({ success: true, message: 'Friendship request deleted' });
        }
        else {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

    } catch (error) {
        if (error.message.includes('replace is not a function') || error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ success: false, message: 'Invalid userId format' });
        }
        console.error('Error during friends retrieval:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});


module.exports = router;