const router = require('express').Router();
const { validationResult, param, query, oneOf, body } = require('express-validator');
const checkAuth = require('../middleware/checkAuth');
const db = require('../database/queries')

// GET /users/getId/:fromEmail
router.get('/getId',[
    query('fromEmail').isLength({ min: 1 }).isEmail().withMessage('Invalid fromEmail')

], checkAuth, async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const requestedUser = req.query.fromEmail;

        let userId = await db.retrieveUserId(requestedUser);
        if (!userId.rows.length > 0) {
            return res.status(404).json({ success: false, message: 'UserId not found' });
        }
        userId = userId.rows[0];       
        res.json({ success: true, userId: userId.id });    

      } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
});

// GET /users/profile/:userId
router.get('/profile',[
    query('userId').isLength({ min: 1 }).withMessage('Invalid userId')

], checkAuth, async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const userId = req.userId;
        const requestedUser = req.query.userId;

        if (userId == requestedUser) {
            let userProfile = await db.retrieveUserProfile(userId);
        
            if (!userProfile.rows.length > 0) {
              return res.status(404).json({ success: false, message: 'User profile not found' });
            }
            
            userProfile = userProfile.rows[0];
            return res.json({ success: true, userProfile });
        }
        //check if the user is requesting exists   
        const userExists = await db.checkIfUserExists(requestedUser);
        if (!userExists.rows.length > 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        //if is not his own profile, send only the public information
        let userProfile = await db.retrievePublicUserProfile(requestedUser);
        userProfile = userProfile.rows[0];

        res.json({ success: true, userProfile });  
      } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
});

// PATCH /users/profile/update
router.patch('/profile/update',[
    body('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    oneOf([
        body('email').isLength({ min: 1 }).withMessage('At least one field is required'),
        body('username').isLength({ min: 1 }).withMessage('At least one field is required'),
        body('lastname').isLength({ min: 1 }).withMessage('At least one field is required'),
        body('bioDesc').isLength({ min: 1 }).withMessage('At least one field is required'),
        body('birthday').isLength({ min: 1 }).isISO8601().toDate().withMessage('At least one field is required'),
        body('image_name').isLength({ min: 1 }).withMessage('At least one field is required'),
      ])
], checkAuth, async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const userId = req.userId;
        const requestedUser = req.query.userId;
        const {email, username, lastname, bioDesc, birthday, image_name } = req.body;
        if(userId == requestedUser) {
            const updateFields = {email, username, lastname, bioDesc, birthday, image_name };
            const filteredUpdateFields = Object.fromEntries(
            Object.entries(updateFields).filter(([key, value]) => value !== undefined)
            )
            if (Object.keys(filteredUpdateFields).length === 0) {
            return res.status(400).json({ success: false, message: 'At least one field is required' });
            }
            await db.updateUserProfile(userId, filteredUpdateFields);

            res.json({ success: true, message: 'User profile updated successfully' });
        }
        else {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
      } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
});

// DELETE /users/profile/delete
router.delete('/profile/delete',[
    body('userId').isLength({ min: 1 }).withMessage('Invalid userId')
], checkAuth, async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const userId = req.userId;
        const requestedUser = req.query.userId;
        if(userId == requestedUser) {
            await db.deleteUser(userId);
            res.json({ success: true, message: 'User profile deleted successfully' });
        }
        else {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
    } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /users/profile/changePassword
router.post('/profile/changePassword',[
    body('userId').isLength({ min: 1 }).withMessage('Invalid userId'),
    body('password').isLength({ min: 6 }).withMessage('Invalid password'),
    body('newPassword').isLength({ min: 6 }).withMessage('Invalid newPassword')
], checkAuth, async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }   

    try {
        const userId = req.userId;
        const requestedUser = req.query.userId;
        const {password, newPassword} = req.body;
        if(userId == requestedUser){
            let user = await db.retrieveUserProfile(userId);
            if (!user.rows.length > 0) {
                return res.status(404).json({ success: false, message: 'User profile not found' });
            }
            user = user.rows[0];
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if(!isPasswordValid) {
                return res.status(400).json({ success: false, message: 'Invalid credentials' });
            }
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await db.updateUserPassword(userId, hashedPassword);
            res.json({ success: true, message: 'Password updated successfully' });
        }
        else {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
    }
    catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

////// FRIENDS //////

//PAGINATION!
// GET /friends/getAll/:userId
//headers: {Authorization: Bearer token}
//NOTE: must be the same user that is logged in

// POST /friends/add
//headers: {Authorization: Bearer token}
// body: {userId} -> from the request

// DELETE /friends/delete
//headers: {Authorization: Bearer token}
// body: {userId} -> from the request

//PAGINATION!
// GET /friends/requests/:userId
//headers: {Authorization: Bearer token}

// POST /friends/requests/accept
//headers: {Authorization: Bearer token}
// body: {userId} -> from the request

// DELETE /friends/requests/reject
//headers: {Authorization: Bearer token}
// body: {userId} -> from the request

////// WISHLISTS //////

//PAGINATION!
// GET /wishlists/getAll/:userId
//headers: {Authorization: Bearer token}

// POST /wishlists/create
//headers: {Authorization: Bearer token}
// body: {wishlistName}

// DELETE /wishlists/delete
//headers: {Authorization: Bearer token}
// body: {userId, wishlistName}

// PATCH /wishlists/edit
//headers: {Authorization: Bearer token}
// body: {userId, wishlistName, newName}

////// ITEMS //////

//PAGINATION!
// GET /items/getAll/:userId/:wishlistName
//headers: {Authorization: Bearer token}

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