const Review = require('../models/review');
const Company = require('../models/company');

module.exports.addReview = async (req, res) => {
    const { id } = req.params;
    const place = await Company.findById(id).populate('owner');
    if (place !== null) {
        const newReview = new Review(req.body.review);
        newReview.author = req.user.id;
        place.reviews.push(newReview);
        await newReview.save();
        await place.save();
        res.redirect(`/show/${id}`);
    }
    else {
        req.flash('error', 'Place might be deleted or not yet made.');
        res.redirect('/home');
    }
};


module.exports.deleteReview = async (req, res) => {
    const { place_id, re_id } = req.params;
    await Company.findByIdAndUpdate(place_id, { $pull: { reviews: re_id } });
    await Review.findByIdAndDelete(re_id);
    req.flash('success', 'Successfully deleted the review!');
    res.redirect(`/show/${place_id}`);
};
