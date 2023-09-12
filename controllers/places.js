const Company = require('../models/company');
const { cloudinary } = require('../cloudinary');


module.exports.showAll = async (req, res) => {
    const all = await Company.find().populate('owner').populate({
        path: 'reviews',
        populate: {
            path: 'author' // populate author of each review
        }
    });

    res.render('list', { all, req: req });
};


module.exports.addPlaceForm = (req, res) => {
    const name = "";
    const location = "";
    const description = "";
    const category = "";
    const contact = 0;
    res.render('addPlace', { name, description, location, category, contact });
};


module.exports.addPlaceDB = async (req, res) => {
    const { name, description, location, category, contact, items, cost } = req.body;

    if (contact.toString().length != 10) {
        req.flash('error', 'Enter valid phone number and try again');
        return res.redirect('/addplace');
    }
    if (items && (items.length != cost.length)) {
        req.flash('error', 'Enter valid items along with prices and try again!');
        return res.redirect('/addplace');
    }

    if (name.trim() !== "" && description.trim() !== "" && location.trim() !== "") {
        try {

            const newCompany = new Company({
                name: name.trim().charAt(0).toUpperCase() + name.trim().slice(1),
                description: description.trim().charAt(0).toUpperCase() + description.trim().slice(1),
                location: location.trim().charAt(0).toUpperCase() + location.trim().slice(1),
                category, contact, items, cost
            });

            newCompany.owner = req.user.id;
            newCompany.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
            await newCompany.save();
            req.flash('success', 'Thanks for registering your place with us...!');
            res.redirect('/showAll');
        }
        catch (e) {
            console.log(e);
            req.flash('error', 'Fill all fields correctly');
            res.redirect('/addplace');
        }
    }

    else {
        console.log("please fill all fields");

        req.flash('success', 'Please fill all the fields.');
        res.render('addPlace', { name: name.trim(), description: description.trim(), location: location.trim(), contact, category });
    }

};


module.exports.updateForm = async (req, res) => {
    const { id } = req.params;
    const place = await Company.findById(id);

    if (place !== null) {
        res.render('update', { place });
    }
    else {
        req.flash('error', 'Place might be deleted or not yet made.');
        res.redirect('/home');
    }

};


module.exports.updateInDB = async (req, res) => {
    let { name, description, location, category, contact, items, cost } = req.body;
    // console.log(items);
    if (items == undefined) items = [], cost = [];

    if (name.trim() !== "" && description.trim() !== "" && location.trim() !== "" && contact >= 1000000000 && contact <= 9999999999) {
        const place = await Company.findByIdAndUpdate(req.params.id, { name: name.trim(), description: description.trim(), category, contact, items, cost }, { new: true });


        try {
            const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
            place.images.push(...imgs);
            place.location = location;
            await place.save();

            if (req.body.deleteImages) {
                for (let filename of req.body.deleteImages) {
                    await cloudinary.uploader.destroy(filename);
                }
                await place.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } });
            }

            req.flash('success', 'Successfully updated!!');
            res.redirect(`/show/${req.params.id}`);

        } catch (e) {
            req.flash('error', e.message);
            const { id } = req.params;
            const place = await Company.findById(id);
            res.render('update', { place });
        }


    }
    else {
        const { id } = req.params;
        const place = await Company.findById(id);
        if (place !== null) {
            req.flash('error', 'Fill all the fields');
            res.render('update', { place });
        }
        else {
            req.flash('error', 'Place might be deleted or not yet made.');
            res.redirect('/home');
        }
    }

};



module.exports.deletePlace = async (req, res) => {
    const { id } = req.params;
    await Company.findByIdAndDelete(id);
    // console.log("deleted");
    req.flash('success', 'Deleted the place');
    res.redirect('/showAll');
};


module.exports.showParticularPlace = async (req, res) => {
    const { id } = req.params;
    const place = await Company.findById(id)
        .populate({
            path: 'reviews',
            populate: {
                path: 'author' // populate author of each review
            }
        })
        .populate('owner');

    var avgRating = 0;

    if (place.reviews.length > 0) {
        place.reviews.forEach((obj) => {
            avgRating += obj.rating;
        });
        avgRating /= place.reviews.length;
    }
    else avgRating = -1;

    if (place !== null) {
        res.render('show', { place, avgRating });
    }
    else {
        req.flash('error', 'Place might be deleted or not yet made.');
        res.redirect('/home');
    }
};


