var http = require('http'),
httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer({});

var server = http.createServer(function(req, res) {
  req.params=params(req); // call the function above ;
  console.log("\n\n\n");
  // console.log("Request: "+JSON.stringify(req.headers));
  // console.log("Request Params: "+JSON.stringify(req.params));
  // console.log("Request Method: "+req.method);

    var fullBody = '';
    var indexName = '';
    req.on('data', function(chunk) {
      // append the current chunk of data to the fullBody variable
      fullBody += chunk.toString();
      	try {
      		JSON.parse(fullBody);
      	}catch(err) {
      		indexName = getIndexName(fullBody);
      		var esQuery = getEsQueryPayload(fullBody);
      		esQuery.query.filtered.query = { query_string: { query: 'cardIssuerBank:HDFC', analyze_wildcard: true } }
      		var bodyParts = fullBody.split("\n");
      		var modifiedPayload = JSON.stringify(bodyParts[0]) + "\n" + JSON.stringify(esQuery);
      		console.log(modifiedPayload);
      		req.write(modifiedPayload);
      	}
    });
  res.setHeader('Set-Cookie', "X-Analytics-Token=SAI", {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7 // 1 week 
    });
  proxy.web(req, res, { target: 'http://127.0.0.1:5601' });
});

console.log("proxy listening on port 8000")
server.listen(8000);

var getIndexName = function(fullBody) {
	var esQueries = fullBody.split("\n");
    var indexDetails = JSON.parse(esQueries[0]);
    return Array.isArray(indexDetails.index) && indexDetails.index ?indexDetails.index[0]:indexDetails.index;
}

var getEsQueryPayload = function(fullBody) {
	var esQueries = fullBody.split("\n");
    return JSON.parse(esQueries[1]);
}

var params = function(req){
  var q=req.url.split('?'),result={};
  if(q.length>=2){
      q[1].split('&').forEach((item)=>{
           try {
             result[item.split('=')[0]]=item.split('=')[1];
           } catch (e) {
             result[item.split('=')[0]]='';
           }
      })
  }
  return result;
}


