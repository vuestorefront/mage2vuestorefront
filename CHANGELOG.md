# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
## [1.11.12] - 2020-11-12
### Fixed
- Enable indexing of review ratings - @soyamore (#107)

## [1.11.1] - 2020.09.15
### Added
 - Updates magento2-rest-client dependecy from version 0.0.2 to 0.0.12 (#106) 
 - Bump lodash from 4.17.13 to 4.17.19 (#103)

## [1.11] - 2020.04.15
### Added
 - Elastic7 support - @pkarw (#96) 
 - Add product attributes_metadata - @andrzejewsky (#99)

## [1.10] - 2019.07.10
### Added
 - Added optional Redis Auth functionality. - @rain2o (#42)
 - MSI support - @dimasch (#86)
 
### Fixed
 - Import throwing an error when product's first category name was empty - @Loac-fr (#92)
 - Typos in documentation - @kkdg, @adityasharma7 (#90, #91)
 
## [1.9] - 2019.03.14
### Added
- New ENV variable `SEO_USE_URL_DISPATCHER` (default = true) added. When set, then the `product.url_path` and `category.url_path` are automatically populated for the UrlDispatche featu$

## [1.8.1] - 2019.02.13
### Changed / improved
 - `elasticsearch.apiVesion` with default = 5.6 added to the config

## [1.8.0] - 2019.02.08
### Added
- Video data mapper @rain2go [#75](https://github.com/DivanteLtd/mage2vuestorefront/pull/75)

## [1.8.0]
### Added
 - Setting `configurable_options.label` from the attribute meta descriptor. **Note:** When You modify any configurable attribute label in Magento You should reindex all products now
 - Configurable parent refresh sync - enabled in the `productsdelta` and `productsworker` modes and in `products --sku=<singleSku>`. This mode is refreshing the configurable parent product for the simple child which requires update. Its' required to start the `clis.js productsworker` (example call: `test_product_worker.sh`) for processing these parent updates,
 - Example calls added: `test_product_delta.sh` - for delta indexer, `test_product_worker.sh` for products worker, `test_fullreindex_multiprocess.sh` for multi process/parallel updates, `test_by_sky.sh` - for single SKU updates.

 ### Removed
 -  Mongodb support has been removed
 - old `package.json` and `yarn.lock` from `src` directory

## [1.7.1] - 2019-01-29
### Added
- This changelog file

### Fixed
- Slugify funtion properly parse regional characters changing them to latin
- yarn.lock file rebuild after some issues with merging

### Changed
- Slugify funtion moved outside adapter and exposed as helper
