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
                index:'id'
            },
            {
                property:'lastUpdated',
                indexedProperty:'_lastUpdated',
                type:'datetime',
                index:'datetime'
            },
            {
                property:'tag',
                indexedProperty:'_tag',
                type:'token',
                index:'token'
            }, 
            {
                property:'status',
                type:'string',
                index:'string'
            },
            {
                property:'payload',
                type:'string',
                index:'string'
            },
            {
                property:'type',
                type:'string',
                index:'string'
            },
            {
                property:'endpoint',
                indexedProperty:'url',
                type:'uri',
                index:'uri'
            }
        ]
    },
    datetime: function(data) {
        console.log('Datetime: ' + JSON.stringify(data,null,2));

        var index = {};
        index.name = data.index;
        index.entries = [];
        
        var entry = {};
        entry[data.indexPropertyName] = moment(data.indexFrom).valueOf();
        index.entries.push(entry);
        
        return index;
    },
    name: function(data) {
        console.log('Name: ' + JSON.stringify(data,null,2));

        var index = {};
        index.name = data.index;
        index.entries = [];
        //Only do this if indexFrom is a name object...
        if(typeof data.indexFrom === 'object')
        {
            //Given is an array... for every given name, create an index entry
            data.indexFrom.given.forEach(function(givenName) {
                index.entries.push(
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
        console.log('Number: ' + JSON.stringify(data,null,2));

        var index = {};
        index.name = data.index;
        index.entries = [];
        
        var entry = {};
        entry[data.indexPropertyName] = data.indexFrom;
        index.entries.push(entry);

        return index;
    },
    reference: function(data) {
        console.log('Reference: ' + JSON.stringify(data,null,2));

        var index = {};
        index.name = data.index;
        index.entries = [];
        //Only do this if data.indexFrom is a reference object...
        if(typeof data.indexFrom === 'object')
        {
            var reference = data.indexFrom.reference;
            if(reference.startsWith('http')) {
                //URL
                var urlEntry = {}
                urlEntry[data.indexPropertyName] = reference;
                index.entries.push(urlEntry);
            }
            var referenceComponents = reference.split('/');
            //Type and logical Id length-2 + Logical Id = length-1;
            //Logical Id = length-1
            var typeAndLogicalId = referenceComponents[referenceComponents.length-2] + '/' + referenceComponents[referenceComponents.length-1];
            var typeAndLogicalIdEntry  = {};
            typeAndLogicalIdEntry[data.indexPropertyName] = typeAndLogicalId;
            index.entries.push(typeAndLogicalIdEntry);
        
            var logicalId = referenceComponents[referenceComponents.length-1];
            var logicalIdEntry = {};
            logicalIdEntry[data.indexPropertyName] = logicalId;
            index.entries.push(logicalIdEntry);
        }

        return index;
    },
    string: function(data) {
        console.log('String: ' + JSON.stringify(data,null,2));

        var index = {};
        index.name = data.index;
        index.entries = [];
        
        var entry = {};
        entry[data.indexPropertyName] = data.indexFrom;
        index.entries.push(entry);

        return index;
    },
    token: function(data) {
        console.log('Token: ' + JSON.stringify(data,null,2));

        var index = {};
        index.name = data.index;
        index.entries = [];

        if(typeof data.indexFrom === 'object')
        {
            var tokenTargetPropertyMap = 
            {
                identifier:'value',
                tag:'code'
            }

            //1 index, 3 values: system|code, system|, |code
            var tagSystem, tagCode, tagSystemAndCode
            tagSystem = data.indexFrom.system;
            tagCode = data.indexFrom[tokenTargetPropertyMap[data.propertyName]];
            tagSystemAndCode = tagSystem + '|' + tagCode;
            
            var entry = {};
            entry[data.indexPropertyName] = [
                {
                    'code': '|' + tagCode,
                },
                {
                    'system': tagSystem + '|',
                },
                {
                    'text': tagSystemAndCode
                }  
            ]
            index.entries.push(entry); 
        }

        return index;
    },
    uri: function(data) {
        console.log('URI: ' + JSON.stringify(data,null,2));

        var index = {};
        index.name = data.index;
        index.entries = [];
        
        var entry = {};
        entry[data.indexPropertyName] = data.indexFrom;
        index.entries.push(entry);

        return index;
    }
}

module.exports = {
    indexer
}