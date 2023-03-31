const mongoose = require('mongoose');
const userModel = require('./userModel');

const moduleSchema = new mongoose.Schema({
  name: String,
  description: String,
  layout: Object,
  images: [String],
  videos: [String],
  messages: [{
    type: mongoose.Schema.Types.ObjectId, ref: 'Message'
  }],
  course: {
    type: mongoose.Schema.Types.ObjectId, ref: 'courses',
  },
  students: [
    {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  ],
});

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  description: {
    type: String,
  },
  length: {
    type: Number,
  },
  modules: [{type: mongoose.Schema.Types.ObjectId, ref: 'module'}],
  author: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User',
  },
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