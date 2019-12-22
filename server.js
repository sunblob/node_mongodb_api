const express = require('express')
const path = require('path')
const dotenv = require('dotenv')
const morgan = require('morgan')
const colors = require('colors')
const fileupload = require('express-fileupload')
const cookieParser = require('cookie-parser')
const errorHandler = require('./middleware/error')
//load env variables
dotenv.config({ path: './config/config.env' })
const connectDB = require('./config/db')

//connect to database
connectDB()

//route files
const bootcamps = require('./routes/bootcamps')
const courses = require('./routes/courses')
const auth = require('./routes/auth')

const app = express()

//body parser
app.use(express.json())

//cookie parser
app.use(cookieParser())

//dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

//fileupload
app.use(fileupload())

//set static folder
app.use(express.static(path.join(__dirname, 'public')))

//mount routes
app.use('/api/v1/bootcamps', bootcamps)
app.use('/api/v1/courses', courses)
app.use('/api/v1/auth', auth)

app.use(errorHandler)

const PORT = process.env.PORT || 5000

const server = app.listen(
    PORT,
    console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow
            .bold
    )
)

//handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`.red)
    //close server
    server.close(() => {
        process.exit()
    })
})
