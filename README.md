# IBM i Query Runner

A full-stack web application for IBM i that helps you track and compare SQL query performance before and after system changes such as patches, PTFs, or OS upgrades.

## 🎯 Project Objectives

The IBM i Query Runner enables database administrators and developers to:

- **Baseline Performance**: Capture query performance metrics before system changes
- **Detect Regressions**: Identify queries that run slower after updates
- **Track Improvements**: Discover queries that benefit from system changes
- **Prevent Issues**: Catch performance problems before they impact production
- **Document Changes**: Generate reports for change management and compliance

## ✨ Key Features

### Query Set Management
- **Import from Plan Cache**: Automatically import queries from `QSYS2.PLAN_CACHE_INFO` or `QSYS2.PLAN_CACHE`
- **Organize by User Profile**: Group queries by the user profile that executed them
- **Flexible Filtering**: Filter by date range, execution count, and custom criteria
- **Smart Refresh**: Sync query sets with plan cache to add new queries, remove obsolete ones, and update changed queries
- **Duplicate Detection**: Automatically detect and prevent duplicate queries using hash-based comparison

### Test Run Execution
- **Configurable Iterations**: Execute each query multiple times (1-100 iterations)
- **Multiple Metrics Levels**:
  - **Basic**: Execution time and success/failure status
  - **Standard**: Basic + rows returned/affected and error messages
  - **Comprehensive**: Standard + CPU time, I/O operations, and optimizer statistics
- **Real-time Progress**: Monitor execution progress via WebSocket updates
- **Error Resilience**: Continue execution even when individual queries fail
- **Detailed Logging**: Track all execution attempts with timestamps and error details

### Performance Comparison
- **Before/After Analysis**: Compare test runs from before and after system changes
- **Set-Level Metrics**: View overall performance impact across all queries
- **Query-Level Details**: Drill down to individual query performance changes
- **Configurable Thresholds**: Set custom deviation percentages (default 20%)
- **Smart Categorization**: Automatically classify queries as improved, degraded, or unchanged
- **Failure Tracking**: Identify new failures or resolved issues

### Results & Reporting
- **Dual-Level Views**: View results at both query set and individual query levels
- **Statistical Analysis**: Min, max, average, and standard deviation for execution times
- **HTML Export**: Generate printable comparison reports for documentation
- **Historical Data**: Maintain execution history for trend analysis
- **Visual Indicators**: Color-coded results highlighting performance changes

### Security & Access Control
- **IBM i Authentication**: Authenticate using IBM i user profiles
- **Access Control List**: Restrict access to authorized users only
- **QSECOFR Access**: Security officer always granted access by default
- **Audit Trail**: Track all user actions with timestamps
- **Role-Based Permissions**: Admin and standard user roles

## 🏗️ Architecture

### Technology Stack

**Backend**
- Node.js with Express.js
- node-jt400 (JDBC driver for Db2 for i)
- WebSocket for real-time updates
- JWT for authentication

**Frontend**
- Vue.js 3 with Composition API
- Tailwind CSS for styling
- Vite for build tooling
- Pinia for state management

**Database**
- Db2 for i
- 10 tables for data persistence
- Views for reporting
- Stored procedures for statistics

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Vue.js Frontend                          │
│  (Query Set Management, Test Runs, Comparisons, Reports)    │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS/WebSocket
┌─────────────────────▼───────────────────────────────────────┐
│                  Express.js Backend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Query Set    │  │ Execution    │  │ Comparison   │      │
│  │ Manager      │  │ Engine       │  │ Engine       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────┬───────────────────────────────────────┘
                      │ JDBC (node-jt400)
