var query = require('../../utils/query.js').query;

module.exports = function(args, finished) {
   
    var parameters;

    if(args.req.body === undefined || args.req.body.parameters === undefined) {
        finished(
            {
                error: 'Bad Request: Request body cannot be undefined.',
                status:{code:400}
            }
        );
    }

    parameters = args.req.body.parameters;
    if(parameters.length === 0) {
        finished(
            {
                error: 'Bad Request: Query must contain one or more parameters.',
                status:{code:400}
            }
        );
    }

    try
    {
        var results = [];

        var filtered;
        var matches;
        var passNo = 0;

        var db = this.db;
        //For each parameter - create the filtered result set
        parameters.forEach(function(parameter) {
            passNo++;
            matches = {};
            var global = parameter.global;
            //Instantiate the correct global...
            var documents = db.use(global);
            //Apply filters using filter handler for this 'type' of global...
             query.filters[global].call(query, documents, parameter).forEach(function(match) {
                matches[match] = true;
             });
             
             if(passNo === 1) {
                filtered = matches;
             } else {
                 for(result in filtered) {
                     if(!matches[result]) delete filtered[result];
                 }
             }
        });

        for(result in filtered) {
            results.push(result);
        }

        finished(results);

    } catch(ex) {
        finished({
            error: ex.stack || ex.toString(),
            status:{code:500}
        });
    }
}