# Drasi SignalR Data Source Plugin

A Grafana data source plugin that enables real-time streaming of data changes from Drasi SignalR endpoints. Perfect for building live dashboards that update automatically as your data changes.

## 🌟 Features

- **Real-time Streaming**: Live data updates through SignalR connections
- **Operation Support**: Handle insert, update, delete, and control operations
- **Snapshot Loading**: Load current data state on query initialization
- **Manual Reload**: Reload snapshot functionality with progress indication
- **Error Handling**: Comprehensive error reporting with user-friendly messages
- **Type Safety**: Built with TypeScript for robust development
- **Easy Setup**: Docker development environment included

## 🚀 Quick Start

### Prerequisites

- Grafana 8.0.0 or later
- Drasi platform with SignalR endpoint
- Node.js 18.x or later (for development)

### Installation

#### Option 1: Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/drasi-project/grafana-signalr/releases)
2. Extract to your Grafana plugins directory
3. Enable `drasi-signalr` as an [unsigned plugin](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#allow_loading_unsigned_plugins)
4. Restart Grafana

#### Option 2: Development Setup

```bash
# Clone the repository
git clone https://github.com/drasi-project/grafana-signalr.git
cd grafana-signalr

# Install dependencies
npm install

# Build the plugin
npm run build

# Start Grafana with Docker
npm run server
```

Access Grafana at http://localhost:3000 (admin/admin)

## 📖 Configuration

### 1. Add Data Source

1. Navigate to **Configuration** → **Data Sources**
2. Click **Add data source**
3. Search for "Drasi SignalR" and select it
4. Configure the SignalR endpoint URL (e.g., `http://localhost:8080/hub`)
5. Click **Save & Test**

### 2. Create Query

1. Create a new dashboard or edit existing panel
2. Select "Drasi SignalR" as the data source
3. Configure query settings:
   - **Query ID**: The identifier for your Drasi query
   - **Load snapshot on start**: Enable to get current data state
4. Click **Apply**

## 🎯 Usage Examples

### Basic Real-time Dashboard

```yaml
# Example query configuration
Query ID: "user-activity"
Load snapshot on start: true
```

This will:
- Connect to your SignalR endpoint
- Stream real-time changes for "user-activity" query
- Load current data state when the panel initializes

### Multiple Queries

You can add multiple queries to a single panel to combine different data streams.

## 🏗️ Architecture

### Data Flow

```
Drasi Platform → SignalR Endpoint → Plugin → Grafana Panel
```


### Operation Types

- **Insert (i)**: New data records
- **Update (u)**: Modified records (before/after states)
- **Delete (d)**: Removed records
- **Control (x)**: Control signals and metadata

### Error Handling

The plugin includes comprehensive error handling:
- Network connection issues
- Invalid query configurations  
- Data processing errors
- User-friendly error messages in the UI

## 📚 API Reference

### Plugin Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| signalrUrl | string | Yes | SignalR endpoint URL |

### Query Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| queryId | string | "" | Drasi query identifier |
| snapshotOnStart | boolean | false | Load current data on start |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/drasi-project/grafana-signalr/blob/master/CONTRIBUTING.md) for details.

## 📋 Requirements

### Runtime Requirements
- Grafana 10.2.0+
- Modern web browser with WebSocket support

## 🐛 Troubleshooting

### Common Issues

**Connection Failed**
- Verify SignalR endpoint is accessible
- Check network connectivity
- Ensure CORS is configured properly

**No Data Showing**
- Verify Query ID exists in Drasi
- Check browser console for errors
- Ensure "Load snapshot on start" if you need current data

**Plugin Not Loading**
- Check Grafana logs for errors
- Verify plugin is properly signed (for production)
- Ensure Grafana version compatibility

### Getting Help

1. Check the [Issues](https://github.com/drasi-project/grafana-signalr/issues) page
2. Review [Drasi Documentation](https://drasi.io)
3. Join our [Community Discord](https://discord.gg/drasi)

## 📄 License

This project is licensed under the Apache 2.0 License - see the [LICENSE](https://github.com/drasi-project/grafana-signalr/blob/master/LICENSE) file for details.

## 🙏 Acknowledgments

- [Grafana](https://grafana.com/) for the excellent plugin framework
- [Drasi Project](https://drasi.io/) for the reactive data platform
- [SignalR](https://dotnet.microsoft.com/en-us/apps/aspnet/signalr) for real-time communication
