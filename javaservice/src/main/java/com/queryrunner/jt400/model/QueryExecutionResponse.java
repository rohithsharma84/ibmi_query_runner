package com.queryrunner.jt400.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public class QueryExecutionResponse {
	
	@JsonProperty("success")
	private boolean success;
	
	@JsonProperty("executionTimeMs")
	private long executionTimeMs;
	
	@JsonProperty("rowCount")
	private int rowCount;
	
	@JsonProperty("data")
	private List<Map<String, Object>> data;
	
	@JsonProperty("error")
	private String error;
	
	@JsonProperty("errorDetails")
	private String errorDetails;

	// Constructors
	public QueryExecutionResponse() {
	}

	public QueryExecutionResponse(boolean success, long executionTimeMs, int rowCount,
								   List<Map<String, Object>> data) {
		this.success = success;
		this.executionTimeMs = executionTimeMs;
		this.rowCount = rowCount;
		this.data = data;
	}

	// Getters and Setters
	public boolean isSuccess() {
		return success;
	}

	public void setSuccess(boolean success) {
		this.success = success;
	}

	public long getExecutionTimeMs() {
		return executionTimeMs;
	}

	public void setExecutionTimeMs(long executionTimeMs) {
		this.executionTimeMs = executionTimeMs;
	}

	public int getRowCount() {
		return rowCount;
	}

	public void setRowCount(int rowCount) {
		this.rowCount = rowCount;
	}

	public List<Map<String, Object>> getData() {
		return data;
	}

	public void setData(List<Map<String, Object>> data) {
		this.data = data;
	}

	public String getError() {
		return error;
	}

	public void setError(String error) {
		this.error = error;
	}

	public String getErrorDetails() {
		return errorDetails;
	}

	public void setErrorDetails(String errorDetails) {
		this.errorDetails = errorDetails;
	}
}
