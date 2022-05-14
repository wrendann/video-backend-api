
const listAllFilesRouter = require('express').Router()

//if token is not authenticated, error is returned, else files are returned in an object
listAllFilesRouter.get('/', async(request, response) => {
    if(!request.isTokenAuthenticated)
    {
        return response.status(403).json({"status": "error", "message": "Token cannot be authenticated"})
    }
    return response.json({
        "status": "ok",
        "data": request.user.files
    })
})

module.exports = listAllFilesRouter