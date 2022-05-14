const express = require('express');
const upDownRouter = express.Router();
var mongoose = require('mongoose');
var streamifier = require('streamifier');
var fs = require('fs');
const { v1: uuidv1 } = require('uuid');
const path = require('path')
const User = require('../model/user');
const req = require('express/lib/request');

//endpoint for uploading files
upDownRouter.post('/upload_file', (req, res) => {
    //check if token is authenticated
    if(!req.isTokenAuthenticated)
    {
        return res.status(403).json({"status": "error", "message": "Token cannot be authenticated"})
    }

    //check if files are present in form data (using express-fileupload)
    if (!req.files || Object.keys(req.files).length === 0 || !req.files.my_file) 
    {
        return res.status(400).json({"status": "error", "message": "No files were found"});
    }

    //new filename, filepath is created and new user object is created, but not updated yet
    const file = req.files.my_file
    const fileName = uuidv1() + path.extname(file.name)
    const newUserObj = {
        userId: req.user.userId,
        files: [...req.user.files, fileName]
    }
    const filePath = 'public/upload/' + fileName

    const gridfsbucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        chunkSizeBytes: 1024,
        bucketName: 'filesBucket'
    });

    //we send the data of the file to the database using gridfs
    streamifier.createReadStream(file.data).
        pipe(gridfsbucket.openUploadStream(fileName)).
        on('error', (error) => {
            res.status(404).json({
                staus: "error",
                message: error.message
            })
        }).
        on('finish', async() => {
            //once uploading is over, we update the user object and return json output
            await User.findByIdAndUpdate(req.user.id, newUserObj)
            res.status(200).json({
                status: "ok",
                file_path: filePath
            })
        })
})

//endpoint for downloading file
upDownRouter.get('/download_file', (req, res) => {
    //check if file_path is not given
    if(!req.query.file_path)
    {
        return res.status(404).json({"status": "error", "message": "file_path not found"})
    }
    const filePath = req.query.file_path;
    //check if filepath starts with public/upload, which we give in every new file path
    if(!filePath.startsWith('public/upload/'))
    {
        return res.status(404).json({"status": "error", "message": "File not found"})
    }
    //filename excludes 'public/upload/'
    const fileName = filePath.substring(14)

    //setting this helps to download the files instead of previewing it
    res.setHeader('Content-disposition', 'attachment; filename=' + fileName);
    res.setHeader('Content-type', 'application/octet-stream');

    const gridfsbucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        chunkSizeBytes: 1024,
        bucketName: 'filesBucket'
    })

    //download files from database via stream
    gridfsbucket.openDownloadStreamByName(fileName).pipe(res)
})

//endpoint for previewing file
upDownRouter.get('/public/upload/:file_name', (req, res) => 
{
    //check if there is no file name
    if(!req.params.file_name)
    {
        return response.status(404).json({"status": "error", "message": "File not found"})
    }
    const fileName = req.params.file_name
    const ext = path.extname(fileName)

    //setting content type according to the extension, so that it can be previewed correctly
    if(ext === '.txt')
    {
        res.setHeader('Content-Type', 'text/plain')
    }
    else if(ext === '.mp3')
    {
        res.setHeader('Content-Type', 'audio/mpeg')
    }
    else if(ext === '.mp4')
    {
        res.setHeader('Content-Type', 'video/mp4')
    }

    const gridfsbucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        chunkSizeBytes: 1024,
        bucketName: 'filesBucket'
    })

    //previews file
    gridfsbucket.openDownloadStreamByName(fileName).pipe(res)

})

module.exports = upDownRouter