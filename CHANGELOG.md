# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-08-08

### Added
- Initial release of Drasi SignalR Data Source Plugin
- Real-time data streaming via SignalR connections
- Support for insert, update, and delete operations from Drasi platform
- Snapshot reload functionality with error handling
- Configurable SignalR endpoint URL and query IDs
- User-friendly error reporting in the UI
- Loading states for better user experience
- Comprehensive error handling and logging
- Docker development environment setup

### Features
- **Real-time Streaming**: Live data updates through SignalR connections
- **Operation Support**: Handle insert (i), update (u), delete (d), and control (x) operations
- **Snapshot Loading**: Option to load current data snapshot on query start
- **Manual Reload**: Reload snapshot button with progress indication
- **Error Handling**: User-visible error messages and detailed console logging
- **Data Processing**: Intelligent data frame building and row management
- **Development Tools**: Docker Compose setup for easy testing

### Technical Details
- Compatible with Grafana 10.2.0+
- Built with TypeScript and React
- Uses @drasi/signalr-react for SignalR connectivity
- Implements Grafana data source plugin interface
- Includes comprehensive TypeScript type definitions

### Documentation
- Complete setup and usage instructions
- Development environment configuration
- Plugin signing and publishing guidelines
- Troubleshooting guide for common issues

