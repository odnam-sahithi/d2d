if (process.env.NODE_ENV != "production") {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');

const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');

const mongoSanitize = require('express-mongo-sanitize');

// AUTHENTICATION
const passport = require('passport');
const passportSetup = require('./config/passportSetup'); // This is to set up passport i.e. to run code in passport-setup.js so that
// it will know what google authentication strategy is. 

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true })); // TO PARSE DATA 
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.engine('ejs', ejsMate);

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

mongoose.set('strictQuery', true);
// const dburl =  process.env.DB_URL || 'mongodb://localhost:27017/DBMS1';
const dburl = process.env.DB_URL || 'mongodb://localhost:27017/DBMS1';

mongoose.connect(dburl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}, (err) => {
    if (!err) {
        console.log('MongoDB Connection Succeeded.')
    } else {
        console.log('Error in DB connection: ' + err)
    }
});


// Sanitization 
app.use(mongoSanitize()); // To remove prohibited characters 


const secret = process.env.SECRET || 'thisisasecret';
const store = new MongoStore({
    mongoUrl: dburl,
    secret: secret,
    touchAfter: 24 * 3600
});

store.on('error', function (e) {
    console.log('Session store error', e);
})


// FOR PASSPORT
app.use(session({
    store: store,  // now mongo will be used to store sessions.
    store: MongoStore.create({
        mongoUrl: dburl,
        secret: secret,
        touchAfter: 24 * 3600
    }),
    name: 'D2DNeeds',
    secret,
    saveUninitialized: false, // don't create session until something stored
    resave: false, //don't save session if unmodified
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
})
);

// initialize passport
app.use(passport.initialize());
app.use(passport.session());

app.use(flash()); // should be done after session 

// GLOBAL VARIABLES
app.use(async (req, res, next) => {
    res.locals.currentUser = req.user; // 'req.user' will be a true if user is loggedIn
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    res.locals.primary = req.flash('primary');
    next();
})


const { isLoggedIn, isAuthor, catchAsyncError, isReviewOwner, validateEvent} = require('./middleware');


const Company = require('./models/company');
const Review = require('./models/review');
const User = require('./models/review');

{
// // auth with google+
// app.use('/auth/google', passport.authenticate('google', { 
//     scope: ['profile'] // scope tells passport, what is needed from users profile.(like profile, email,...) and gives us them 
// })); 

// // callback route for google to redirect to
// app.get('/auth/google/redirect', passport.authenticate('google', { failureRedirect: '/failed' }), (req, res) => {
//     // res.redirect('/addPlace');
//     res.send("okkk");
// })
}


// FOR IMAGES
const multer = require('multer');
// const upload = multer({dest: 'uploads/'});
const { storage } = require('./cloudinary/index');
const upload = multer({ storage }); // now instead of storing locally we store in cloudinary storage
const cloudinary = require('cloudinary');

// CONTROLLERS
const placeController = require('./controllers/places');
const reviewController = require('./controllers/review');

// LOGIN PAGE
app.get('/home', (req, res) => {
    res.render('home');
})

//ABOUT PAGE
app.get('/about', (req, res) => {
    res.render('about');
})

// SHOW ALL PAGE
app.get('/showAll',  catchAsyncError(placeController.showAll));

// ADD PLACE FORM
app.get('/addPlace', isLoggedIn, placeController.addPlaceForm);

// ADD PLACE
app.post('/addPlace', isLoggedIn, upload.array('images'), validateEvent, catchAsyncError(placeController.addPlaceDB));


// UPDATE FORM
app.get('/place/:id', isLoggedIn, isAuthor,  catchAsyncError(placeController.updateForm));

// UPDATE IN DB
app.put('/place/:id', isLoggedIn, isAuthor, upload.array('images'), validateEvent, catchAsyncError(placeController.updateInDB));

// DELETE PLACE
app.delete('/place/:id', isLoggedIn, isAuthor,  catchAsyncError(placeController.deletePlace));

// SHOW PAGE
app.get('/show/:id', catchAsyncError(placeController.showParticularPlace));

// ADD REVIEW
app.post('/addReview/:id',  isLoggedIn, catchAsyncError(reviewController.addReview));

// DELETE REVIEW
app.delete('/review/:place_id/delete/:re_id', isLoggedIn, isReviewOwner, catchAsyncError(reviewController.deleteReview));

app.use('/auth', require('./routes/auth'));

app.use('/', (req, res) => res.redirect('/about'));

//404 ROUTE:
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found!', 404));
})

app.use((err, req, res, next) => {
    if (!err.status) err.status = 500;
    if (!err.message) err.message = 'Something went wrong!';
    res.render('error', { err });
    // res.send(err);
})


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`LISTENING ON PORT ${port}!`);
})

