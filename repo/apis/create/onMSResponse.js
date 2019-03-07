module.exports = function(message, jwt, forward, sendBack) {
    // onRequest logic here
    console.log("Create Response onMSResponse: " + JSON.stringify(message,null,2));
    var indexRequest = {
        path: "/api/v1/services/index",
        method: "POST",
        body: {breakchain:"false",data:message}
    }
    forward(indexRequest, jwt, function(responseObj) {
        //Ignore the response? Client doesn't need to know if this fails?
        console.log("Response from index: " + JSON.stringify(responseObj,null, 2));
    });
    return false; //Tell QEWD to return response from handler
};