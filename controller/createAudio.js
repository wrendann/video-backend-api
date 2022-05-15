const express = require('express')
const Gtts = require('gtts')
const createAudioRouter = express.Router()
var mongoose = require('mongoose');
const path = require('path')
const { v1: uuidv1 } = require('uuid')

createAudioRouter.post('/', async (req, res) => 
{
    //extracting text path from body. check if textpath exists and starts with public/upload
    const textPath = req.body.file_path;
    if(!textPath)
    {
        return res.status(404).json({"status": "error", "message": "file_path not found"})
    }
    else if(!textPath.startsWith('public/upload/'))
    {
        return res.status(404).json({"status": "error", "message": "File not found"})
    }

    //extract actual text file name from text path
    const textName = textPath.substring(14)

    //check if we are actually using a .txt file
    if(path.extname(textName) !== '.txt')
    {
        return res.status(404).json({"status": "error", "message": "File is not text file"})
    }

    const gridfsbucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        chunkSizeBytes: 1024,
        bucketName: 'filesBucket'
    })

    //get text as a stream from database
    const textStream = gridfsbucket.openDownloadStreamByName(textName)

    //function to convert stream to a string
    const streamToString = (stream) => {
        const chunks = [];
        return new Promise((resolve, reject) => {
          stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          stream.on('error', (err) => reject(err));
          stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        })
      }

    //converted string is stored in variable
    const textToBeConverted = await streamToString(textStream)

    //object to get the audio from text
    const gtts = new Gtts(textToBeConverted, 'en')

    //getting audio name which will be in mp3 format, and audio path to return
    const audioName = uuidv1() + '.mp3'
    const audioPath = 'public/upload/' + audioName

    //getting stream of audio and uploading it into database under audio name
    gtts.stream().pipe(gridfsbucket.openUploadStream(audioName)).
    on('error', (error) => {
        res.status(404).json({
            staus: "error",
            message: error.message
        })
    }).
    on('finish', async() => 
    {
        //when upload is finished, we return appropriate json
        res.json({
            status: "ok",
            message: "text to speech converted",
            file_path: audioPath
        })
    })
})

module.exports = createAudioRouter