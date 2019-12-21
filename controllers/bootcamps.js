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
    let query

    //Copy of req.query
    const reqQuery = { ...req.query }

    //fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit']

    //loop over removeFields and delete em
    removeFields.forEach(param => delete reqQuery[param])

    //create query string
    let queryStr = JSON.stringify(reqQuery)

    // create operators ($gt, $lte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => '$' + match)

    //finding resourse
    query = Bootcamp.find(JSON.parse(queryStr))

    //select fields
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ')
        query = query.select(fields)
    }

    //sorting
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ')
        query = query.sort(sortBy)
    } else {
        query = query.sort({ createdAt: -1 })
    }

    //pagination
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 100
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    const total = await Bootcamp.countDocuments()

    query = query.skip(startIndex).limit(limit)

    const bootcamps = await query

    //pagiantion result
    const pagination = {}

    if (endIndex < total) {
        pagination.next = {
            page: page + 1,
            limit
        }
    }

    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit
        }
    }

    res.status(200).json({
        success: true,
        count: bootcamps.length,
        pagination: pagination,
        data: bootcamps
    })
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
    const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

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
    @desc       delete bootcamps
    @route      DELETE /api/v1/bootcamps/:id
    @access     private
*/
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id)

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
