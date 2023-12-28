const router = require('express').Router();
const { validationResult, param } = require('express-validator');
const checkAuth = require('../middleware/checkAuth');

// GET /users/getId/:requestedUser
router.get('/getId',[
    param('fromEmail').isInt({ min: 1 }).isEmail().withMessage('Invalid fromEmail')

], checkAuth, async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const requestedUser = req.query.fromEmail;

        let userId = await retrieveUserId(requestedUser);
        userId = userId.rows[0];
        
        res.json({ success: true, userId });
        

      } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
});

// GET /users/profile/:requestedUser
router.get('/profile',[
    param('userId').isInt({ min: 1 }).withMessage('Invalid userId')

], checkAuth, async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log("Error validating input: "+errors.array());
        return res.status(400).json({success: false, message: errors.array()});
    }

    try {
        const userId = req.userId;
        const requestedUser = req.query.userId;

        // check if the user is requesting his own profile, if so, return his profile
        if (userId == requestedUser) {
            let userProfile = await retrieveUserProfile(userId);
        
            if (!userProfile.rows.length > 0) {
              return res.status(404).json({ success: false, message: 'User profile not found' });
            }
            
            userProfile = userProfile.rows[0];

            return res.json({ success: true, userProfile });
        }

        //check if the user is requesting exists   
        const userExists = await checkIfUserExists(requestedUser);
        if (!userExists.rows.length > 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        //if is not his own profile, send only the public information
        let userProfile = await retrievePublicUserProfile(requestedUser);
        userProfile = userProfile.rows[0];

        res.json({ success: true, userProfile });
        

      } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
});


module.exports = router;