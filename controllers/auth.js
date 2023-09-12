module.exports.login_get = (req,res) => {   
    res.redirect('/home');
}

module.exports.logout = (req, res) => {
    req.logOut();
    // req.flash('success', 'Bye');
    res.redirect('/auth/login');
};
