const mongoose = require('mongoose');

const CommentsSchema = new mongoose.Schema({
  commentId1: {
    type: String,
  },
  postId1: {
    type: String,
  },
  status1: {
    type: String,
  },
  content1: [ {
    commentId1: {
      type: String,
    },
    comments1: {
      type: String,
    },
  }]
});

const CommentsM = mongoose.model('CommentsM', CommentsSchema)

module.exports = { CommentsM };

