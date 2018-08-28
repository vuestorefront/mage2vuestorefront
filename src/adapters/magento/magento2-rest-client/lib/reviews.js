const util = require('util');

module.exports = function (restClient) {
    var module = {};

    module.getByProductSku = function (sku) {
        const endpointUrl = util.format('/products/%s/review', encodeURIComponent(sku));
        return restClient.get(endpointUrl);
    };

    module.list = function(searchCriteria) {
        const query = 'searchCriteria=' + searchCriteria;
        const endpointUrl = util.format('/reviews/?%s', query);
        return restClient.get(endpointUrl);
    };

    module.create = function (reviewData) {
        return restClient.post('/reviews', {review: reviewData})
    }

    module.delete = function (reviewId) {
        var endpointUrl = util.format('/reviews/%d', reviewId);
        return restClient.delete(endpointUrl);
    }

    return module;
};
