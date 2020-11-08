# dhbw-exercise1-comments
Small node.js microservices sample app to create posts and comments to the posts -here the comments microservice implemented in Node.js

The file index-comments-service-hs007.js is a saved version - to use it, rename it to index.js. This version required to have the other microservices also up and running (posts, comments, query, moderation and event-bus) All data is kept in memory

The hs007 version is build for a docker environment build using docker-compose. A docker network is required - I used the name hsdocker as docker bridge network Each microservice is using a unique networkname and portid --it is related to the docker image name (you can also check it using docker network inspect hsdocker)
