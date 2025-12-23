package com.queryrunner.jt400.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

	@Value("${JWT_SECRET:your_jwt_secret_key}")
	private String jwtSecret;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
									 jakarta.servlet.FilterChain filterChain)
			throws ServletException, IOException {
		
		try {
			String token = extractToken(request);
			
			if (token != null) {
				try {
					// Verify JWT token
					var claims = Jwts.parserBuilder()
						.setSigningKey(jwtSecret.getBytes())
						.build()
						.parseClaimsJws(token)
						.getBody();

					String username = claims.getSubject();
					
					// Create authentication token
					UsernamePasswordAuthenticationToken authToken =
						new UsernamePasswordAuthenticationToken(username, null, null);
					
					SecurityContextHolder.getContext().setAuthentication(authToken);
					logger.debug("JWT token validated for user: {}", username);
				} catch (JwtException e) {
					logger.warn("JWT validation failed: {}", e.getMessage());
					response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
					response.getWriter().write("Invalid token");
					return;
				}
			} else {
				logger.debug("No JWT token found in request");
				response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
				response.getWriter().write("No token provided");
				return;
			}
		} catch (Exception e) {
			logger.error("Error processing JWT token", e);
			response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
			response.getWriter().write("Authentication failed");
			return;
		}

		filterChain.doFilter(request, response);
	}

	private String extractToken(HttpServletRequest request) {
		String bearerToken = request.getHeader("Authorization");
		if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
			return bearerToken.substring(7);
		}
		return null;
	}
}
