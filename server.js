const express = require('express')
const dotenv = require('dotenv')
const morgan = require('morgan')
const colors = require('colors')
const errorHandler = require('./middleware/error')
//load env variables
dotenv.config({ path: './config/config.env' })
const connectDB = require('./config/db')

//connect to database
connectDB()

//route files
const bootcamps = require('./routes/bootcamps')

const app = express()

//body parser
app.use(express.json())

//dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

//mount routes
app.use('/api/v1/bootcamps', bootcamps)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold))

//handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`.red)
    //close server 
    server.close(() => {
        process.exit()
    })
})