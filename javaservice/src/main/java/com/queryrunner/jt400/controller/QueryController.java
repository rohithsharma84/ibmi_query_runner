package com.queryrunner.jt400.controller;

import com.queryrunner.jt400.model.QueryExecutionRequest;
import com.queryrunner.jt400.model.QueryExecutionResponse;
import com.queryrunner.jt400.service.JT400QueryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/query")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class QueryController {

	private static final Logger logger = LoggerFactory.getLogger(QueryController.class);

	@Autowired
	private JT400QueryService queryService;

	@PostMapping("/execute")
	public ResponseEntity<QueryExecutionResponse> executeQuery(
		@RequestBody QueryExecutionRequest request,
		Principal principal
	) {
		try {
			logger.info("Query execution request received from user: {}", principal.getName());

			if (request.getSql() == null || request.getSql().trim().isEmpty()) {
				QueryExecutionResponse error = new QueryExecutionResponse();
				error.setSuccess(false);
				error.setError("SQL query cannot be empty");
				return ResponseEntity.badRequest().body(error);
			}

			QueryExecutionResponse response = queryService.executeQuery(request);

			if (response.isSuccess()) {
				logger.info("Query executed successfully for user: {}", principal.getName());
				return ResponseEntity.ok(response);
			} else {
				logger.warn("Query execution failed for user: {}", principal.getName());
				return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
			}

		} catch (Exception e) {
			logger.error("Error processing query execution request", e);
			QueryExecutionResponse errorResponse = new QueryExecutionResponse();
			errorResponse.setSuccess(false);
			errorResponse.setError("Internal server error: " + e.getMessage());
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
		}
	}

	@GetMapping("/health")
	public ResponseEntity<String> health() {
		return ResponseEntity.ok("JT400 Query Service is running");
	}
}
