const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const googleuserSchema = new Schema({
    name: String,
    email: String,
    googleId: String,
    profilePicUrl: String,
})

const GoogleUser = mongoose.model('GoogleUser', googleuserSchema);
module.exports = GoogleUser;