var util = require('util');

module.exports = function (restClient) {
    var module = {};

    module.list = function (sku) {
        var endpointUrl = util.format('/bundle-products/%s/options/all', encodeURIComponent(sku));
        return restClient.get(endpointUrl);
    }


    return module;
}
