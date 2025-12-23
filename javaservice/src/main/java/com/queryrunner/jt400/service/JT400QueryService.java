package com.queryrunner.jt400.service;

import com.queryrunner.jt400.model.QueryExecutionRequest;
import com.queryrunner.jt400.model.QueryExecutionResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.sql.*;
import java.util.*;

@Service
public class JT400QueryService {

	private static final Logger logger = LoggerFactory.getLogger(JT400QueryService.class);

	@Value("${jt400.query.timeout:0}")
	private int queryTimeout;

	public QueryExecutionResponse executeQuery(QueryExecutionRequest request) {
		long startTime = System.currentTimeMillis();
		QueryExecutionResponse response = new QueryExecutionResponse();

		Connection conn = null;
		Statement stmt = null;
		ResultSet rs = null;

		try {
			// Build JDBC URL
			String jdbcUrl = buildJDBCUrl(request);
			logger.info("Connecting to: {}", jdbcUrl);

			// Create connection
			conn = DriverManager.getConnection(
				jdbcUrl,
				request.getUsername(),
				request.getPassword()
			);
			logger.debug("Connection established successfully");

			// Create statement
			stmt = conn.createStatement();
			if (queryTimeout > 0) {
				stmt.setQueryTimeout(queryTimeout);
			}

			// Execute query
			logger.debug("Executing query: {}", request.getSql());
			rs = stmt.executeQuery(request.getSql());

			// Fetch results
			List<Map<String, Object>> data = new ArrayList<>();
			ResultSetMetaData metadata = rs.getMetaData();
			int columnCount = metadata.getColumnCount();

			int rowCount = 0;
			while (rs.next() && rowCount < 10000) { // Limit to 10000 rows in memory
				Map<String, Object> row = new LinkedHashMap<>();
				for (int i = 1; i <= columnCount; i++) {
					String columnName = metadata.getColumnName(i);
					Object columnValue = rs.getObject(i);
					row.put(columnName, columnValue);
				}
				data.add(row);
				rowCount++;
			}

			long executionTime = System.currentTimeMillis() - startTime;
			response.setSuccess(true);
			response.setExecutionTimeMs(executionTime);
			response.setRowCount(rowCount);
			response.setData(data);

			logger.info("Query executed successfully. Rows: {}, Time: {}ms", rowCount, executionTime);

		} catch (SQLException e) {
			long executionTime = System.currentTimeMillis() - startTime;
			response.setSuccess(false);
			response.setExecutionTimeMs(executionTime);
			response.setError("SQL Error: " + e.getMessage());
			response.setErrorDetails(getSQLErrorDetails(e));
			logger.error("SQL execution error", e);

		} catch (Exception e) {
			long executionTime = System.currentTimeMillis() - startTime;
			response.setSuccess(false);
			response.setExecutionTimeMs(executionTime);
			response.setError("Execution Error: " + e.getMessage());
			response.setErrorDetails(e.toString());
			logger.error("Unexpected error during query execution", e);

		} finally {
			// Clean up resources
			try {
				if (rs != null) rs.close();
				if (stmt != null) stmt.close();
				if (conn != null) conn.close();
				logger.debug("Connection closed");
			} catch (SQLException e) {
				logger.warn("Error closing resources", e);
			}
		}

		return response;
	}

	private String buildJDBCUrl(QueryExecutionRequest request) {
		StringBuilder url = new StringBuilder();
		url.append("jdbc:as400://").append(request.getHost());

		if (request.getPort() > 0) {
			url.append(":").append(request.getPort());
		}

		if (request.getDatabase() != null && !request.getDatabase().isEmpty()) {
			url.append("/").append(request.getDatabase());
		}

		// Add connection properties
		url.append(";");
		List<String> properties = new ArrayList<>();

		if (request.isSecure()) {
			properties.add("secure=true");
		} else {
			properties.add("secure=false");
		}

		if (request.getLibraryList() != null && !request.getLibraryList().isEmpty()) {
			properties.add("libraries=" + request.getLibraryList());
		}

		if (request.getDefaultSchema() != null && !request.getDefaultSchema().isEmpty()) {
			properties.add("default schema=" + request.getDefaultSchema());
		}

		// Thread safety for concurrent queries
		properties.add("thread used=true");

		url.append(String.join(";", properties));

		return url.toString();
	}

	private String getSQLErrorDetails(SQLException e) {
		StringBuilder sb = new StringBuilder();
		sb.append("SQLState: ").append(e.getSQLState()).append("\n");
		sb.append("Error Code: ").append(e.getErrorCode()).append("\n");
		sb.append("Message: ").append(e.getMessage()).append("\n");

		if (e.getCause() != null) {
			sb.append("Cause: ").append(e.getCause().getMessage()).append("\n");
		}

		return sb.toString();
	}
}
