const express = require('express')
const router = express.Router()
const {
    getAllBootcamps,
    getBootcamp,
    updateBootcamp,
    createBootcamp,
    deleteBootcamp,
    getBootcampsInRadius
} = require('./../controllers/bootcamps')

router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius)
router.route('/').get(getAllBootcamps).post(createBootcamp)
router.route('/:id').get(getBootcamp).put(updateBootcamp).delete(deleteBootcamp)

module.exports = router
