# Changelog
All notable changes to this project will be documented in this file.

## [Unreleased]

## [1.4.0] - 2022-04-15
### Added
- New read storage node
- Errors from backend now show more detail in the cause of the error
- Compatibility with Node-RED 3.0.0
- Simple example flows
- New Thinger Product asset interaction with events, property read and write and assignment a product to a device and bucket
- Added configuration of maximum concurrent sockets against a server connection
- Added enabled property in device create node
- Added rate limit in asset iterator node to indicate the number of seconds between each message

### Changed
- Improved user interaction in frontend
- Bucket create node is able to update existing bucket
- Updated icons of each node and set new Thinger.io color palette

### Fix
- Device write handling plain text as well as JSON
- Having two or more thinger backends configured was not working properly
- Bad Request from backend in bucket write node was returning more than one error message
- Property write and read nodes were not filtering options
- Device stream was returning undefined in payload
- Device resources only shown after focusing on device field
- Field filters were not filtering by name and only by id
- Write property failed when passing JSON object as value from the input message

## [1.3.2] - 2022-03-14
### Added
- Example of regex in server events node

### Changed
- When resource is not found a not found message is returned instead of an error

### Fix
- Requests where the payload contained special characters could not be handled
- Device write node does not overwrite message payload if nothing is returned
- Input/output resources are not available on device read and write

## [1.3.1] - 2022-01-29
### Fix
- Assign same Keep-Alive agent to all requests
- Handle errors for each node when backend request fails

## [1.3.0] - 2021-12-22
### Added
- Device create node is able to update details of an already existing device
- Asset iterator node shows status of operation
- Use of Keep-Alive header in http request to improve network performance

### Changed
- In bucket read node, aggregation is always shown, event when no bucket is configured
- Function nodes maintain input messages, overwriting only its defined output property

### Fix
- Updated bucket create documentation with correct values
- Added seconds for time interval in bucket create

## [1.2.3] - 2021-11-24
### Fix
- Correctly handling of legacy server events when more than one asset filter is set

## [1.2.2] - 2021-11-23
### Fix
- Fixed UnhandledPromiseRejectionWarning when request to Thinger server failed
- Restored properties for server events node up to version 1.1.0, that caused configuration to dissapear

## [1.2.1] - 2021-11-22
### Fix
- Asset iterator node failed when asset count was over 65K
- Asset iterator node failing to retrieve admin role assets
- Server events node subscription failed on some cases
- Asset iterator node failed when saving with asset type or asset group and then switching to a different asset

### Changed
- Server events node now is able to subscribe to any event published by the API

### Fix
- Removed readme.md so npmjs will show content from README.md

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

[Unreleased]: https://github.com/thinger-io/Node-RED/compare/1.4.0...HEAD
[1.4.0]: https://github.com/thinger-io/Node-RED/compare/1.3.2...1.4.0
[1.3.2]: https://github.com/thinger-io/Node-RED/compare/1.3.1...1.3.2
[1.3.1]: https://github.com/thinger-io/Node-RED/compare/1.3.0...1.3.1
[1.3.0]: https://github.com/thinger-io/Node-RED/compare/1.2.3...1.3.0
[1.2.3]: https://github.com/thinger-io/Node-RED/compare/1.2.2...1.2.3
[1.2.2]: https://github.com/thinger-io/Node-RED/compare/1.2.1...1.2.2
[1.2.1]: https://github.com/thinger-io/Node-RED/compare/1.2.0...1.2.1
[1.2.0]: https://github.com/thinger-io/Node-RED/compare/1.1.0...1.2.0
[1.1.0]: https://github.com/thinger-io/Node-RED/compare/1.0.2...1.1.0
[1.0.2]: https://github.com/thinger-io/Node-RED/compare/1.0.1...1.0.2
[1.0.1]: https://github.com/thinger-io/Node-RED/compare/0.0.8...1.0.1
[0.0.8]: https://github.com/thinger-io/Node-RED/compare/0.0.7...0.0.8
[0.0.7]: https://github.com/thinger-io/Node-RED/compare/0.0.6...0.0.7
[0.0.6]: https://github.com/thinger-io/Node-RED/tag/0.0.6


