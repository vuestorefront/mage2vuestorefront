var util = require('util');

module.exports = function (restClient) {
    var module = {};

    module.list = function (sku) {
        var endpointUrl = util.format('/stockItems/%s', encodeURIComponent(sku));
        return restClient.get(endpointUrl);
    }

    // MSI
    module.getSalableQty = function (sku, stockId) {
        var endpointUrl = util.format(
            '/inventory/get-product-salable-quantity/%s/%d',
            encodeURIComponent(sku),
            encodeURIComponent(stockId)
        );
        return restClient.get(endpointUrl);
    }

    // MSI
    module.isSalable = function (sku, stockId) {
        var endpointUrl = util.format(
            '/inventory/is-product-salable/%s/%d',
            encodeURIComponent(sku),
            encodeURIComponent(stockId)
        );
        return restClient.get(endpointUrl);
    }

    return module;
}
