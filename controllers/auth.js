const crypto = require('crypto')
const User = require('./../models/User')
const asyncHandler = require('./../middleware/async')
const ErrorResponse = require('./../utils/errorResponse')
const sendEmail = require('./../utils/sendemail')

/*
    @desc       register user
    @route      POST /api/v1/auth/register
    @access     public
*/
exports.register = asyncHandler(async (req, res, next) => {
    const { name, email, password, role } = req.body

    // create user
    const user = await User.create({
        name,
        email,
        password,
        role
    })

    sendTokenResponse(user, 200, res)
})

/*
    @desc       login user
    @route      POST /api/v1/auth/login
    @access     public
*/
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body

    // validate email and password
    if (!email || !password) {
        return next(
            new ErrorResponse('please provide email and/or password', 400)
        )
    }

    //check for user
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
        return next(new ErrorResponse('invalid credentials', 401))
    }

    //check is password matches
    const isMatch = await user.matchPassword(password)

    if (!isMatch) {
        return next(new ErrorResponse('invalid credentials', 401))
    }

    sendTokenResponse(user, 200, res)
})

/*
    @desc       get current logged user
    @route      POST /api/v1/auth/me
    @access     private
*/
exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id)

    res.status(200).json({
        success: true,
        data: user
    })
})

/*
    @desc       reset password
    @route      PUT /api/v1/auth/resetpassword/:resettoken
    @access     public
*/
exports.resetPassword = asyncHandler(async (req, res, next) => {
    //get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex')

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    })

    if (!user) {
        return next(new ErrorResponse('Invalid token', 400))
    }

    // set the new password
    user.password = req.body.password
    ;(user.resetPasswordToken = undefined),
        (user.resetPasswordExpire = undefined)

    await user.save()

    sendTokenResponse(user, 200, res)
})

/*
    @desc       forgot password
    @route      POST /api/v1/auth/forgotpassword
    @access     public
*/
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email })

    if (!user) {
        return next(new ErrorResponse('theres no user with that email', 404))
    }

    //reset token
    const resetToken = user.getResetPasswordToken()

    await user.save({ validateBeforeSave: false })

    // create reset url
    const resetUrl = `${req.protocol}://${req.get(
        'host'
    )}/api/v1/auth/resetpassword/${resetToken}`
    const message = `please make a PUT request to: ${resetUrl}`

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password reset token',
            message
        })

        res.status(200).json({
            success: true
        })
    } catch (error) {
        console.log(error)
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined

        await user.save({ validateBeforeSave: false })

        return next(new ErrorResponse('email could not to be sent', 500))
    }

    res.status(200).json({
        success: true,
        data: user
    })
})

/*
    @desc       update user details
    @route      PUT /api/v1/auth/updatedetails
    @access     private
*/
exports.updateDetails = asyncHandler(async (req, res, next) => {
    // const fieldsToUpdate = {
    //     name: req.body.name,
    //     email: req.body.email
    // }

    // const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    //     new: true,
    //     runValidators: true
    // })

    let user = await User.findById(req.user.id)

    if (!user) {
        return next(new ErrorResponse('no user was found', 400))
    }

    const fieldsToUpdate = {
        name: req.body.name || user.name,
        email: req.body.email || user.email
    }

    user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    })

    res.status(200).json({
        success: true,
        data: user
    })
})

/*
    @desc       update password
    @route      PUT /api/v1/auth/updatepassword
    @access     private
*/
exports.updatePassword = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password')

    //check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
        return next(new ErrorResponse('password is incorrect', 401))
    }

    user.password = req.body.newPassword
    await user.save()

    sendTokenResponse(user, 200, res)
})

// get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // create token
    const token = user.getSignedJwtToken()

    const options = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 3600 * 1000
        ),
        httpOnly: true
    }

    if (process.env.NODE_ENV === 'production') {
        options.secure = true
    }

    res.status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token
        })
}
