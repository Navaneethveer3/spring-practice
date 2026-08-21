package com.springBoot.test;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.springBoot.test.Service.AiService;

@SpringBootTest
class AiServiceTests {


	@Autowired
	private AiService service;
	
	@Test
	void getResponse() {
		String prompt = "Tell me a story in 100 words";
		String response = this.service.getResponse(prompt);
		System.out.println(response);
	}
	
}
