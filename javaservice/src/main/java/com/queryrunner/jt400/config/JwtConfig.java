package com.queryrunner.jt400.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.SecretKey;

@Configuration
public class JwtConfig {

	private static final Logger logger = LoggerFactory.getLogger(JwtConfig.class);

	@Value("${JWT_SECRET:your_jwt_secret_key}")
	private String jwtSecret;

	@Value("${JWT_EXPIRY:7d}")
	private String jwtExpiry;

	public SecretKey getSigningKey() {
		try {
			return Keys.hmacShaKeyFor(jwtSecret.getBytes());
		} catch (IllegalArgumentException e) {
			logger.error("Invalid JWT secret key length. Must be at least 256 bits.", e);
			throw new RuntimeException("Invalid JWT configuration", e);
		}
	}

	public String getJwtSecret() {
		return jwtSecret;
	}

	public String getJwtExpiry() {
		return jwtExpiry;
	}
}
