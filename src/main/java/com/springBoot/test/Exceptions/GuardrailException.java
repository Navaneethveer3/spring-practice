package com.springBoot.test.Exceptions;

public class GuardrailException extends Exception {

	public GuardrailException() {
		super("There is sensitive information present, can'e be processed");
	}
	
}
