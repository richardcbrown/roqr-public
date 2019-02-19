var traverse = require('traverse');
var indexer = require('../../utils/indexer.js').indexer;

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

    if(args.req.body === undefined || args.req.body.data === undefined) {
        finished(
            {
                error: 'Bad Request: Request body cannot be undefined.',
                status:{code:400}
            }
        );
    }

    if(isEmptyObject(args.req.body.data)){
        //Bad request        
        finished(
            {
                error: 'Bad Request: data cannot be an empty object',
                status:{code:400}
            }
        );
    }

    if(args.req.body.data.resourceType === undefined || args.req.body.data.resourceType === '')
    {
        //bad request - not a FHIR resource
        finished({
            error: 'Bad Request: Request data does not appear to be a valid FHIR resource (missing resourceType)',
            status:{code:400}
        });
    }

    try
    {
        var breakchain = args.req.body.breakchain || false;
        var resource = args.req.body.data;
    
        var indexData = {
            id:resource.id,
            type:resource.resourceType,
            indices:[]
        };
        //Remove any FHIR extensions from the resource as these are not searchable and therefore no point in indexing them
        resource = traverse(resource).map(function(node) {
            if(this.key === 'extension') this.remove();
        });
        
        var db = this.db;
        
        var indexTypes = indexer.registry[resource.resourceType];
        if(indexTypes !== undefined && indexTypes.length > 0) {
            
            var index;
            var indexTypeHandler;
            var isIndexable = false;
    
            traverse(resource).map(function(node) {
                if(!Array.isArray(node)) {
                    this.path.forEach(function(path) {
                        indexTypes.forEach(function(indexType) {
                            isIndexable = (indexType.property === path);
                            if(isIndexable) {
                                indexTypeHandler = indexer[indexType.type];
                                index = indexTypeHandler({
                                    resourceType: resource.resourceType,
                                    propertyName: path,
                                    index: indexType.index,
                                    indexFrom: node,
                                    indexPropertyName: indexType.indexedProperty || path
                                });
                            }
                        });
                    });
                }
                //Create the indicies...
                if(index !== undefined && index.entries !== undefined && index.entries.length > 0)
                {
                    var entries = index.entries;
                    entries.forEach(function (entry) {
                        traverse(entry).map(function (node) {
                            if (typeof node!=='object' && node !== 'index' && node !== '') {
                                var values = [];
                                values.push(resource.resourceType.toLowerCase());
                                this.path.forEach(function(term) {
                                    if (!isInt(term)) values.push(term);
                                });
                                values.push(node);
                                values.push(resource.id);
    
                                var idx = db.use(index.name);
                                idx.$(values).value = resource.id;
    
                                indexData.indices.push(
                                    {
                                        index:index.name,
                                        values: values
                                    }
                                );
                            }
                        });
                    });
                    index = undefined;
                    indexTypeHandler = undefined;
                }
            });
        }
    
        finished({
            breakchain:breakchain,
            data:indexData
        });

    } catch(ex) {
        finished({
            error: ex.stack || ex.toString(),
            status:{code:500}
        });
    }
}