const advancedResults = (model, populate) => async (req, res, next) => {
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
    query = model.find(JSON.parse(queryStr)).populate('courses')

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
    const total = await model.countDocuments()

    query = query.skip(startIndex).limit(limit)

    if (populate) {
        query = query.populate(populate)
    }

    const results = await query

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

    res.advancedResults = {
        success: true,
        count: results.length,
        pagination,
        data: results
    }

    next()
}

module.exports = advancedResults
