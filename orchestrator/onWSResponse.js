var responders = require('./responders.js').responders;

module.exports = function(req, res, next) {
    var msg = res.locals.message || {error: "Internal server error"};
    var code, status;
    if (msg.error) {
        code = 500;
        status = msg.status;
        if(status && status.code) code = status.code;
        if(msg.operationOutcome !== undefined)
        {
            msg = msg.operationOutcome;
        } 
        else 
        {
            delete msg.status;
            delete msg.restMessage;
            delete msg.ewd_application;
        }
        res.set('Content-Length', msg.length);
        res.status(code).send(msg);
    } else {
        if(msg.token) delete msg.token;
        //Send Response...
        console.log("WS Response: " + req.originalUrl);
        var responseHandlers = responders['index'];
        var responseHandler = responseHandlers[req.method.toLowerCase()];
        responseHandler(msg,res);
    }
    next();
  };