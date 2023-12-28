const db = require('./db');

const checkIfUserExists = async (userId) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [userId]);
  return result;
};

const retrieveUserProfile = async (userId) => {
  const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  return result;
};

const retrievePublicUserProfile = async (userId) => {
  const result = await db.query('SELECT email, username, lastname, bioDesc, birthday, image_name FROM users WHERE id = $1', [userId]);
  return result;
};

const retrieveUserId = async (userId) => {
  const result = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
  return result;
};


module.exports = {
  checkIfUserExists,
  retrieveUserProfile,
  retrievePublicUserProfile,
  retrieveUserId

};