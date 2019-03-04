# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
