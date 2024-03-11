# Changelog

All notable changes to this project will be documented in this file.

## [1.7.0] - 2024-03-11

### Added

- New configuration for setting the timeout for Thinger.io requests
- Allow msg placeholders in thinger nodes input forms
- Iteration over assets associated to a Product

### Fixed

- Property write node has default value of {}
- Don't send empty value in property write node
 
## [1.6.3] - 2024-01-03

### Fixed

- Could not send JSON value through msg.payload in propery write node

## [1.6.2] - 2023-12-27

### Fixed

- Return of non existent field in asset iterator node
- Storage-write node not returning recursive details of files
- Can't write value 0 to property when using msg.payload
- Asset list duplicated in server events node

## [1.6.1] - 2023-11-30

### Fixed

- Asset iterator node ignoring asset id

## [1.6.0] - 2023-11-29

### Added

- New timezone field in bucket read node to query the backend
- New Project filter in asset iterator node

### Fixed

- Bucket read node does not save time period setting when months is selected
- Aggregation by month not implemented in bucket read node
- Improved queries of devices and buckets with type or group filters in asset iterator node

## [1.5.1] - 2023-11-24

### Fixed

- Crash when reading a file with json extension which is not a valid JSON from storage read node
- Storage read node returning multiple files when file configured matches beginning of files in file storage

## [1.5.0] - 2023-11-15

### Added

- Filter by tags available in bucket read node
- Add data tags in bucket create node
- Add project to device create and bucket create nodes
- spread, mode and stddev available in bucket-read form

### Changed

- Limited file download/upload to 256MB

### Fixed

- Hidden device resources should not be shown
- Asset iterator not able to query for alarms and proxies
- Storage write was appending new line even when unchecked

## [1.4.3] - 2023-02-09

### Fixed

- Device callback node failed linking autoprovisioned device and bucket if prefix is present
- Missing assignment of product on device and bucket autoprovion in device callback node

## [1.4.2] - 2023-01-26

### Changed

- Device callback node calls the callback and autoprovisions the device if it fails, instead of checking if it exists before calling callback

### Fixed

- Device callback node failed after autoprovisioning resources
- Missing icons for assets 'role' and 'proxy'

## [1.4.1] - 2022-09-05

### Fixed

- Bucket Read node returns empty playload
- Device Write node does not show all inputs

## [1.4.0] - 2022-07-27

### Added

- New read storage node
- New write storage node
- Errors from backend now show more detail in the cause of the error
- Compatibility with Node-RED 3.0
- Simple example flows
- New Thinger Product asset interaction with events, property read and write and assignment a product to a device and bucket
- Added configuration of maximum concurrent sockets against a server connection
- Added enabled property in device create node
- Added rate limit in asset iterator node to indicate the number of seconds or milliseconds between each message
- Improved error handling in nodes so errors can be caught with the 'catch' node

### Changed

- Improved user interaction in frontend
- Bucket create node is able to update existing bucket
- Updated icons of each node and set new Thinger.io color palette

### Fixed

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

### Fixed

- Requests where the payload contained special characters could not be handled
- Device write node does not overwrite message payload if nothing is returned
- Input/output resources are not available on device read and write

## [1.3.1] - 2022-01-29

### Fixed

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

### Fixed

- Updated bucket create documentation with correct values
- Added seconds for time interval in bucket create

## [1.2.3] - 2021-11-24

### Fixed

- Correctly handling of legacy server events when more than one asset filter is set

## [1.2.2] - 2021-11-23

### Fixed

- Fixed UnhandledPromiseRejectionWarning when request to Thinger server failed
- Restored properties for server events node up to version 1.1.0, that caused configuration to dissapear

## [1.2.1] - 2021-11-22

### Fixed

- Asset iterator node failed when asset count was over 65K
- Asset iterator node failing to retrieve admin role assets
- Server events node subscription failed on some cases
- Asset iterator node failed when saving with asset type or asset group and then switching to a different asset
- Removed readme.md so npmjs will show content from README.md

### Changed

- Server events node now is able to subscribe to any event published by the API

## [1.2.0] - 2021-11-22

### Added

- New asset iterator node

### Changed

- Server events node now is able to subscribe to any event published by the API

### Fixed

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

### Fixed

- New bucket and endpoint events for server events node

## [1.0.1] - 2019-09-19

### Changed

- Device websocket url
- Read device to send the body of the response

### Fixed

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

[1.7.0]: https://github.com/thinger-io/Node-RED/compare/1.6.3...1.7.0
[1.6.3]: https://github.com/thinger-io/Node-RED/compare/1.6.2...1.6.3
[1.6.2]: https://github.com/thinger-io/Node-RED/compare/1.6.1...1.6.2
[1.6.1]: https://github.com/thinger-io/Node-RED/compare/1.6.0...1.6.1
[1.6.0]: https://github.com/thinger-io/Node-RED/compare/1.5.1...1.6.0
[1.5.1]: https://github.com/thinger-io/Node-RED/compare/1.5.0...1.5.1
[1.5.0]: https://github.com/thinger-io/Node-RED/compare/1.4.3...1.5.0
[1.4.3]: https://github.com/thinger-io/Node-RED/compare/1.4.2...1.4.3
[1.4.2]: https://github.com/thinger-io/Node-RED/compare/1.4.1...1.4.2
[1.4.1]: https://github.com/thinger-io/Node-RED/compare/1.4.0...1.4.1
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


