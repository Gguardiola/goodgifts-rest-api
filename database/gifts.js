const db = require('./db');

const retrieveAllUserGifts = async (requestedUser, userId, limit, offset) => {
    userId = userId.replace(/^"|"$/g, '');
    const result = await db.query('SELECT * FROM gifts WHERE id = (SELECT gift_id FROM user_gifts WHERE user_id = $2) AND gifted_user_id != $1 LIMIT $3 OFFSET $4', [requestedUser, userId, limit, offset]);
    return result;
}

const retrieveUserGift = async (userId, giftName) => {
    userId = userId.replace(/^"|"$/g, '');
    const result = await db.query('SELECT * FROM gifts WHERE gift_name = $1 AND user_id = $2', [giftName, userId]);
    return result;
}

const retrieveGiftById = async (userId, giftId) => {
    userId = userId.replace(/^"|"$/g, '');
    const result = await db.query('SELECT * FROM gifts WHERE id = $2 AND gifted_user_id != $1', [userId, giftId]);
    return result;
}

const createGift = async (userId, itemId, gifted_user_id, expiration_date, gift_name) => {
    userId = userId.replace(/^"|"$/g, '');
    gifted_user_id = gifted_user_id.replace(/^"|"$/g, '');
    try {
        await db.query('BEGIN');
        await db.query('INSERT INTO gifts (item_id, gift_name, gifted_user_id, is_delivered, expiration_date, user_id) VALUES ($1, $2, false ,$3, $4)', [itemId, gift_name, gifted_user_id, expiration_date, userId]);
        let giftId = retrieveUserGift(userId, gift_name);
        giftId = giftId.rows[0].id;
        await db.query('INSERT INTO user_gifts (user_id, gift_id, is_implicated) VALUES ($1, $2, true)', [userId, giftId]);
        await db.query('COMMIT');
    } catch (error) {
        await db.query('ROLLBACK');
        throw error;
    }
}

const deleteGift = async (userId, giftId) => {
    userId = userId.replace(/^"|"$/g, '');
    try {
        await db.query('BEGIN');
        await db.query('DELETE FROM user_gifts WHERE gift_id = $1', [giftId]);
        await db.query('DELETE FROM gifts WHERE id = $2 AND user_id = $1', [userId, giftId]);
        await db.query('COMMIT');
    } catch (error) {
        await db.query('ROLLBACK');
        throw error;
    }
}

const editGift = async (giftId, giftName) => {
    await db.query('UPDATE gifts SET gift_name = $2 WHERE id = $1', [giftId, giftName]);
}

const completeGift = async (giftId) => {
    await db.query('UPDATE gifts SET is_delivered = true WHERE id = $1', [giftId]);
}

const retrieveImplicationRequests = async (giftId, limit, offset) => {
    const result = await db.query('SELECT * FROM user_gifts WHERE gift_id = $1 AND is_implicated = false LIMIT $2 OFFSET $3', [giftId, limit, offset]);
    return result;
}

const retrieveImplications = async (giftId, limit, offset) => {
    const result = await db.query('SELECT * FROM user_gifts WHERE gift_id = $1 AND is_implicated = true LIMIT $2 OFFSET $3', [giftId, limit, offset]);
    return result;
}

const retrieveUserImplications = async (userId, limit, offset) => {
    userId = userId.replace(/^"|"$/g, '');
    const result = await db.query('SELECT * FROM user_gifts WHERE user_id = $1 AND is_implicated = true LIMIT $2 OFFSET $3', [userId, limit, offset]);
    return result;
}

const retrieveUserImplicationsRequested = async (userId, limit, offset) => {
    userId = userId.replace(/^"|"$/g, '');
    const result = await db.query('SELECT * FROM user_gifts WHERE user_id = $1 AND is_implicated = false LIMIT $2 OFFSET $3', [userId, limit, offset]);
    return result;
}

const retrieveImplication = async (userId, giftId) => {
    userId = userId.replace(/^"|"$/g, '');
    const result = await db.query('SELECT * FROM user_gifts WHERE gift_id = $1 AND user_id = $2', [giftId, userId]);
    return result;
}

const acceptImplication = async (userId, giftId) => {
    userId = userId.replace(/^"|"$/g, '');
    await db.query('UPDATE user_gifts SET is_implicated = true WHERE gift_id = $1 AND user_id = $2', [giftId, userId]);
}

const deleteImplication = async (userId, giftId) => {
    userId = userId.replace(/^"|"$/g, '');
    await db.query('DELETE FROM user_gifts WHERE gift_id = $1 AND user_id = $2', [giftId, userId]);
}

const sendImplication = async (userId, giftId) => { 
    userId = userId.replace(/^"|"$/g, '');
    await db.query('INSERT INTO user_gifts(user_id, gift_id, is_implicated) VALUES ($2, $1, false)', [giftId, userId]);
}

module.exports = {
    retrieveAllUserGifts,
    retrieveGiftById,
    retrieveUserGift,
    createGift, 
    deleteGift,
    editGift,
    completeGift,
    retrieveImplicationRequests,
    retrieveImplications,
    retrieveUserImplications,
    retrieveUserImplicationsRequested,
    retrieveImplication,
    acceptImplication,
    sendImplication,
    deleteImplication,
};