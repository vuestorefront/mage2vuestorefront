var util = require('util');

module.exports = function (restClient) {
    var module = {};

    module.list = function (searchCriteria) {
        var query = 'searchCriteria=' + searchCriteria;
        var endpointUrl = util.format('/snowdog/cmsBlock/search?%s', query);
        return restClient.get(endpointUrl);
    }

    module.getById = function (blockId) {
        return restClient.get('/snowdog/cmsBlock/%d', blockId);
    }

    module.getByIdentifier = function (blockIdentifier, storeView) {
        return restClient.get('/snowdog/cmsBlockIdentifier/%d/storeId/%s', blockIdentifier, storeView);
    }

    return module;
}
