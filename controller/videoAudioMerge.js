const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const { spawn } = require('child_process')
const { v1: uuidv1 } = require('uuid')

const videoAudioMergeRouter = express.Router()

videoAudioMergeRouter.post('/', (req, res) => {

    //extracting video path and audio path from body
    const videoPath = req.body.video_file_path
    const audioPath = req.body.audio_file_path

    //check if the paths exist
    if(!videoPath || !audioPath)
    {
        return res.json({
            status: "error",
            message: "File path(s) missing"
        })
    }//check if the paths are valid
    else if(!videoPath.startsWith('public/upload/') || !audioPath.startsWith('public/upload/'))
    {
        return res.json({
            status: "error",
            message: "File(s) not found"
        })
    }

    //get file names from the file paths
    const videoName = videoPath.substring(14)
    const audioName = audioPath.substring(14)

    //check if format of audio file is mp3
    if(!(path.extname(audioName) === '.mp3'))
    {
        return res.json({
            status: "error",
            message: "Audio File is not a .mp3 file"
        })
    }//check if format of video file is mp4
    else if(!(path.extname(videoName) === '.mp4'))
    {
        return res.json({
            status: "error",
            message: "Video File is not a .mp4 file"
        })
    }

    const gridfsbucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        chunkSizeBytes: 1024,
        bucketName: 'filesBucket'
    })

    //open download streams for both video and audio from database
    const videoStream = gridfsbucket.openDownloadStreamByName(videoName)
    const audioStream = gridfsbucket.openDownloadStreamByName(audioName)

    //create name and path for new video file
    const newVideoName = uuidv1() + '.mp4'
    const newVideoPath = 'public/upload/' + newVideoName

    //ffmpeg command to merge the audio and video to a single video, the video will output in ismv format
    const command = spawn('ffmpeg', ['-i', 'pipe:0', '-i', 'pipe:3', '-c:v', 'copy', '-map', '0:v:0', '-map', '1:a:0',
    '-shortest', '-f', 'ismv', 'pipe:1'], {
        stdio: ['pipe', 'pipe', 'pipe', 'pipe']
    })

    //we pipe streams to the command
    videoStream.pipe(command.stdio[0])
    audioStream.pipe(command.stdio[3])

    //we pipe the output of the command to the upload stream
    command.stdout.pipe(gridfsbucket.openUploadStream(newVideoName)).
    on('error', (err) => {
        res.json({
            status: 'error',
            message: err.message
        })
    }).
    on('finish', () => {
        //when finished, we return the appropriate json
        return res.json({
            status: "ok",
            message: "Video and Audio Merged Successfully",
            file_path: newVideoPath
        })
    })

    command.stdout.on(('data'), () => {})
    command.stderr.on(('err'), () => {})
})

module.exports = videoAudioMergeRouter