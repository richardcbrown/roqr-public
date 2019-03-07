var traverse = require('traverse');
var registry = require('../../utils/registry.js');
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

var indexed = [];

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
            documentId:resource.id,
            documentType:resource.resourceType,
            indices:[]
        };
        //Remove any FHIR extensions from the resource as these are not searchable and therefore no point in indexing them
        resource = traverse(resource).map(function(node) {
            if(this.key === 'extension') this.remove();
        });
        
        var db = this.db;
        
        var indexTypes = registry.resources[resource.resourceType];
        if(indexTypes !== undefined && indexTypes.length > 0) {
            
            var indices;
            var indexTypeHandler;
            var isIndexable = false;
    
            traverse(resource).map(function(node) {
                if(!Array.isArray(node)) {
                    this.path.forEach(function(path) {
                        indexTypes.forEach(function(indexType) {
                            ///If false then any other property after this one with the same name will not be indexed
                            //This is intended to prevent encounter.type and encounter.participant.type from both being indexed as encounter.type, for example...
                            var allowMultiple = (typeof indexType.allowMultiple === 'undefined' ? true : indexType.allowMultiple);
                            if(allowMultiple === false) {
                                //Check if this indexType.property hasn't already been indexed... if not, isIndexable === true
                                isIndexable = (indexType.property === path && indexed.indexOf(indexType.property) === -1);
                            } 
                            else {
                                isIndexable = (indexType.property === path);
                            }

                            if(isIndexable) {
                                indexTypeHandler = indexer.indexers[indexType.type];
                                indices = indexTypeHandler.call(
                                    indexer, 
                                    {
                                        resourceType: resource.resourceType,
                                        propertyName: path,
                                        global: indexType.global,
                                        indexFrom: node,
                                        indexPropertyName: indexType.indexedProperty || path
                                    }
                                );
                                
                                //If allowMultiple === false and we have got this far then add indexType.property to the indexed array to prevent any more properties of the same name from being indexed...
                                if(allowMultiple === false) {
                                    indexed.push(indexType.property);
                                }
                            }
                        });
                    });
                }
                //Create the indices...
                if(indices !== undefined && indices.length > 0)
                {
                    indices.forEach(function(index) {
                        if(index !== undefined && index.subscripts !== undefined && index.subscripts.length > 0)
                        {
                            var subscripts = index.subscripts;
                            subscripts.forEach(function (sub) {
                                traverse(sub).map(function (node) {
                                    if (typeof node!=='object' && node !== 'index' && node !== '') {
        
                                        var subs = [];
                                        subs.push(resource.resourceType.toLowerCase());
                                        this.path.forEach(function(term) {
                                            if (!isInt(term)) subs.push(term);
                                        });
                                        subs.push(node);
                                        subs.push(resource.id);
                                        
                                        var idx = db.use(index.global);
                                        idx.$(subs).value = resource.id;
            
                                        indexData.indices.push(
                                            {
                                                global:index.global,
                                                subscripts: subs,
                                                value: idx.$(subs).value
                                            }
                                        );
                                    }
                                });
                            });
                        }
                    });

                    indices = undefined;
                    indexTypeHandler = undefined;
                }
            });
        }
        
        finished(indexData);

    } catch(ex) {
        finished({
            error: ex.stack || ex.toString(),
            status:{code:500}
        });
    }
}