require('dotenv').config()
const { v4: uuidv4 } = require('uuid');
const User = require('../model/user')
const jwt = require('jsonwebtoken')
const usersRouter = require('express').Router()

usersRouter.post('/', async (request, response) => {

  const id = uuidv4()  
  const userObject = {userId: id}

  const userToPost = new User({userId: id, files: []})
  await userToPost.save()

  const token = jwt.sign(userObject, process.env.SECRET)

  response
    .status(200)
    .cookie('UserTokenForFileApp', JSON.stringify({token, userObject}), {
      secure: true, httpOnly: true, sameSite: 'lax'
    })
    .send({
        "status": "ok",
        "message": "Storage Created Successfully"
    })
})

module.exports = usersRouter