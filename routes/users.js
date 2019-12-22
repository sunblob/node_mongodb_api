const express = require('express')
const {
    getUser,
    getUsers,
    createUser,
    updateUser,
    deleteUser
} = require('./../controllers/users')
const User = require('./../models/User')

const router = express.Router()

const { protect, authorize } = require('./../middleware/auth')
const advancedResults = require('./../middleware/advancedresults')

router.use(protect)
router.use(authorize('admin'))

router
    .route('/')
    .get(advancedResults(User), getUsers)
    .post(createUser)

router
    .route('/:id')
    .get(getUser)
    .put(updateUser)
    .delete(deleteUser)

module.exports = router
