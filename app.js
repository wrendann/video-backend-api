const express = require('express')
require('express-async-errors')
const cors = require('cors')
const usersRouter = require('./controller/users')
const cookieParser = require('cookie-parser')

const app = express()

app.use(cors({
    credentials: true,
  }))


app.use(express.static('build'))
app.use(express.json())
app.use(cookieParser())

app.use('/create_new_storage', usersRouter)

module.exports = app