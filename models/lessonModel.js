const mongoose = require('mongoose');
// const courses = require('./courseModel');
const LessonSchema = new mongoose.Schema({
  title: String,
  course: {
    type: mongoose.Schema.Types.ObjectId, ref: "courses",
  },
});

module.exports = mongoose.model('Lessons', LessonSchema)