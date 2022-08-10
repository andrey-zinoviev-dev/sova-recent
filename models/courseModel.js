const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  name: String,
  description: String,
  images: [String],
  videos: [String],
});

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  length: {
    type: Number,
  },
  modules: [{type: mongoose.Schema.Types.ObjectId, ref: 'module'}],
  // {
  //   // type: [{ name: String, description: String, images: [String], videos: [String], }],
  // },
  // images: {
  //   type: Array,
  // },
  // videos: {
  //   type: Array,
  // },
});
const Courses = mongoose.model('courses', courseSchema);
const lessonModules = mongoose.model('module', moduleSchema);

module.exports = { Courses, lessonModules };