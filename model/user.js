const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

//userid will be a randomly generated string, files will be array of paths to the files, which will be of type string
const userSchema = new mongoose.Schema({
    userId: {type: String, required: true, unique: true},
    files: {type: [String], default: []}
  })

userSchema.set('toJSON', {
transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
}
})

userSchema.plugin(uniqueValidator)

module.exports = mongoose.model('User', userSchema)