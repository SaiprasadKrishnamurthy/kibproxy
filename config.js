var config = {};
config['atmtransactions'] = { query_string: { query: 'cardIssuerBank:ICICI', analyze_wildcard: true } };
config['abcd'] = { query_string: { query: 'cardIssuerBank:ICICI', analyze_wildcard: true } };
exports.config = config;