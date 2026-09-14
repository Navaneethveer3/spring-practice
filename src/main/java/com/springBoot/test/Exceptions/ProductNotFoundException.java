package com.springBoot.test.Exceptions;

public class ProductNotFoundException extends Exception {

	public ProductNotFoundException() {
		super("Product does not exists");
	}
	
}
