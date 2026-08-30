package com.springBoot.test;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;

@SpringBootTest
public class KafkaTest {

	@Autowired
	private KafkaTemplate<String, String> kafkaTemplate;
	
	@Test
	void send() throws InterruptedException {
		kafkaTemplate.send("test-topic", "This is me");
		Thread.sleep(5000);
	}
	
	@KafkaListener(topics = "test-topic", groupId = "test-group")
	void consume(String message) {
		System.out.println(message);
	}
	
}