┌─────────────────────▼───────────────────────────────────────┐
│                    Db2 for i                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Query Sets   │  │ Test Runs    │  │ Comparisons  │      │
│  │ & Queries    │  │ & Executions │  │ & Details    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- IBM i system with Db2 for i
- Node.js 16+ installed on IBM i or separate server
- Access to `QSYS2.PLAN_CACHE` views
- User profile with appropriate authorities

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ibmi_query_runner.git
   cd ibmi_query_runner
   ```

2. **Create database library**
   ```sql
   CRTLIB LIB(YOURLIB) TEXT('Query Runner Application')
   ```

3. **Initialize database schema**
   ```bash
   # Connect to IBM i and run:
   SET SCHEMA YOURLIB;
   # Then execute all scripts in database/schema/ directory
   ```

4. **Configure backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Configure frontend**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

6. **Start the application**
   ```bash
   cd backend
   npm start
   ```

7. **Access the application**
   - Open browser to `http://your-server:3000`
   - Login with your IBM i user profile

## 📖 Usage Example

### Typical Workflow

1. **Before System Change**
   - Create a query set from plan cache (e.g., "Production Queries - User APPUSER")
   - Run a test with 10 iterations
   - Label it "Pre-Patch Baseline - Dec 2024"

2. **Apply System Change**
   - Apply PTFs, patches, or OS upgrade
   - Restart system if required

3. **After System Change**
   - Refresh the query set to sync with current plan cache
   - Run another test with same configuration
   - Label it "Post-Patch Test - Dec 2024"

4. **Compare Results**
   - Create comparison between baseline and post-patch runs
   - Set deviation threshold (e.g., 20%)
   - Review queries that degraded or improved
   - Export HTML report for documentation

## 📁 Project Structure

```
ibmi_query_runner/
├── backend/              # Node.js backend
│   ├── src/
│   │   ├── controllers/  # API controllers
│   │   ├── services/     # Business logic
│   │   ├── models/       # Data models
│   │   └── routes/       # API routes
│   └── package.json
├── frontend/             # Vue.js frontend
│   ├── src/
│   │   ├── components/   # Vue components
│   │   ├── views/        # Page views
│   │   └── stores/       # State management
│   └── package.json
├── database/             # Database scripts
│   └── schema/           # DDL scripts
└── docs/                 # Documentation
```

## 📚 Documentation

- [Architecture Overview](ARCHITECTURE.md) - System design and components
- [Database Schema](DATABASE_SCHEMA.md) - Complete database structure
- [Project Structure](PROJECT_STRUCTURE.md) - File organization and setup
- [Implementation Plan](IMPLEMENTATION_PLAN.md) - Development roadmap

## 🔧 Configuration

### Database Library
The application uses a configurable database library. Set via environment variable:
```env
DB_LIBRARY=YOURLIB
```

### Installation Path
Choose any IFS location for deployment:
```env
INSTALL_ROOT=/your/install/path
```

### Metrics Collection
Configure default metrics level in database:
```sql
UPDATE YOURLIB.QRYRUN_CONFIG 
SET CONFIG_VALUE = 'COMPREHENSIVE' 
WHERE CONFIG_KEY = 'DEFAULT_METRICS_LEVEL';
```

### Deviation Threshold
Set default comparison threshold:
```sql
UPDATE YOURLIB.QRYRUN_CONFIG 
SET CONFIG_VALUE = '25.00' 
WHERE CONFIG_KEY = 'DEFAULT_DEVIATION_THRESHOLD';
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the IBM i community
- Inspired by the need for better performance tracking during system maintenance
- Uses the excellent node-jt400 library for JDBC connectivity

## 📧 Support

For questions, issues, or feature requests, please open an issue on GitHub.

## 🗺️ Roadmap

### Current Version (1.0)
- ✅ Query set management
- ✅ Test run execution
- ✅ Performance comparison
- ✅ HTML report export

### Future Enhancements
- 📅 Scheduled test runs
- 📧 Email notifications
- 📊 Performance trending over time
- 🔍 Query optimization suggestions
- 🌐 Multi-system comparison
- 📤 CSV/Excel export options

## 💡 Use Cases

### Pre-Production Testing
Test query performance in development before promoting to production.

### Patch Validation
Verify that PTFs don't negatively impact query performance.

### OS Upgrade Planning
Assess performance impact before major OS upgrades.

### Performance Monitoring
Track query performance trends over time.

### Capacity Planning
Identify queries that may need optimization as data grows.

---

**Made with ❤️ for IBM i**