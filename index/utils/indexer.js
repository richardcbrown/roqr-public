var moment = require('moment');

var indexer = 
{
    registry: 
    {
        Subscription:
        [
            {
                property:'id',
                indexedProperty:'_id',
                type:'string',
                global:'id'
            },
            {
                property:'lastUpdated',
                indexedProperty:'_lastUpdated',
                type:'datetime',
                global:'datetime'
            },
            {
                property:'tag',
                indexedProperty:'_tag',
                type:'token',
                global:'token'
            }, 
            {
                property:'status',
                type:'string',
                global:'string'
            },
            {
                property:'payload',
                type:'string',
                global:'string'
            },
            {
                property:'type',
                type:'string',
                global:'string'
            },
            {
                property:'endpoint',
                indexedProperty:'url',
                type:'uri',
                global:'uri'
            }
        ],
        Patient:
        [
            {
                property:"id",
                indexedProperty:"_id",
                type:"string",
                global:"id"
            },
            {
                property:"lastUpdated",
                indexedProperty:"_lastUpdated",
                type:"datetime",
                global:"datetime"
            },
            {
                property:"city",
                indexedProperty:"address-city",
                type:"string",
                global:"string"
            },
            {
                property:"district",
                indexedProperty:"address-state",
                type:"string",
                global:"string"
            },
            {
                property:"postalCode",
                indexedProperty:"address-postalcode",
                type:"string",
                global:"string"
            },
            {
                property:"name",
                type:"name",
                global:"name"
            },        
            {
                property:"identifier",
                indexedProperty:"identifier",
                type:"token",
                global:"token"
            },
            {
                property:"tag",
                indexedProperty:"_tag",
                type:"token",
                global:"token"
            },
            {
                property:"gender",
                type:"string",
                global:"string"
            },
            {
                property:"birthDate",
                type:"datetime",
                global:"datetime"
            },
            {
                property:"managingOrganization",
                type:"reference",
                global:"reference"
            },
            {
                property:"generalPractitioner",
                type:"reference",
                global:"reference"
            }
        ]
    },
    indexers:
    {
        _baseIndexer: function(data) {
            var index = {};
            index.global = data.global;
            index.subscripts = [];
            
            var entry = {};
            entry[data.indexPropertyName] = data.indexFrom;
            index.subscripts.push(entry);
    
            return index;
        },
        datetime: function(data) {
            console.log('Datetime Indexer: ' + JSON.stringify(data,null,2));
            var index = this.indexers._baseIndexer(data);
            index.subscripts[0][data.indexPropertyName] =  moment(index.subscripts[0][data.indexPropertyName]).valueOf();
            return index;
        },
        name: function(data) {
            console.log('Name Indexer: ' + JSON.stringify(data,null,2));
    
            var index = {};
            index.global = data.global;
            index.subscripts = [];
            //Only do this if indexFrom is a name object...
            if(typeof data.indexFrom === 'object')
            {
                //Given is an array... for every given name, create an index entry
                data.indexFrom.given.forEach(function(givenName) {
                    index.subscripts.push(
                        {
                            'family': data.indexFrom.family
                        },        
                        {
                            'given': givenName
                        },
                        {
                            'name': givenName + ' ' + data.indexFrom.family
                        }
                    )
                });
            }
        
            return index;
        },
        number: function(data) {
            console.log('Number Indexer: ' + JSON.stringify(data,null,2));
            return this.indexers._baseIndexer(data);
        },
        reference: function(data) {
            console.log('Reference Indexer: ' + JSON.stringify(data,null,2));
    
            var index = {};
            index.global = data.global;
            index.subscripts = [];
            //Only do this if data.indexFrom is a reference object...
            if(typeof data.indexFrom === 'object')
            {
                var reference = data.indexFrom.reference;
                if(reference.startsWith('http')) {
                    //URL
                    var urlEntry = {}
                    urlEntry[data.indexPropertyName] = reference;
                    index.subscripts.push(urlEntry);
                }
                var referenceComponents = reference.split('/');
                //Type and logical Id length-2 + Logical Id = length-1;
                //Logical Id = length-1
                var typeAndLogicalId = referenceComponents[referenceComponents.length-2] + '/' + referenceComponents[referenceComponents.length-1];
                var typeAndLogicalIdEntry  = {};
                typeAndLogicalIdEntry[data.indexPropertyName] = typeAndLogicalId;
                index.subscripts.push(typeAndLogicalIdEntry);
            
                var logicalId = referenceComponents[referenceComponents.length-1];
                var logicalIdEntry = {};
                logicalIdEntry[data.indexPropertyName] = logicalId;
                index.subscripts.push(logicalIdEntry);
            }
    
            return index;
        },
        string: function(data) {
            console.log('String Indexer: ' + JSON.stringify(data,null,2));
            return this.indexers._baseIndexer(data);
        },
        token: function(data) {
            console.log('Token Indexer: ' + JSON.stringify(data,null,2));
    
            var index = {};
            index.global = data.global;
            index.subscripts = [];
    
            if(typeof data.indexFrom === 'object')
            {
                //1 index, 3 values: system|code, system|, |code
                var tagSystem, tagCode, tagSystemAndCode
                tagSystem = data.indexFrom.system;
                tagCode = data.indexFrom[this._tokenTargetPropertyMap[data.propertyName]];
                tagSystemAndCode = tagSystem + '|' + tagCode;
                
                var tokenValue = {};
                var tokenValuePropertyName = this._tokenTargetPropertyMap[data.propertyName];
                tokenValue[tokenValuePropertyName] = '|' + tagCode;
                var systemValue = {'system': tagSystem + '|'};
                var textValue = {'text': tagSystemAndCode};

                var entry = {};
                entry[data.indexPropertyName] = [
                    tokenValue,
                    systemValue,
                    textValue
                ]

                index.subscripts.push(entry); 
            }
    
            return index;
        },
        uri: function(data) {
            console.log('URI Indexer: ' + JSON.stringify(data,null,2));
            return this.indexers._baseIndexer(data);
        }
    },
    resolvers:{
        _baseResolver: function(data) {
            console.log('Base Resolver: ' + JSON.stringify(data,null,2));
            var path = {};
            var baseResolverPath = data.documentType.toLowerCase() + ',' + data.indexedProperty;
            path.paths = [baseResolverPath];
            return path;
        },
        id: function(data) {
            console.log('ID Resolver: ' + JSON.stringify(data,null,2));
            return this.resolvers._baseResolver(data);    
        },
        datetime: function(data) {
            console.log('Datetime Resolver: ' + JSON.stringify(data,null,2));
            return this.resolvers._baseResolver(data);
        },
        name: function(data) {
            console.log('Name Resolver: ' + JSON.stringify(data,null,2));
            //Paths must be Given, Family and Name (baseResolver will return name)...
            var path = this.resolvers._baseResolver(data);
            //Add paths for Given and Family...
            path.paths.push(data.documentType.toLowerCase() + ',given');
            path.paths.push(data.documentType.toLowerCase() + ',family');
            //return path;
            return path;
        },
        number: function(data) {
            console.log('Number Resolver: ' + JSON.stringify(data,null,2));
            return this.resolvers._baseResolver(data);
        },
        reference: function(data) {
            console.log('Reference Resolver: ' + JSON.stringify(data,null,2));
            return this.resolvers._baseResolver(data);
        },
        string: function(data) {
            console.log('String Resolver: ' + JSON.stringify(data,null,2));
            return this.resolvers._baseResolver(data);
        },
        token: function(data) {
            console.log('Token Resolver: ' + JSON.stringify(data,null,2));
            //Code/Value, System, Text
            var path = {}
            var basePath = data.documentType.toLowerCase() + ',' + data.indexedProperty;
            //First path is either code or value depending on indexedProperty...
            var tokenValue = this._tokenTargetPropertyMap[data.indexedProperty];
            var tokenValuePath = basePath + ',' + tokenValue;
            //Second Path is system...
            var systemPath = basePath + ',system';
            //Final path is text...
            var textPath = basePath + ',text';
            //Replace the path.paths array with a new, correct one
            path.paths = [];
            path.paths.push(tokenValuePath);
            path.paths.push(systemPath);
            path.paths.push(textPath);
            //return path;
            return path;
        },
        uri: function(data) {
            console.log('URI Resolver: ' + JSON.stringify(data,null,2));
            return this.resolvers._baseResolver(data);
        }
    },
    _tokenTargetPropertyMap: 
    {
        identifier:'value',
        tag:'code',
        _tag:'code'
    }
}

module.exports = {
    indexer
}