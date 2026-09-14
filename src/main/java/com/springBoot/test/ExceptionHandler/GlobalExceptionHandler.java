package com.springBoot.test.ExceptionHandler;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.springBoot.test.Exceptions.ProductNotFoundException;
import com.springBoot.test.Exceptions.ProfileNotFoundException;
import com.springBoot.test.Exceptions.UserNotAuthenticatedException;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(UserNotAuthenticatedException.class)
	public ResponseEntity<?> handleAuthentication(UserNotAuthenticatedException ex){
		return ResponseEntity
				.status(HttpStatus.UNAUTHORIZED)
				.body(ex.getMessage());
	}
	
	@ExceptionHandler(ProductNotFoundException.class)
	public ResponseEntity<?> handleProduct(ProductNotFoundException ex){
		return ResponseEntity
				.status(HttpStatus.NOT_FOUND)
				.body(ex.getMessage());
	}
	
	@ExceptionHandler(ProfileNotFoundException.class)
	public ResponseEntity<?> handleProfile(ProfileNotFoundException ex){
		return ResponseEntity
				.status(HttpStatus.NOT_FOUND)
				.body(ex.getMessage());
	}
	
}
