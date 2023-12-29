const db = require('./db');

const checkIfUserExists = async (userId) => {
  const result = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
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

const updateUserProfile = async (userId, updateFields) => {
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
  await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
}

const deleteUser = async (userId) => {
  try {
    await db.query('BEGIN');
        // Delete related records in user_sessions
        await db.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);

        // Delete related records in friends
        await db.query('DELETE FROM friends WHERE user_id = $1 OR friend_id = $1', [userId]);

        // Delete related records in wishlists, items, and gifts
        await db.query(`
            DELETE FROM gifts
            WHERE id IN (SELECT g.id FROM gifts g JOIN items i ON g.item_id = i.id WHERE i.wishlist_id IN (SELECT id FROM wishlists WHERE user_id = $1));

            DELETE FROM items
            WHERE wishlist_id IN (SELECT id FROM wishlists WHERE user_id = $1);

            DELETE FROM wishlists WHERE user_id = $1;
        `, [userId]);

        // Delete related records in user_gifts
        await db.query('DELETE FROM user_gifts WHERE user_id = $1', [userId]);

        // Delete the user
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