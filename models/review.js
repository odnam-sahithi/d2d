const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GoogleUser = require('./googleuser');


const reviewSchema= new mongoose.Schema({
    body: String,
    rating: Number,
    author:{
        type: Schema.Types.ObjectId,
        ref: 'GoogleUser'
    }
});

module.exports = mongoose.model('Review', reviewSchema);