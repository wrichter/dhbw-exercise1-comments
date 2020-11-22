// change history
// hs002 ....
// hs003 when using REACT client I get an security violation that react is not allowed to send request to this service
//       to get rid of this security violation add this code
// hs005 extend comment field to add status info from moderation service


const express = require('express');
const app = express();

// 001hs
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');
const cors = require('cors'); 
// 003hs get rid of problem
//  has been blocked by CORS policy: Response to preflight request doesn't pass access control check

app.use(cors());
app.use(bodyParser.json());

// 002hs
const axios = require('axios');
// we want to store the comments in memory 
// and the structure for comments should look like
//    qwer -> {{id:'yxz',content: 'great post'}, {id:'123':content:'great comment'}}
//    asdf -> {{id:'zzz',content: 'next post'}, {id:'456':content:'next great comment'}}
//      qwer and asdf are the ids of the post and yxz,zzz ... are the ids of comments
const commentsByPostId ={};

// hs008 use mongoDB
const mongoose = require('mongoose');
const CommentsM = require('./commentsDataModel.js').CommentsM;
const DB_URI = 'mongodb://mongo:27017/commentsApp';

mongoose.connect(DB_URI, {useNewUrlParser: true, useUnifiedTopology: true}).then(() => {
    console.log("connected to mongo db");
});



// route handler for get request
app.get('/posts/:id/comments', (req, res) =>{
    //res.send(commentsByPostId[req.params.id] || []);
//hs008
    CommentsM.find()
       .then((commentsData) => res.status(200).send(commentsData))
       .catch((err) => res.status(400).send(err));
});

// route handler for post request
// hs002 >async< new for event bus implementation (async)
app.post('/posts/:id/comments', async(req, res) => {
    // create a new commentID
    const commentId = randomBytes(4).toString('hex');
    // get the request body and put it into content
    const {content} = req.body;
    const comments = commentsByPostId[req.params.id] || [];
    //push the content into the array based on id
    comments.push ({id:commentId, content});
    commentsByPostId[req.params.id] = comments;
    
    //hs008
    const commentsM = new CommentsM({
        commentId1: commentId,
        postId1: req.params.id,
        status1: 'pending',
        content1:[
            {commentId1:commentId},
            {comments1:content}]
    });
    console.log(commentsM);
    commentsM.save(function(err, commentsM) {
        if(err) {
            console.log(err);
            return res.status(500).send(); 
        }     
    });
    // hs002 new for event bus implementation
    await axios.post('http://event-bus:4005/events', {
        type: 'CommentCreated',
        data: {
            id: commentId,
            content,
            postId: req.params.id,
            //hs005 for moderation service - new field status
            status: 'pending'
        }
    });
    console.log(comments);
    
    
    res.status(201).send(comments);
});

// hs002 new for event bus implementation
app.post('/events', async(req, res) => {
    console.log('Event received', req.body.type);
    // hs005 
    const { type, data } = req.body;
    if (type === 'CommentModerated') {
        const { postId, id, status, content } = data;
        const comments = commentsByPostId[postId];
        const comment = comments.find(comment => {
            return comment.id === id;
        });
        comment.status = status;
        await axios.post('http://event-bus:4005/events', {
            type: 'CommentUpdated',
            data: {
                id,
                status,
                postId,
                content
            }
        });
    }
    res.send({});
});

app.listen(4001, () =>{
    console.log('Listening on 4001');
})