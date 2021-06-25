const User = require('../models/user');

// @route POST api/auth/recover
// @desc Recover Password - Generates token and Sends password reset email
// @access Public
exports.recover = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) return res.status(401).json({ message: 'The email address ' + req.body.email + ' is not associated with any account. Double-check your email address and try again.'});

        //Generate and set password reset token
        user.generatePasswordReset();

        // Save the updated user object
        await user.save();

        res.status(200).json({message: 'A reset email has been sent to ' + user.email + '.'});
    } catch (error) {
        res.status(500).json({message: error.message})
    }
};

// @route POST api/auth/reset
// @desc Reset Password - Validate password reset token and shows the password reset view
// @access Public
exports.reset = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({resetPasswordToken: token, resetPasswordExpires: {$gt: Date.now()}});

        if (!user) return res.status(401).json({message: 'Password reset token is invalid or has expired.'});

        //Redirect user to form with the email address
        res.render('reset', {user});
    } catch (error) {
        res.status(500).json({message: error.message})
    }
};

// @route POST api/auth/reset
// @desc Reset Password
// @access Public
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({resetPasswordToken: token, resetPasswordExpires: {$gt: Date.now()}});

        if (!user) return res.status(401).json({message: 'Password reset token is invalid or has expired.'});

        //Set the new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.isVerified = true;

        // Save the updated user object
        await user.save();

        res.status(200).json({message: 'Your password has been updated.'});

    } catch (error) {
        res.status(500).json({message: error.message})
    }
};