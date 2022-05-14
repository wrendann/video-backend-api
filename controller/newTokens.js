require('dotenv').config()
const { v4: uuidv4 } = require('uuid');
const User = require('../model/user')
const jwt = require('jsonwebtoken')
const newTokensRouter = require('express').Router()

newTokensRouter.post('/', async (request, response) => {
  
  //upon recieving the request to create new token, we generate an id and assign to an object
  const id = uuidv4()  
  const userObject = {userId: id}

  //we assign the id and empty array to an object, and saves it in the database
  const userToPost = new User({userId: id, files: []})
  await userToPost.save()

  //we generate token using jwt and SECRET in our .env file
  const token = jwt.sign(userObject, process.env.SECRET)

  response
    .status(200)
    .cookie('UserTokenForFileApp', JSON.stringify({token, userObject}), {
      secure: false, httpOnly: true, sameSite: 'lax'
    })
    .send({
        "status": "ok",
        "message": "Storage Created Successfully"
    })
})

//cookies are not secure as there is a bug in Postman that makes it so that secure cookies are not
//stored properly. If there is a frontend, it is better to have secure cookies

module.exports = newTokensRouter