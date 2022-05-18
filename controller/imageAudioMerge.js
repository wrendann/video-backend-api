const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const { spawn } = require('child_process')
const { v1: uuidv1 } = require('uuid')
const fs = require('fs')

const imageAudioMergeRouter = express.Router()

imageAudioMergeRouter.post('/', (req, res) => {

    //extracting image and audio path from body
    const imagePath = req.body.image_file_path
    const audioPath = req.body.audio_file_path
    //check if they both exist
    if(!imagePath || !audioPath)
    {
        return res.json({
            status: "error",
            message: "File path(s) missing"
        })
    }//check if they are both valid
    else if(!imagePath.startsWith('public/upload/') || !audioPath.startsWith('public/upload/'))
    {
        return res.json({
            status: "error",
            message: "File(s) not found"
        })
    }

    //get file name from file path
    const imageName = imagePath.substring(14)
    const audioName = audioPath.substring(14)

    //make sure audio extension is correct
    if(!(path.extname(audioName) === '.mp3'))
    {
        return res.json({
            status: "error",
            message: "Audio File is not a .mp3 file"
        })
    }//make sure image extension is correct
    else if(!(['.jpg', '.jpeg', '.png'].includes(path.extname(imageName))))
    {
        return res.json({
            status: "error",
            message: "Image File is not in an acceptable format"
        })
    }

    const gridfsbucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        chunkSizeBytes: 1024,
        bucketName: 'filesBucket'
    })

    //open download streams for both image and audio from database
    const imageStream = gridfsbucket.openDownloadStreamByName(imageName)
    const audioStream = gridfsbucket.openDownloadStreamByName(audioName)

    //create name and path for video file
    const videoName = uuidv1() + '.mp4'
    const videoPath = 'public/upload/' + videoName

    //ffmpeg command to merge the image and audio to an mp4 video file. this file will be saved to the data folder
    //and will have name {random name}.mp4.mp4, and will have png encoding
    const command = spawn('ffmpeg', ['-loop', '1', '-r', '1', '-i', 'pipe:0', '-i', 'pipe:3', 
    '-c', 'copy', '-shortest', 'data/'+videoName+'.mp4'], {
        stdio: ['pipe', 'pipe', 'pipe', 'pipe']
    })

    //we pipe both streams to the command
    imageStream.pipe(command.stdio[0])
    audioStream.pipe(command.stdio[3])

    //after the first command is executed
    command.on('close', () => {
        //ffmpeg command to convert video to libx264 encoding, which will make it fit to play on browsers like chrome
        const command2 = spawn('ffmpeg', ['-i', 'data/'+videoName+'.mp4', '-vcodec', 'libx264', '-acodec', 'aac', 'data/'+videoName])
        command2.on('close', () => {
            //when second command is executed, first file is deleted
            fs.unlink(__dirname+'/../data/'+videoName+'.mp4', (err) => {
                if(err)
                    return console.log("error:" + err.message)
                console.log('data/'+videoName+'.mp4 deleted')
            })
            //we read the second file and upload it to the database via an upload stream
            fs.createReadStream('data/'+videoName).
            pipe(gridfsbucket.openUploadStream(videoName)).
            on('error', (error) => {
                res.status(404).json({
                    staus: "error",
                    message: error.message
                })
            }).
            on('finish', () => 
            {
                //when upload is finished, the second file is deleted
                fs.unlink(__dirname+'/../data/'+videoName, (err) => {
                    if(err)
                        return console.log("error:" + err.message)
                    console.log('data/'+videoName+' deleted')
                })
                //success json is returned
                return res.json({
                    status: "ok",
                    message: "Video Created Successfully",
                    file_path: videoPath
                })
            })
            
        })
        //empty call back function
        command2.stderr.on('data', () => {})
    })
    command.stderr.on('data', () => {})
})

module.exports = imageAudioMergeRouter