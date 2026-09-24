package com.ecommerce.payment_service.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.net.URI;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private static final String BASE_TYPE_URI = "https://api.ecommerce.com/errors/";

    @ExceptionHandler(SessionExpiredException.class)
    public ProblemDetail handleSessionExpired(SessionExpiredException ex, WebRequest request) {
        log.warn("Session expired on {}: {}", request.getDescription(false), ex.getMessage());
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.GONE,
                "The checkout session has expired. Please initiate a new payment session."
        );
        problem.setTitle("Payment Session Expired");
        problem.setType(URI.create(BASE_TYPE_URI + "session-expired"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleResourceNotFound(ResourceNotFoundException ex, WebRequest request) {
        log.warn("Resource not found on {}: {}", request.getDescription(false), ex.getMessage());
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Resource Not Found");
        problem.setType(URI.create(BASE_TYPE_URI + "not-found"));
        problem.setProperty("timestamp", Instant.now());
        problem.setProperty("resource", ex.getResourceName());
        problem.setProperty("field", ex.getFieldName());
        return problem;
    }

    @ExceptionHandler(InvalidSessionStateException.class)
    public ProblemDetail handleInvalidSessionState(InvalidSessionStateException ex, WebRequest request) {
        log.warn("Invalid session state on {}: {}", request.getDescription(false), ex.getMessage());
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setTitle("Invalid Session State");
        problem.setType(URI.create(BASE_TYPE_URI + "invalid-state"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(PaymentProcessingException.class)
    public ProblemDetail handlePaymentProcessing(PaymentProcessingException ex, WebRequest request) {
        log.warn("Payment processing error on {}: {}", request.getDescription(false), ex.getMessage());
        String detailMessage = (ex.getUserFriendlyMessage() != null && !ex.getUserFriendlyMessage().isBlank())
                ? ex.getUserFriendlyMessage()
                : "The payment could not be processed with the issuer.";

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, detailMessage);
        problem.setTitle("Payment Processing Error");
        problem.setType(URI.create(BASE_TYPE_URI + "payment-failed"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        log.warn("Validation error on request: {}", ex.getMessage());
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Input validation failed for one or more fields.");
        problem.setTitle("Validation Error");
        problem.setType(URI.create(BASE_TYPE_URI + "validation-error"));
        problem.setProperty("timestamp", Instant.now());

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(err -> errors.put(err.getField(), err.getDefaultMessage()));
        problem.setProperty("errors", errors);
        return problem;
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleMessageNotReadable(HttpMessageNotReadableException ex, WebRequest request) {
        log.warn("Malformed JSON payload or unrecognized properties on path: {}", request.getDescription(false));
        // Strict suppression of internal Jackson class names (e.g. UnrecognizedPropertyException)
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "Request payload is malformed or contains unsupported fields."
        );
        problem.setTitle("Invalid Request Payload");
        problem.setType(URI.create(BASE_TYPE_URI + "invalid-payload"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgument(IllegalArgumentException ex, WebRequest request) {
        log.warn("Illegal argument on {}: {}", request.getDescription(false), ex.getMessage());
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setTitle("Bad Request");
        problem.setType(URI.create(BASE_TYPE_URI + "bad-request"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneral(Exception ex, WebRequest request) {
        log.error("Unhandled exception on {}: {}", request.getDescription(false), ex.getMessage(), ex);
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected internal error occurred while processing payment."
        );
        problem.setTitle("Internal Server Error");
        problem.setType(URI.create(BASE_TYPE_URI + "internal-server-error"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }
}
