const Company = require("./models/company");
const Review = require('./models/review');

const isLoggedIn = (req, res, next) => {
    if(req.user) next();
    else { // not logged in
        // console.log("Login first");
        req.flash('primary', 'You need to be logged in!!');
        res.redirect('/home');
    }
}
module.exports.isLoggedIn = isLoggedIn; 

class ExpressError extends Error {
    constructor(message, status) {
        super(); 
        this.message = message;
        this.status = status || 404;
    }
}
module.exports.ExpressError = ExpressError;

module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const place = await Company.findById(id);
    if ( place !== null &&  place.owner.equals(req.user._id)){
        next();
    } else {
        req.flash('error', 'Action Prohibited as it belongs to someone else!');
        // console.log("NOT ALLOWEDD");
        return res.redirect(`/showAll`);
    }
}


module.exports.catchAsyncError = (fn) => {
    return (req, res, next) => {
        fn(req,res,next).catch(e => next(e));
    }
}

module.exports.isReviewOwner = async (req, res, next) => {
    const { re_id } = req.params;
    const rev = await Review.findById(re_id);
    if(rev!=null && rev.author.equals(req.user.id)){
        next();
    }
    else{
        req.flash('error', 'Action Prohibited as it belongs to someone else!');
        // console.log("NOT ALLOWEDD");
        return res.redirect(`/showAll`);
    }
}

/* ------------------------------JOI VALIDATION---------------------------------- */
const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');


const extension = (joi) => ({ // an extension on Joi.string() to escape html in inputs
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value }) // if cleaned and original value are not equal we return an error we defined above.
                return clean;
            }
        }
    }
});
const JOI = BaseJoi.extend(extension); // this is joi we use after applying extension

const storeSchema = JOI.object({
    name: JOI.string().required().escapeHTML(),
    location: JOI.string().required().escapeHTML(),
    description: JOI.string().required().escapeHTML(),
    category: JOI.string().required().escapeHTML(),
    contact: JOI.number().integer().required(),
    reviews: JOI.array(),
    items: JOI.array(),
    cost: JOI.array()
});

module.exports.validateEvent = (req, res, next) => {
    // console.log(req.body);
    const { error } = storeSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}


