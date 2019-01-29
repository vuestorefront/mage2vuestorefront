# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Removed
- old `package.json` and `yarn.lock` from `src` directory

## [1.7.1] - 2019-01-29
### Added
- This changelog file

### Fixed
- Slugify funtion properly parse regional characters changing them to latin
- yarn.lock file rebuild after some issues with merging

### Changed
- Slugify funtion moved outside adapter and exposed as helper
