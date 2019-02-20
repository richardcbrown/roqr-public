var responders = require('./responders.js').responders;

function whichApplication(url) {
    var respondFrom = '';
    if(url.includes('fhir'))
    {
        respondFrom = 'fhir';
    } 
    else if(url.includes('index')) 
    {
        respondFrom = 'index';
    }
    return respondFrom;
}

module.exports = function(req, res, next) {
    var msg = res.locals.message || {error: 'Internal server error'};
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
            delete msg.path;
        }
        res.set('Content-Length', msg.length);
        res.status(code).send(msg);
    } else {
        if(msg.token) delete msg.token;
        //Send Response...
        var respondFrom = whichApplication(req.originalUrl);
        var responseHandlers = responders[respondFrom];
        var responseHandler = responseHandlers[req.method.toLowerCase()];
        responseHandler(msg,res);
    }
    next();
  };