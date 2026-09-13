package com.springBoot.test.Exceptions;

public class UserNotAuthenticatedException extends Exception{

	public UserNotAuthenticatedException() {
		super("User is not authenticated");
	}
	
}
