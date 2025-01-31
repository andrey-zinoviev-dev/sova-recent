const mongoose = require('mongoose');
const messageModel = require('./chatMessage');
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
    },
    // admin: {
    //     type: Boolean,
    //     default: false,
    // },
    roles: [String],
    courses: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'courses',

    }],
    // online: {
    //     type: Boolean, 
    //     default: false,
    // }
    // messages: [{
    //     type: mongoose.Schema.Types.ObjectId, ref: 'Message'
    // }],
    // courseTier: {
    //     type: mongoose.Schema.Types.ObjectId, ref: 'plan',
    //     required: true,
    // }
});

module.exports = mongoose.model('User', userSchema);