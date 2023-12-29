const db = require('./db');

const retrieveWishlist = async (userId, wishlistName) => {
  const result = await db.query('SELECT * FROM wishlists WHERE user_id = $1 AND wishlist_name = $2', [userId, wishlistName]);
  return result;
};

const retrieveUserWishlists = async (userId, limit, offset) => {
  const result = await db.query('SELECT * FROM wishlists WHERE user_id = $1 LIMIT $2 OFFSET $3', [userId, limit, offset]);
  return result;
};

const retrieveWishlistItems = async (userId, wishlistName) => {
  const result = await db.query('SELECT * FROM items WHERE wishlist_id = (SELECT id FROM wishlists WHERE user_id = $1 AND wishlist_name = $2)', [userId, wishlistName]);
  return result;
}

const createWishlist = async (userId, wishlistName) => {
  await db.query('INSERT INTO wishlists (user_id, wishlist_name) VALUES ($1, $2)', [userId, wishlistName]);
};

const deleteWishlist = async (userId, wishlistName) => {
  await db.query('DELETE FROM wishlists WHERE user_id = $1 AND wishlist_name = $2', [userId, wishlistName]);
};

const editWishlist = async (userId, wishlistName, newWishlistName) => { 
  await db.query('UPDATE wishlists SET wishlist_name = $3 WHERE user_id = $1 AND wishlist_name = $2', [userId, wishlistName, newWishlistName]);
};

module.exports = {
  retrieveWishlist,
  retrieveUserWishlists,
  createWishlist,
  deleteWishlist,
  editWishlist,
  retrieveWishlistItems,

};