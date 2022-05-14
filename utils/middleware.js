const jwt = require('jsonwebtoken')
const User = require('../model/user')

const unknownEndpoint = (request, response, next) => {
  response.status(404).send({ error: 'unknown endpoint' })
  next()
}

//This function takes the token from the cookies, parses it, verifies it and finds the user and gets their details from it
//these details are stored in the request and are sent to the remaining routes
const tokenAuthenticator = async (request, response, next) => {
  if(request.cookies.UserTokenForFileApp)
  {
    const tokenObject = JSON.parse(request.cookies.UserTokenForFileApp)
    const token = tokenObject.token
    const decodedToken = jwt.verify(token, process.env.SECRET)
    const userId = decodedToken.userId
    const user = await User.findOne({userId: userId})
    if(!user)
    {
      request.user = null
      request.isTokenAuthenticated = false
    }
    else
    {
      request.user = user
      request.isTokenAuthenticated = true
    }
  }
  else{
    request.user = null
    request.isTokenAuthenticated = false
  }
  next()
}

const errorHandler = (error, request, response, next) => {
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  } else if (error.name === 'JsonWebTokenError') {
    return response.status(401).json({
      error: 'invalid token'
    })
  }

  next(error)
}

module.exports = {
    unknownEndpoint,
    tokenAuthenticator,
    errorHandler
  }