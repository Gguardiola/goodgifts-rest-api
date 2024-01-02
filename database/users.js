const db = require('./db');

const checkIfUserExists = async (userId) => {
  userId = userId.replace(/^"|"$/g, '');
  const result = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
  return result;
};

const retrieveUserProfile = async (userId) => {
  userId = userId.replace(/^"|"$/g, '');
  const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  return result;
};

const retrievePublicUserProfile = async (userId) => {
  userId = userId.replace(/^"|"$/g, '');
  const result = await db.query('SELECT email, username, lastname, bioDesc, birthday, image_name FROM users WHERE id = $1', [userId]);
  return result;
};

const updateUserProfile = async (userId, updateFields) => {
  userId = userId.replace(/^"|"$/g, '');
  const {email, username, lastname, bioDesc, birthday, image_name } = updateFields;

  const setClause = Object.entries(updateFields)
      .map(([key, value]) => `${key} = $${Object.keys(updateFields).indexOf(key) + 1}`)
      .join(', ');

  const values = Object.values(updateFields);
  const query = `UPDATE users SET ${setClause} WHERE id = $${values.length + 1} `;

  try {
      await db.query(query, [...values, userId]);
  } catch (error) {
      throw new Error(`Error updating user profile: ${error.message}`);
  }
};

const updateUserPassword = async (userId, hashedPassword) => {
  userId = userId.replace(/^"|"$/g, '');
  await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
}

const deleteUser = async (userId, token) => {
  userId = userId.replace(/^"|"$/g, '');
  try {
    await db.query('BEGIN');

         await db.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);
         await db.query('DELETE FROM friends WHERE user_id = $1 OR friend_id = $1', [userId]);
         await db.query('DELETE FROM gifts WHERE id IN (SELECT g.id FROM gifts g JOIN items i ON g.item_id = i.id WHERE i.wishlist_id IN (SELECT id FROM wishlists WHERE user_id = $1))', [userId]);
         await db.query('DELETE FROM items WHERE user_id = $1', [userId]);
         await db.query('DELETE FROM wishlists WHERE user_id = $1', [userId]);
         await db.query('DELETE FROM user_gifts WHERE user_id = $1', [userId]);
         await db.query('INSERT INTO token_blacklist (token) VALUES ($1)', [token]);
         await db.query('DELETE FROM users WHERE id = $1', [userId]);
 
        await db.query('COMMIT');
    } catch (error) {
        await db.query('ROLLBACK');
        throw error;
    }
}

const retrieveUserId = async (email) => {
  const result = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  return result;
};


module.exports = {
  checkIfUserExists,
  retrieveUserProfile,
  retrievePublicUserProfile,
  retrieveUserId,
  updateUserProfile,
  updateUserPassword,
  deleteUser,
  
};