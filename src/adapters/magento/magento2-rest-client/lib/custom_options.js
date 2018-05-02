var util = require('util');

module.exports = function (restClient) {
    var module = {};

    module.list = function (sku) {
        var endpointUrl = util.format('/products/%s/options', encodeURIComponent(sku));
        return restClient.get(endpointUrl);
    }


    return module;
}
