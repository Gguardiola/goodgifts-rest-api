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
  const wishlist = await db.query('SELECT id FROM wishlists WHERE user_id = $1 AND wishlist_name = $2', [userId, wishlistName]);
  const result = await db.query('SELECT * FROM items WHERE id = (SELECT item_id FROM item_wishlists WHERE wishlist_id = $2 )', [wishlist.rows[0].id]);
  return result;
}

const createWishlist = async (userId, wishlistName) => {
  await db.query('INSERT INTO wishlists (user_id, wishlist_name) VALUES ($1, $2)', [userId, wishlistName]);
};

const deleteWishlist = async (userId, wishlistName) => {
  try{
    await db.query('BEGIN');
    await db.query('DELETE FROM gifts WHERE item_id = (SELECT id FROM items WHERE wishlist_id = (SELECT id FROM wishlists WHERE user_id = $1 AND wishlist_name = $2))', [userId, wishlistName]);
    await db.query('DELETE FROM item_wishlists WHERE wishlist_id = (SELECT id FROM wishlists WHERE user_id = $1 AND wishlist_name = $2)', [userId, wishlistName]);
    await db.query('DELETE FROM items WHERE wishlist_id = (SELECT id FROM wishlists WHERE user_id = $1 AND wishlist_name = $2)', [userId, wishlistName]);
    await db.query('DELETE FROM wishlists WHERE user_id = $1 AND wishlist_name = $2', [userId, wishlistName]);
    await db.query('COMMIT');
  } catch (error){
    await db.query('ROLLBACK');
    throw error;
  
  }
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