var uuid = require('uuid');

module.exports = function(args, finished) {
    
//OperationOutcome if no body
//OperationOutcome if bundle.type !== batch
var batch = args.body || "";

try
{
    if (typeof batch === '') {
        var operationOutcome = {
          resourceType: 'OperationOutcome',
          id: uuid.v4(),
          issue: [
            {
              code: 'processing',
              severity: 'fatal',
              diagnostics: 'Bundle cannot be empty or undefined'
            }
          ]
        };
        var error = {
          error: 'Bad Request',
          status: { code: 400 }
        }
        finished({
          operationOutcome,
          error
        });
      }
    
    if (typeof batch.type !== 'batch') {
      var operationOutcome = {
        resourceType: 'OperationOutcome',
        id: uuid.v4(),
        issue: [
          {
            code: 'processing',
            severity: 'fatal',
            diagnostics: 'Only Batch requests are supported by this server.'//Find a better HTTP status code
          }
        ]
      };
      var error = {
        error: 'Bad Request',
        status: { code: 400 }
      }
      finished({
        operationOutcome,
        error
      });
    }

    var db = this.db;
    var bundle = {};
    bundle.resourceType = "Bundle"
    bundle.id = uuid.v4();
    bundle.type ="batch-response";
    bundle.entry = [];

    batch.entry.forEach(function(entry) {
        var url = entry.request.url;
        //Can only support READS at the moment...
        if(url.includes("?")) 
        {
            var operationOutcome = {
                resourceType: 'OperationOutcome',
                id: uuid.v4(),
                issue: [
                  {
                    code: 'processing',
                    severity: 'fatal',
                    diagnostics: 'Resource searching is currently not supported when making batch requests.'
                  }
                ]
              };
              var error = {
                error: 'Bad Request',//Find a better HTTP status code
                status: { code: 400 }
              }
              finished({
                operationOutcome,
                error
              });
        }
        //Split url on "/" so that resourceType and resourceId can be extracted...
        var urlAsArray = url.split("/");
        var resourceType = urlAsArray[0];
        var resourceId = urlAsArray[1];
        //Fetch the resource from global document storage...
        var resource = db.use(resourceType, resourceId);
        if(!resource.exists) {
            //Add an operation outcome of 404 not found...
            var operationOutcome = {
                resourceType: 'OperationOutcome',
                id: uuid.v4(),
                issue: [
                  {
                    code: 'processing',
                    severity: 'fatal',
                    diagnostics: 'Resource ' + resourceType + ' ' + resourceId + ' does not exist'
                  }
                ]
              };
            bundle.entry.push(operationOutcome);
        } else {
            //Add resource to bundle.entry after pulling it from source...
            resource = resource.getDocument(true);
            bundle.entry.push(resource);
        }
    });
    //Return bundle...
   finished(bundle);
} 
catch(ex) 
{
    finished({
        error: ex.stack || ex.toString(),
        status:{code:500}
    });
} 
};