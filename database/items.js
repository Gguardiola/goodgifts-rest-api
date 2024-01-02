const db = require('./db');

const retrieveUserItem = async (userId, itemName) => {
  userId = userId.replace(/^"|"$/g, '');
  const result = await db.query('SELECT * FROM items WHERE user_id = $1 AND item_name = $2', [userId, itemName]);
  return result;
};

const retrieveAllUserItems = async (userId, limit, offset) => {
  userId = userId.replace(/^"|"$/g, '');
  const result = await db.query('SELECT * FROM items WHERE user_id = $1 LIMIT $2 OFFSET $3', [userId, limit, offset]);
  return result;
};

const retrieveItemById = async (itemId) => { 
  const result = await db.query('SELECT * FROM items WHERE id = $1', [itemId]);
  return result;
}

const createItem = async (userId, item_name, item_description, item_url, image_name) => {
  userId = userId.replace(/^"|"$/g, '');
  await db.query('INSERT INTO items (user_id, item_name, item_description, item_url, image_name) VALUES ($1, $2, $3, $4, $5)', [userId, item_name, item_description, item_url, image_name]);
};

const deleteItem = async(userId, itemId) => {
  userId = userId.replace(/^"|"$/g, '');
  try {
    await db.query('BEGIN');
    await db.query('DELETE FROM user_gifts WHERE gift_id IN (SELECT id FROM gifts WHERE item_id = $1)', [itemId]);
    await db.query('DELETE FROM gifts WHERE item_id = $1', [itemId]);
    await db.query('DELETE FROM item_wishlists WHERE item_id = $1', [itemId]);
    await db.query('DELETE FROM items WHERE user_id = $1 AND id = $2', [userId, itemId]); 
    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
};

const editItem = async (itemId, editFields) => {
  const {item_name, item_description, item_url, image_name} = editFields;

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
  userId = userId.replace(/^"|"$/g, '');
  const result = await db.query('SELECT * FROM items WHERE id = $1 AND wishlist_id IN (SELECT id FROM wishlists WHERE user_id = $2)', [itemId, userId]);
  return result;
}

const addItemToWishlist = async (userId, wishlistId, itemId) => {
  userId = userId.replace(/^"|"$/g, '');
  await db.query('INSERT INTO item_wishlists (item_id, wishlist_id) VALUES ($1, $2)', [itemId, wishlistId]);
};

const deleteItemFromWishlist = async (userId, wishlistId, itemId) => {
  userId = userId.replace(/^"|"$/g, '');
  await db.query('DELETE FROM item_wishlists WHERE item_id = $1 AND wishlist_id = $2', [itemId, wishlistId]);
};

const checkIfItemExistsInWishlist = async (userId, wishlistId, itemId) => {
  userId = userId.replace(/^"|"$/g, '');
  const result = await db.query('SELECT * FROM item_wishlists WHERE item_id = $1 AND wishlist_id = $2', [itemId, wishlistId]);
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