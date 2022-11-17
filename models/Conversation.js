const mongoose = require('mongoose');
const userModel = require('./userModel');

const conversationSchema = new mongoose.Schema({
    members: 
         [{
            type: mongoose.Schema.Types.ObjectId, ref: 'User',
        }]
    ,
}, {timestamps: true});

module.exports = mongoose.model('Conversation', conversationSchema);

