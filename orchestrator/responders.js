var responders = {
    fhir: 
    {
        get: function(msg, req, res)
            {
                res.set('Content-Length', msg.length);
                res.status(200)
                res.send(msg);
            },
        post: function(msg, req, res)
            {
                res.status(201);
                res.set('Content-Length', msg.length);
                res.set('Location','http://localhost:8080/fhir/STU3/'+msg.resourceType+'/'+msg.id)
                //Etag should be version
                res.send(msg);
            },
        put: function(msg, req, res)
            {
                res.status(204);
                res.send();
            },
        delete: function(msg, req, res)
            {
                res.status(202);//Non commital (lol)
                res.send();
            }
    },
    index:
    {
        get: function(msg, req, res)
            {
                res.set('Content-Length', msg.length);
                res.status(200)
                res.send(msg);
            },
        post: function(msg, req, res)
            {
                var status = req.originalUrl.endsWith('query') ? 200 : 201;
                res.status(status);
                res.set('Content-Length', msg.length);
                res.set('Location','http://localhost:8080/api/v1/services/index/'+ msg.documentType+'/'+ msg.documentId)
                res.send(msg);
            },
        delete: function(msg,  req, res)
            {
                res.status(202);//Non commital (lol)
                res.send();
            }
    }
}

module.exports = {
    responders
}