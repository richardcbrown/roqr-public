var moment = require('moment');
var uuid = require('uuid');

function isEmptyObject(obj) {
    for (var prop in obj) {
      return false;
    }
    return true;
  }
  
  function isInt(value) {
    return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
  }


module.exports = function(args, finished) {

    var resource = args.req.body || undefined;
    var checkId = args.checkId || undefined;

    try
    {
        if (typeof resource === 'undefined' || resource === '' || isEmptyObject(resource)) {
            var operationOutcome = {
              resourceType: 'OperationOutcome',
              id: uuid.v4(),
              issue: [
                {
                  code: 'processing',
                  severity: 'fatal',
                  diagnostics: 'Resource cannot be empty or undefined'
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
    
        if (typeof resource.resourceType === 'undefined' || resource.resourceType === '') {
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
      
        if (checkId && typeof resource.id !== 'undefined' && resource.id.length > 0) {
          var operationOutcome = {
            resourceType: 'OperationOutcome',
            id: uuid.v4(),
            issue: [
              {
                code: 'processing',
                severity: 'fatal',
                diagnostics: 'Resource ' + resource.resourceType + ' cannot have an \'id\' property'
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
      
        //Add an id property to the resource before persisting...
        if (typeof resource.id === 'undefined' || resource.id.length === 0) resource.id = uuid.v4();
        //Set meta/version id...
        if (resource.meta === undefined || (resource.meta !== undefined && resource.meta.versionId === undefined)) {
          resource.meta = resource.meta || {};
          resource.meta.versionId = '1';
          resource.meta.lastUpdated = moment().utc().format();
        }
        //Create source _tag
        

        var doc = this.db.use(resource.resourceType);
        doc.$(resource.id).setDocument(resource);

        finished(resource);
    } catch (ex) {
        finished({
            error: ex.stack || ex.toString(),
            status:{code:500}
        });
    }
}