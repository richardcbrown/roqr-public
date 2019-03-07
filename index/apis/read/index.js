var indexer = require('../../utils/indexer.js').indexer;

module.exports = function(args, finished) {

    var docId = args.documentId || '';
    var documentType = args.documentType || '';
    var global = args.global || '';

    var indexData = {
        documentId:docId,
        documentType:documentType,
        indices:[]
    };

    try
    {
        var indexTypes = indexer.registry[indexData.documentType];

        var db = this.db;
        indexTypes.forEach(function(indexType) {
            
            var globals = [];
            if(Array.isArray(indexType.global)) {
                indexType.global.forEach(function(gl) {
                    if(global !== '') {
                        if(global === gl) globals.push(gl);
                    } else {
                        globals.push(gl);
                    }
                });
            } else {
                globals.push(indexType.global);
            }

            if(global === '' || (global !== '' && globals.indexOf(global) > -1)) 
            {
                globals.forEach(function(global) 
                {
                    var indexedProperties = [];
                    if(Array.isArray(indexType.indexedProperty))
                    {
                        //Needs filtering - the property that is pushed to the array should match the global 
                        indexType.indexedProperty.forEach(function(indexedProperty) {
                            if(indexType.indexPropertyGlobals[indexedProperty] === global)
                            {
                                indexedProperties.push(indexedProperty);
                            }
                        });
                    } else {
                        var indexedProperty = indexType.indexedProperty || indexType.property;
                        indexedProperties.push(indexedProperty);
                    }
                    
                    var path;
                    indexedProperties.forEach(function(indexedProperty) {
                        path = indexer.resolvers[global].call(
                            indexer, 
                            {
                                documentType: indexData.documentType,
                                documentId: indexData.documentId,
                                indexedProperty: indexedProperty
                            }
                        );
                    });

                    var documents = db.use(global);
                    path.paths.forEach(function(path) {
                        console.log("Path: " + path);
                        var pathArray = path.split(',');
                        documents.$(pathArray).forEachChild(function(value, node) {
                            
                            var global =  node._node.global;
                            var subscripts = node._node.subscripts;

                            node.forEachChild(function(id) {
                                if(id===indexData.documentId)
                                {
                                    subscripts.push(id);
                                    indexData.indices.push(
                                        {
                                            global: global,
                                            subscripts: subscripts,
                                            value: documents.$(subscripts).value
                                        }
                                    )
                                    return true;
                                }
                            });
                        });
                    }); 
                });
            }
        });

        finished(indexData);

    } catch(ex) {
        finished({
            error: ex.stack || ex.toString(),
            status:{code:500}
        });
    }
}