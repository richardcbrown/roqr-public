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

    //Validate global in each param
    //Validate documentType in each param
    //Validate node in each valid param (indexer registry - candidate for moving into own object?)

    try
    {
        var filtered;
        var results;
        var passNo = 0;
        var db = this.db;
        //For each parameter
        parameters.forEach(function(parameter) {
            passNo++;
            filtered = {};
            var global = parameter.global;
            //Instantiate the correct global...
            var documents = db.use(global);
            //Apply filters using filter handler for this 'type' of global...
             query.filters[global].call(query, documents, parameter).forEach(function(result) {
                filtered[result] = true;
             });
             
             if(passNo === 1) {
                 results = filtered;
             } else {
                 for(id in results) {
                     if(!filtered[id]) delete results[id];
                 }
             }
        });

        finished(results);

    } catch(ex) {
        finished({
            error: ex.stack || ex.toString(),
            status:{code:500}
        });
    }
}