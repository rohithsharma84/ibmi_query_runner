package com.queryrunner.jt400.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

@Configuration
public class JT400DataSourceConfig {

	private static final Logger logger = LoggerFactory.getLogger(JT400DataSourceConfig.class);

	@Value("${jt400.max.connections:15}")
	private int maxPoolSize;

	@Value("${jt400.connection.timeout:30000}")
	private int connectionTimeout;

	@Bean
	public DataSource jt400DataSource() {
		HikariConfig config = new HikariConfig();
		
		// Connection pool settings
		config.setMaximumPoolSize(maxPoolSize);
		config.setMinimumIdle(5);
		config.setConnectionTimeout(connectionTimeout);
		config.setIdleTimeout(600000);        // 10 minutes
		config.setMaxLifetime(1800000);       // 30 minutes
		config.setLeakDetectionThreshold(60000);
		config.setAutoCommit(true);

		// JDBC driver
		config.setDriverClassName("com.ibm.as400.access.AS400JDBCDriver");
		
		// Connection URL will be set per-request, so we set a placeholder
		config.setJdbcUrl("jdbc:as400://localhost");
		config.setUsername("placeholder");
		config.setPassword("placeholder");

		config.setPoolName("JT400-HikariPool");

		logger.info("JT400 DataSource configured with max pool size: {}", maxPoolSize);
		return new HikariDataSource(config);
	}
}
