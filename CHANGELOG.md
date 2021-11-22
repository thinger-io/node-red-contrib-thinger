# Changelog
All notable changes to this project will be documented in this file.

## [Unreleased]

## [1.2.0] - 2021-11-22
### Added
- New asset iterator node

### Changed
- Server events node now is able to subscribe to any event published by the API

### Fix
- Removed readme.md so npmjs will show content from README.md

## [1.1.0] - 2021-09-14
### Added
- New bucket create node
- New bucket read node
- New property read node
- New property write node
- New device create node
- New device callback node
- Dynamic selection for existing devices, groups, types, endpoints, resources, properties and buckets
- Filtering over the dynamic selection of resources

### Changed
- Endpoint call node now returns the output of the call
- Standardized node technincal documentation for help dialog
- Endpoint call has now output
- Device write has now output
- Ordered nodes in palette
- Added paletteLabel to nodes

### Security
- Migrated deprecated request dependency to internal http/https

## [1.0.2] - 2020-07-10
### Added
- New bucket and endpoint events for server events node

### Fix
- New bucket and endpoint events for server events node

## [1.0.1] - 2019-09-19
### Changed
- Device websocket url
- Read device to send the body of the response

### Fix
- Removed msg send by device write to console

## [0.0.8] - 2019-09-10
### Changed
- Thinger server node online documentation

## [0.0.7] - 2019-06-25
### Added
- New server events for server events node

### Changed
- Nodes online documentation

## [0.0.6] - 2019-06-20

[Unreleased]: https://github.com/thinger-io/Node-RED/compare/1.1.0...HEAD
[1.1.0]: https://github.com/thinger-io/Node-RED/compare/1.0.2...1.1.0
[1.0.2]: https://github.com/thinger-io/Node-RED/compare/1.0.1...1.0.2
[1.0.1]: https://github.com/thinger-io/Node-RED/compare/0.0.8...1.0.1
[0.0.8]: https://github.com/thinger-io/Node-RED/compare/0.0.7...0.0.8
[0.0.7]: https://github.com/thinger-io/Node-RED/compare/0.0.6...0.0.7
[0.0.6]: https://github.com/thinger-io/Node-RED/tag/0.0.6


