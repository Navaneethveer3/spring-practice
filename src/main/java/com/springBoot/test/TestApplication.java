package com.springBoot.test;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.*;

@SpringBootApplication
public class TestApplication {

	public static void main(String[] args) {
		ApplicationContext context = SpringApplication.run(TestApplication.class, args);
		
		
	}

}
