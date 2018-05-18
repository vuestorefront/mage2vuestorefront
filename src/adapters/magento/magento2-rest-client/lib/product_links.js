var util = require('util');

module.exports = function (restClient) {
    var module = {};
    var typesCache = null;

    module.list = function (sku, type) {
        var endpointUrl = util.format('/products/%s/links/%s', encodeURIComponent(sku), type);
        return restClient.get(endpointUrl);
    }

    module.types = function () {
        var endpointUrl = util.format('/products/links/types');
        if (typesCache !== null) {
            return new Promise((resolve, reject) => {
                resolve (typesCache)
            })
        } else {
            return restClient.get(endpointUrl).then((result) => {
                typesCache = result
            })
        }
    }
    return module;
}
