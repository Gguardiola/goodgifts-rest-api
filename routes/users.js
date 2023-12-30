const router = require('express').Router();
const { validationResult, param, query, oneOf, body } = require('express-validator');
const bcrypt = require("bcrypt");
const checkAuth = require('../middleware/checkAuth');
const requestLimiter = require('../middleware/requestLimiter');
const db = require('../database/users')

// GET /users/getId?fromEmail=...
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
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        userId = userId.rows[0];       
        res.json({ success: true, userId: userId.id });    

      } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
});

// GET /users/profile?userId=...
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
router.patch('/profile/update', requestLimiter,[
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
        const requestedUser = req.body.userId.replace(/^"|"$/g, '');
        const {email, username, lastname, bioDesc, birthday, image_name } = req.body;
        if(userId == requestedUser) {
            const updateFields = {email, username, lastname, bioDesc, birthday, image_name };
            const filteredUpdateFields = Object.fromEntries(
            Object.entries(updateFields).filter(([key, value]) => value !== undefined)
            )
            if (Object.keys(filteredUpdateFields).length === 0) {
            return res.status(400).json({ success: false, message: 'At least one field is required' });
            }
            console.log('Updating user profile with the following fields:', filteredUpdateFields);
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
router.delete('/profile/delete', requestLimiter,[
    body('userId').isLength({ min: 1 }).withMessage('Invalid userId')
], checkAuth, async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const token = req.headers.authorization;
        const userId = req.userId;
        const requestedUser = req.body.userId;
        if(userId == requestedUser) {
            await db.deleteUser(userId, token);
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

// PATCH /users/profile/changePassword
router.patch('/profile/changePassword',[
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
        const requestedUser = req.body.userId;
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

module.exports = router;