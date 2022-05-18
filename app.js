const express = require('express')
require('express-async-errors')
const cors = require('cors')
const newTokensRouter = require('./controller/newTokens')
const middleware = require('./utils/middleware')
const listAllFilesRouter = require('./controller/listAllFiles')
const upDownRouter = require('./controller/upDown')
const createAudioRouter = require('./controller/createAudio')
const imageAudioMergeRouter = require('./controller/imageAudioMerge')
const videoAudioMergeRouter = require('./controller/videoAudioMerge')
const allVideoMergeRouter = require('./controller/allVideoMerge')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload');


const app = express()

app.use(cors({
    credentials: true,
  }))


app.use(express.static('build'))
app.use(express.json())
app.use(cookieParser())
app.use(fileUpload());

//We are using create_new_storage first as it is required for every remaining route
app.use('/create_new_storage', newTokensRouter)

//Since more than one of the remaining routes require token authentication, we can put the middleware here
app.use(middleware.tokenAuthenticator)

app.use('/my_upload_file', listAllFilesRouter)
app.use(upDownRouter)
app.use('/text_file_to_audio', createAudioRouter)
app.use('/merge_image_and_audio', imageAudioMergeRouter)
app.use('/merge_video_and_audio', videoAudioMergeRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app