const db = require('./db');

const retrieveFriends = async (userId, limit, offset) => {
  userId = userId.replace(/^"|"$/g, '');
  const result = await db.query('SELECT * FROM friends WHERE user_id = $1 OR friend_id = $1 AND is_friend = true LIMIT $2 OFFSET $3', [userId, limit, offset]);
  return result;
};

const checkIfFriendshipExists = async (userId, friendId) => {
  userId = userId.replace(/^"|"$/g, '');
  const result = await db.query('SELECT * FROM friends WHERE user_id = $1 AND friend_id = $2 AND is_friend = true', [userId, friendId]);
  return result;
};

const checkIfFriendshipRequestExists = async (userId, friendId) => {
  userId = userId.replace(/^"|"$/g, '');
  friendId = friendId.replace(/^"|"$/g, '');
  const result = await db.query('SELECT * FROM friends WHERE user_id = $1 AND friend_id = $2 AND is_friend = false', [userId, friendId]);
  return result;
};

const retrieveRequests = async (userId, limit, offset) => {
  userId = userId.replace(/^"|"$/g, '');
  const result = await db.query('SELECT * FROM friends WHERE friend_id = $1 AND is_friend = false LIMIT $2 OFFSET $3', [userId, limit, offset]);
  return result;
}

const addFriend = async (userId, friendId) => {
  userId = userId.replace(/^"|"$/g, '');
  friendId = friendId.replace(/^"|"$/g, '');
  await db.query('INSERT INTO friends (user_id, friend_id, is_friend) VALUES ($1, $2, false)', [userId, friendId]);
};

const deleteFriend = async (userId, friendId) => {
  userId = userId.replace(/^"|"$/g, '');
  friendId = friendId.replace(/^"|"$/g, '');
  await db.query('DELETE FROM friends WHERE user_id = $1 AND friend_id = $2', [userId, friendId]);
};

const acceptFriendRequest = async (userId, friendId) => {
  userId = userId.replace(/^"|"$/g, '');
  friendId = friendId.replace(/^"|"$/g, '');
  await db.query('UPDATE friends SET is_friend = true WHERE user_id = $1 AND friend_id = $2', [userId, friendId]);
};

module.exports = {
  retrieveFriends,
  checkIfFriendshipExists,
  checkIfFriendshipRequestExists,
  addFriend,
  deleteFriend,
  retrieveRequests,
  acceptFriendRequest,

};