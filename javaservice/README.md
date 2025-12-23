# Java Microservice Build and Deployment

This directory contains the Spring Boot JT400 microservice for executing queries against IBM i DB2.

## Build

```bash
mvn clean package
```

## Run

```bash
java -jar target/jt400-query-service-1.0.0.jar
```

Or with environment variables:

```bash
export JWT_SECRET="your_jwt_secret_key"
export JAVA_SERVICE_JWT_SECRET="your_java_service_jwt_secret"
export jt400.ssl.enabled=true
export jt400.ssl.trust-store=/path/to/truststore.jks

java -jar target/jt400-query-service-1.0.0.jar
```

## Configuration

Edit `src/main/resources/application.properties` for:
- Server port (default: 8080)
- JT400 connection settings
- SSL/TLS configuration
- Connection pool settings
