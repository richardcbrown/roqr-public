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
            if(global === '' || (global !== '' && indexType.global === global)) 
            {
                var indexedProperty = indexType.indexedProperty || indexType.property;
                var path = indexer.resolvers[indexType.global].call(
                            indexer, 
                            {
                                documentType: indexData.documentType,
                                documentId: indexData.documentId,
                                indexedProperty: indexedProperty
                            }
                        );

                var documents = db.use(indexType.global);
                path.paths.forEach(function(path) {
                    
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

                        if(indexData.indices.length > 0) {
                            return true;
                        }

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