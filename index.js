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


// 003hs get rid of problem
//  has been blocked by CORS policy: Response to preflight request doesn't pass access control check
// app.use(function (req, res, next) {
//     // Website you wish to allow to connect
//     res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    
//     // Request methods you wish to allow
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//     // Request headers you wish to allow
//     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
//     // Set to true if you need the website to include cookies in the requests sent
//     // to the API (e.g. in case you use sessions)
//     res.setHeader('Access-Control-Allow-Credentials', true);

//     // Pass to next layer of middleware
//     next();
// });

// route handler for get request
app.get('/posts/:id/comments', (req, res) =>{
    res.send(commentsByPostId[req.params.id] || []);
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

const message = process.env.MESSAGE || "Listening"
app.listen(4001, () =>{
    console.log(`${message} on 4001`);
})