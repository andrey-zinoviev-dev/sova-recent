const mongoose = require('mongoose');
const planSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    length: {
        type: Number,
        required: true,
    },
    numberOfModules: {
        type: Number,
        required: true,
    },
    vip: {
        type: Boolean,
    }
});

module.exports = mongoose.model('Plan', planSchema);