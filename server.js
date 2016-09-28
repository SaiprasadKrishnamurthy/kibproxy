var proxy = require('express-http-proxy');
var app = require('express')();
var cookieParser = require('cookie-parser');
//var config = require('./config').config;
app.use(cookieParser());
app.use('/', proxy('http://localhost:5601', {
  intercept: function(rsp, data, req, res, callback) {
    var esQuery = req.headers['X-ES-Query'];
    res.cookie('X-ES-Query', esQuery, {
            expires: new Date(Date.now() + 9999999),
            httpOnly: true
    });
    // console.log("Request cookies: "+req.cookies['X-ES-Query']);
    callback(null, data);
  },
  decorateRequest: function(proxyReq, originalReq) {
    var fullBody = proxyReq.bodyContent;
    var indexName = '';
    var params = originalReq.query;
    var config = '';
    if(params['_key_'] != undefined) {
    	config = new Buffer(params['_key_'], 'base64').toString("ascii");
    	originalReq.headers['X-ES-Query'] = config;
    } else {
    	originalReq.headers['X-ES-Query'] = originalReq.cookies['X-ES-Query'];
    	config = originalReq.cookies['X-ES-Query'];
    }
    if(proxyReq.method == 'POST') {
     var stop = false;	
     try {
      		JSON.parse(fullBody);
        }catch(err) {
        	var esQueries = fullBody.split("\n");
        	var modifiedPayload = '';
        	try {
        		config = JSON.parse(config);
        	} catch(err1) {
        		proxyReq.bodyContent = "Error!";
        		stop = true;
        	}
        	if(!stop) {
        	for(var i=0; i<esQueries.length; i++) {
	      	  if(esQueries[i].length > 0) {
	      		if(i % 2 == 0) {
	      			indexName = getIndexName(esQueries, i);
	      		} else {
	      			var esQuery = getEsQueryPayload(esQueries, i);
	      			esQuery.query.filtered.query = config[indexName];
	      			modifiedPayload = modifiedPayload + esQueries[i-1] + "\n" + JSON.stringify(esQuery) + "\n";
	      		}
	      	  }
	      	}
      		if(modifiedPayload.length > 0) {
      			proxyReq.bodyContent = modifiedPayload;
      		}
      	}
        }
    }
    return proxyReq;
  }
}));

var getIndexName = function(esQueries, i) {
	var indexDetails = JSON.parse(esQueries[i]);
    return Array.isArray(indexDetails.index) && indexDetails.index ?indexDetails.index[0]:indexDetails.index;
}

var getEsQueryPayload = function(esQueries, i) {
	return JSON.parse(esQueries[i]);
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
app.listen(8000, function () {
  console.log('Example app listening on port 3000!');
});