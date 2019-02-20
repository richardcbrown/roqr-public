module.exports = function(args, finished) {
    
    var resourceType = args.resource || '';
    var resourceId = args.id || '';

    try
    {
        if (typeof resourceType === '') {
            var operationOutcome = {
              resourceType: 'OperationOutcome',
              id: uuid.v4(),
              issue: [
                {
                  code: 'processing',
                  severity: 'fatal',
                  diagnostics: 'ResourceType cannot be empty or undefined'
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
    
        if (typeof resourceId === '') {
          var operationOutcome = {
            resourceType: 'OperationOutcome',
            id: uuid.v4(),
            issue: [
              {
                code: 'processing',
                severity: 'fatal',
                diagnostics: 'ResourceId cannot be empty or undefined'
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
    
        var resource = this.db.use(resourceType, resourceId);
        if(!resource.exists) {
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
              var error = {
                error: 'Bad Request',
                status: { code: 404 }
              }
              finished({
                operationOutcome,
                error
              });
        } else {
            resource = resource.getDocument(true);
            finished(resource);
        }
    } catch(ex) {
        finished({
            error: ex.stack || ex.toString(),
            status:{code:500}
        });
    } 
}