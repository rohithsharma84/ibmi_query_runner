package com.queryrunner.jt400.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class QueryExecutionRequest {
	
	@JsonProperty("host")
	private String host;
	
	@JsonProperty("port")
	private int port;
	
	@JsonProperty("database")
	private String database;
	
	@JsonProperty("username")
	private String username;
	
	@JsonProperty("password")
	private String password;
	
	@JsonProperty("secure")
	private boolean secure;
	
	@JsonProperty("sql")
	private String sql;
	
	@JsonProperty("libraryList")
	private String libraryList;
	
	@JsonProperty("defaultSchema")
	private String defaultSchema;

	// Getters and Setters
	public String getHost() {
		return host;
	}

	public void setHost(String host) {
		this.host = host;
	}

	public int getPort() {
		return port;
	}

	public void setPort(int port) {
		this.port = port;
	}

	public String getDatabase() {
		return database;
	}

	public void setDatabase(String database) {
		this.database = database;
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public boolean isSecure() {
		return secure;
	}

	public void setSecure(boolean secure) {
		this.secure = secure;
	}

	public String getSql() {
		return sql;
	}

	public void setSql(String sql) {
		this.sql = sql;
	}

	public String getLibraryList() {
		return libraryList;
	}

	public void setLibraryList(String libraryList) {
		this.libraryList = libraryList;
	}

	public String getDefaultSchema() {
		return defaultSchema;
	}

	public void setDefaultSchema(String defaultSchema) {
		this.defaultSchema = defaultSchema;
	}
}
