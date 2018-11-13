var util = require('util');

module.exports = function (restClient) {
    var module = {};

    module.list = function (searchCriteria) {
        var query = 'searchCriteria=' + searchCriteria;
        var endpointUrl = util.format('/snowdog/cmsPage/search?%s', query);
        return restClient.get(endpointUrl);
    }

    return module;
}
