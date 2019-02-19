var responders = {
    fhir: 
    {
        get: function(msg, res)
            {
                res.set('Content-Length', msg.length);
                res.status(200)
                res.send(msg);
            },
        post: function(msg, res)
            {
                res.status(201);
                res.set('Content-Length', msg.length);
                res.set('Location','http://localhost:8080/fhir/STU3/'+msg.resourceType+'/'+msg.id)
                //Etag should be version
                res.send(msg);
            },
        put: function(msg, res)
            {
                res.status(204);
                res.send();
            },
        delete: function(msg, res)
            {
                res.status(202);//Non commital (lol)
                res.send();
            }
    },
    index:
    {
        get: function(msg, res)
            {
                res.set('Content-Length', msg.length);
                res.status(200)
                res.send(msg);
            },
        post: function(msg, res)
            {
                res.status(201);
                res.set('Content-Length', msg.length);
                res.set('Location','http://localhost:8080/api/v1/services/index/'+ msg.data.type+'/'+ msg.data.id)
                res.send(msg);
            },
        delete: function(msg, res)
            {
                res.status(202);//Non commital (lol)
                res.send();
            }
    }
}

module.exports = {
    responders
}