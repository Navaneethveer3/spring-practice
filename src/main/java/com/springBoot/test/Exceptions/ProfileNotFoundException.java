package com.springBoot.test.Exceptions;

public class ProfileNotFoundException extends Exception {

	public ProfileNotFoundException() {
		super("Profile does not exist");
	}
	
}
