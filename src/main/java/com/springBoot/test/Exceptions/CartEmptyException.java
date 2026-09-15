package com.springBoot.test.Exceptions;

public class CartEmptyException extends Exception {

	public CartEmptyException() {
		super("Cart is empty");
	}
	
}
