const Course = require('./../models/Course')
const Bootcamp = require('./../models/Bootcamp')
const asyncHandler = require('./../middleware/async')
const ErrorResponse = require('./../utils/errorResponse')

/*
    @desc       Get courses
    @route      GET /api/v1/courses
    @route      GET /api/v1/bootcamps/:bootcampId/courses
    @access     public
*/
exports.getCourses = asyncHandler(async (req, res, next) => {
    if (req.params.bootcampId) {
        const courses = await Course.find({ bootcamp: req.params.bootcampId })
        return res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        })
    } else {
        res.status(200).json(res.advancedResults)
    }
})

/*
    @desc       Get single courses
    @route      GET /api/v1/courses/:id
    @access     public
*/
exports.getCourse = asyncHandler(async (req, res, next) => {
    const course = await Course.findById(req.params.id).populate({
        path: 'bootcamp',
        select: 'name description'
    })

    if (!course) {
        return next(
            new ErrorResponse(`No couse with id of ${req.params.id}`, 404)
        )
    }

    res.status(200).json({
        success: true,
        data: course
    })
})

/*
    @desc       add course
    @route      POST /api/v1/bootcamps/:bootcampId/courses
    @access     private
*/
exports.addCourse = asyncHandler(async (req, res, next) => {
    req.body.bootcamp = req.params.bootcampId
    req.body.user = req.user.id

    const bootcamp = await Bootcamp.findById(req.params.bootcampId)

    if (!bootcamp) {
        return next(
            new ErrorResponse(`No bootcamp with id of ${req.params.id}`, 404)
        )
    }

    //make sure user is owner
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `user with ID ${req.user.id} is not authorized to add a course to bootcamp ${bootcamp._id}`,
                401
            )
        )
    }

    const course = await Course.create(req.body)

    res.status(200).json({
        success: true,
        data: course
    })
})

/*
    @desc       update course
    @route      PUT /api/v1/courses/:id
    @access     private
*/
exports.updateCourse = asyncHandler(async (req, res, next) => {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    if (!course) {
        return next(
            new ErrorResponse(`No course with id of ${req.params.id}`, 404)
        )
    }

    //make sure user is owner
    if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `user with ID ${req.user.id} is not authorized to update course`,
                401
            )
        )
    }

    res.status(200).json({
        success: true,
        data: course
    })
})

/*
    @desc       delete course
    @route      DELETE /api/v1/courses/:id
    @access     private
*/
exports.deleteCourse = asyncHandler(async (req, res, next) => {
    const course = await Course.findById(req.params.id)

    if (!course) {
        return next(
            new ErrorResponse(`No course with id of ${req.params.id}`, 404)
        )
    }

    //make sure user is owner
    if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `user with ID ${req.user.id} is not authorized to delete course`,
                401
            )
        )
    }

    await course.remove()

    res.status(200).json({
        success: true,
        data: course
    })
})
