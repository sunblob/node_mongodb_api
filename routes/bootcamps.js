const express = require('express')
const router = express.Router()
const {
    getAllBootcamps,
    getBootcamp,
    updateBootcamp,
    createBootcamp,
    deleteBootcamp,
    getBootcampsInRadius,
    bootcampPhotoUpload
} = require('./../controllers/bootcamps')

const Bootcamp = require('./../models/Bootcamp')

//include other resourse router
const courseRouter = require('./courses')
const reviewRouter = require('./reviews')

const { protect, authorize } = require('./../middleware/auth')
const advancedResults = require('./../middleware/advancedresults')

//re-route into other resourse routers
router.use('/:bootcampId/courses', courseRouter)
router.use('/:bootcampId/reviews', reviewRouter)

router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius)

router
    .route('/:id/photo')
    .put(protect, authorize('publisher', 'admin'), bootcampPhotoUpload)

router
    .route('/')
    .get(advancedResults(Bootcamp, 'courses'), getAllBootcamps)
    .post(protect, authorize('publisher', 'admin'), createBootcamp)

router
    .route('/:id')
    .get(getBootcamp)
    .put(protect, authorize('publisher', 'admin'), updateBootcamp)
    .delete(protect, authorize('publisher', 'admin'), deleteBootcamp)

module.exports = router
