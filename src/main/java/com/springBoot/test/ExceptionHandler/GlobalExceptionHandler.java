package com.springBoot.test.ExceptionHandler;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.springBoot.test.Exceptions.CartEmptyException;
import com.springBoot.test.Exceptions.GuardrailException;
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
	
	@ExceptionHandler(CartEmptyException.class)
	public ResponseEntity<?> handleCart(CartEmptyException ex){
		return ResponseEntity
				.status(HttpStatus.OK)
				.body(ex.getMessage());
	}
	
	@ExceptionHandler(GuardrailException.class)
	public ResponseEntity<?> handleGuardrails(GuardrailException ex){
		return ResponseEntity
				.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION)
				.body(ex.getMessage());
	}
	
}
