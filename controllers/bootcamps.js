const path = require('path')
const geocoder = require('./../utils/geocoder')
const Bootcamp = require('./../models/Bootcamp')
const asyncHandler = require('./../middleware/async')
const ErrorResponse = require('./../utils/errorResponse')

/*
    @desc       Get all bootcamps
    @route      GET /api/v1/bootcamps
    @access     public
*/
exports.getAllBootcamps = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults)
})

/*
    @desc       Get single bootcamps
    @route      GET /api/v1/bootcamps/:id
    @access     public
*/
exports.getBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)

    if (!bootcamp) {
        return next(
            new ErrorResponse(
                `Bootcamp was not found with id ${req.params.id}`,
                404
            )
        )
    }

    res.status(200).json({
        success: true,
        data: bootcamp
    })
})

/*
    @desc       create new bootcamp
    @route      POST /api/v1/bootcamps
    @access     private
*/
exports.createBootcamp = asyncHandler(async (req, res, next) => {
    //add user to body
    req.body.user = req.user.id

    //check for published bootcamp
    const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id })

    // if the user is not an admin they can only add 1 bootcamp
    if (publishedBootcamp && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `the user with ID ${req.user.id} has already published a bootcamp`,
                400
            )
        )
    }

    const bootcamp = await Bootcamp.create(req.body)

    res.status(201).json({
        success: true,
        data: bootcamp
    })
})

/*
    @desc       update bootcamp
    @route      PUT /api/v1/bootcamps/:id
    @access     private
*/
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
    let bootcamp = await Bootcamp.findById(req.params.id)

    if (!bootcamp) {
        return next(
            new ErrorResponse(
                `Bootcamp was not found with id ${req.params.id}`,
                404
            )
        )
    }

    //make sure user is owner
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `user with ID ${req.user.id} is not authorized to update this bootcamp`,
                401
            )
        )
    }

    bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    res.status(200).json({
        success: true,
        data: bootcamp
    })
})

/*
    @desc       delete bootcamps
    @route      DELETE /api/v1/bootcamps/:id
    @access     private
*/
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)

    if (!bootcamp) {
        return next(
            new ErrorResponse(
                `Bootcamp was not found with id ${req.params.id}`,
                404
            )
        )
    }

    //make sure user is owner
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `user with ID ${req.user.id} is not authorized to delete this bootcamp`,
                401
            )
        )
    }

    await bootcamp.remove()
    res.status(200).json({
        success: true,
        data: bootcamp
    })
})

/*
    @desc       get bootcamps within radius
    @route      GET /api/v1/bootcamps/radius/:zipcode/:distance
    @access     private
*/
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
    const { zipcode, distance } = req.params

    const loc = await geocoder.geocode(zipcode)
    const lat = loc[0].latitude
    const lng = loc[0].longitude

    const radius = distance / 3963
    const bootcamps = await Bootcamp.find({
        location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
    })

    res.status(200).json({
        success: true,
        count: bootcamps.length,
        data: bootcamps
    })
})

/*
    @desc       upload photo for bootcamp
    @route      PUT /api/v1/bootcamps/:id/photo
    @access     private
*/
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)

    if (!bootcamp) {
        return next(
            new ErrorResponse(
                `Bootcamp was not found with id ${req.params.id}`,
                404
            )
        )
    }

    //make sure user is owner
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `user with ID ${req.user.id} is not authorized to update this bootcamp`,
                401
            )
        )
    }

    if (!req.files) {
        return next(new ErrorResponse(`Please upload a file`, 400))
    }

    const file = req.files.file

    //make sure its a photo
    if (!file.mimetype.startsWith('image')) {
        return next(new ErrorResponse(`Please upload an image file`, 400))
    }

    if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(
            new ErrorResponse(
                `Please upload an less than ${process.env.MAX_FILE_UPLOAD}`,
                400
            )
        )
    }

    // create custom file name
    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`

    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
        if (err) {
            console.log(err)
            return next(new ErrorResponse(`Problem with file upload`, 500))
        }

        await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name })

        res.status(200).json({
            success: true,
            data: file.name
        })
    })
})
