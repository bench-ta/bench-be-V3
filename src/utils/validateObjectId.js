const { ObjectId } = require('bson');

function isValidObjectId(id) {
    return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
}

module.exports = { isValidObjectId };
