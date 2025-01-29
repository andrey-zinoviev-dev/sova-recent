const mongoose = require('mongoose');
const userModel = require('./userModel');
const lessonModel = require('./lessonsModel');
// const moduleSchema = new mongoose.Schema({
//   name: String,
//   // description: String,
//   // layout: Object,

//   // images: [String],
//   // videos: [String],
//   lessons: [
//     new mongoose.Schema({
//       title: String,
//       outline: Object,
//       // module:  {
//       //   type: mongoose.Schema.Types.ObjectId, ref: 'module',
//       // }
//     }),
//   ],
//   messages: [{
//     type: mongoose.Schema.Types.ObjectId, ref: 'Message'
//   }],
//   course: {
//     type: mongoose.Schema.Types.ObjectId, ref: 'courses',
//   },
//   students: [
//     {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
//   ],
// });

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  // length: {
  //   type: Number,
  // },
  // students: [{
  //   _id: mongoose.Schema.Types.ObjectId, ref: "User",
  //   tarif: {
  //     title: String,
  //     starts: String,
  //     expires: String,
  //   }
  //   // tarif: String,
  //   // id: String,
  //   // name: String,
  //   // email: String,
  //   // tarif: String,
  //   // type: mongoose.Schema.Types.ObjectId, ref: "User",
  // }],
  // available: {
  //   type: Boolean,
  //   default: true,
  // },
  // hidden: {
  //   type: Boolean,
  //   default: true,
  // },
  // modules: [
  //   new mongoose.Schema({
  //     title: String,
  //     cover: Object,
  //     // lessons: Array,
  //     author: Object,
  //     available: Boolean,
  //     // description: String,
  //     // layout: Object,
    
  //     // images: [String],
  //     // videos: [String],
  //     lessons: [
  //       new mongoose.Schema({
  //         title: String,
  //         cover: Object,
  //         content: Object,
  //         available: Boolean,
  //         // module: Object,
  //         // module:  {
  //         //   type: mongoose.Schema.Types.ObjectId, ref: 'module',
  //         // }
  //       }),
  //     ],
  //     // messages: [{
  //     //   type: mongoose.Schema.Types.ObjectId, ref: 'Message'
  //     // }],
  //     course: {
  //       type: mongoose.Schema.Types.ObjectId, ref: 'courses',
  //     },
  //     // students: [
  //     //   {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  //     // ],
  //   }),
  // ],
  // modules: [{type: mongoose.Schema.Types.ObjectId, ref: 'module'}],
  author: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User',
  },
  // cover: Object,
  tarifs: {
    type: Array,
    required: true,
    default: [],
    name: String,
    start: String,
    expire: String,
  }
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
// const lessonModules = mongoose.model('module', moduleSchema);

module.exports = { Courses };