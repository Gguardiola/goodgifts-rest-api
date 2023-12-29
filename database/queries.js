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
  const values = [email, username, lastname, bioDesc, birthday, image_name, userId];
  const setClause = Object.keys(updateFields)
    .map((field, index) => `${field} = $${index + 1}`)
    .join(', ');
  console.log("setClause: "+setClause)
  console.log("values: "+values)
  
  await db.query(`UPDATE users SET ${setClause} WHERE id = $${values.length}`, values);
};

const updateUserPassword = async (userId, hashedPassword) => {
  await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
}

const deleteUser = async (userId) => {
  await db.query('DELETE FROM users WHERE id = $1', [userId]);
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