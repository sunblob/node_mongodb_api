const ErrorResponse = require('./../utils/errorResponse')

const errorHandler = (err, req, res, next) => {
    //log to console for dev
    console.log(err)

    let error = { ...err }
    error.message = err.message

    if (err.name === 'CastError') {
        const message = `Nothing was found with id if ${err.value}`
        error = new ErrorResponse(message, 404)
    }

    //duplicate key error
    if (err.code === 11000) {
        const message = `Duplicate fiield value entered`
        error = new ErrorResponse(message, 400)
    }

    //validation erros
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message)
        error = new ErrorResponse(message, 400)
    }


    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server error'
    })
}

module.exports = errorHandler