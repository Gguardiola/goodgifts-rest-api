const db = require('./db');

const retrieveUserItem = async (userId, itemName) => {
  const result = await db.query('SELECT * FROM items WHERE user_id = $1 AND item_name = $2', [userId, itemName]);
  return result;
};

const retrieveAllUserItems = async (userId, limit, offset) => {
  const result = await db.query('SELECT * FROM items WHERE user_id = $1 LIMIT $2 OFFSET $3', [userId, limit, offset]);
  return result;
};

const retrieveItemById = async (itemId) => { 
  const result = await db.query('SELECT * FROM items WHERE id = $1', [itemId]);
  return result;
}

const createItem = async (userId, itemName, itemDescription, itemLink, image_name) => {
  await db.query('INSERT INTO items (user_id, item_name, item_description, item_link, image_name) VALUES ($1, $2, $3, $4, $5)', [userId, itemName, itemDescription, itemLink, image_name]);
};

const deleteItem = async(userId, itemId) => {
  await db.query('DELETE FROM gifts WHERE item_id = $1', [itemId]);
  await db.query('DELETE FROM item_wishlists WHERE item_id = $1', [itemId]);
  await db.query('DELETE FROM items WHERE user_id = $1 AND id = $2', [userId, itemId]); 
};

const editItem = async (itemId, editFields) => {
  const {itemName, itemDescription, itemLink, image_name} = editFields;

  const setClause = Object.entries(editFields)
      .map(([key, value]) => `${key} = $${Object.keys(editFields).indexOf(key) + 1}`)
      .join(', ');

  const values = Object.values(editFields);
  const query = `UPDATE items SET ${setClause} WHERE id = $${values.length + 1} `;

  try {
      await db.query(query, [...values, itemId]);
  } catch (error) {
      throw new Error(`Error updating user profile: ${error.message}`);
  }
};

const isItemOwner = async (userId, itemId) => {
  const result = await db.query('SELECT * FROM items WHERE id = $1 AND wishlist_id IN (SELECT id FROM wishlists WHERE user_id = $2)', [itemId, userId]);
  return result;
}

const addItemToWishlist = async (userId, wishlistName, itemId) => {
  const wishlist = await db.query('SELECT id FROM wishlists WHERE user_id = $1 AND wishlist_name = $2', [userId, wishlistName]);
  await db.query('INSERT INTO item_wishlists (item_id, wishlist_id) VALUES ($1, $2)', [itemId, wishlist.rows[0].id]);
};

const deleteItemFromWishlist = async (userId, wishlistName, itemId) => {
  const wishlist = await db.query('SELECT id FROM wishlists WHERE user_id = $1 AND wishlist_name = $2', [userId, wishlistName]);
  await db.query('DELETE FROM item_wishlists WHERE item_id = $1 AND wishlist_id = $2', [itemId, wishlist.rows[0].id]);
};

const checkIfItemExistsInWishlist = async (userId, wishlistName, itemId) => {
  const wishlist = await db.query('SELECT id FROM wishlists WHERE user_id = $1 AND wishlist_name = $2', [userId, wishlistName]);
  const result = await db.query('SELECT * FROM item_wishlists WHERE item_id = $1 AND wishlist_id = $2', [itemId, wishlist.rows[0].id]);
  return result;
}


module.exports = {
  retrieveUserItem,
  retrieveAllUserItems,
  createItem,
  deleteItem,
  editItem,
  retrieveItemById,
  isItemOwner,
  addItemToWishlist,
  deleteItemFromWishlist,
  checkIfItemExistsInWishlist,

};