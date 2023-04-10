const mongoose = require('mongoose');
const lessonModuleSchema = new mongoose.Schema({
    title: String,
    module: {
        type: mongoose.Schema.Types.ObjectId, ref: 'modules',
    }
});

module.exports = mongoose.model('lessons', lessonModuleSchema);