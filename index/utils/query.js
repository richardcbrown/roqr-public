var moment = require('moment');

var query = 
{
    selectors:
    {
        _baseSelector: function(parameter) {
            console.log('Base Selector: ' + JSON.stringify(parameter,null,2));
            var selector = {};
            var baseSelector = parameter.documentType + ',' + parameter.node
            selector.paths = [baseSelector];
            return selector;
        },
        string:function(parameter) {
            console.log('String Selector: ' + JSON.stringify(parameter,null,2));
            return this.selectors._baseSelector(parameter);
        }
    },
    filters:
    {
        string: function(documents, parameter) {
            console.log('String Filter: ' + JSON.stringify(parameter,null,2));
            var results = [];
            //Get the initial 'select(or)' path...
            var selector = this.selectors['string'].call(this,parameter)
                .paths[0]
                .split(',');
            //Fetch the initial result set...
            documents.$(selector).forEachChild(function(value,node) {
                //Any modifiers?
                var match = false;
                var modifier = parameter.modififer || ''
                if(modifier !== '') {
                    match = this.modifiers[modifier].call(this,value,parameter.value);
                } else {
                    //= means starts with http://hl7.org/fhir/stu3/search.html#string
                    match = value.toLowerCase().startsWith(parameter.value.toLowerCase());
                }
                if(match === true) {
                    node.forEachChild(function(id) {
                        results.push(id);
                    });
                }
            });
            return results;
        },
        name: function(documents, parameter) {
            console.log('Name Filter: ' + JSON.stringify(parameter,null,2));
            return this.filters['string'].call(this, documents,parameter);
        }
    },
    modifiers:
    {
        contains:function(value,expression) {
            return value.toLowerCase().includes(expression.toLowerCase());
        },
        exact:function(value,expression) {
            return value === expression;
        }
    }
}

module.exports = {
    query
};