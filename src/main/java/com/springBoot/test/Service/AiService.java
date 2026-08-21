package com.springBoot.test.Service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Flux;

@Service
public class AiService {
	
	private ChatClient chatClient;
	
	AiService(ChatClient.Builder chatClient){
		this.chatClient = chatClient.build();
	}
	
	public String getResponse(String prompt){
		return this.chatClient
				.prompt(prompt)
				.options(GoogleGenAiChatOptions.builder()
						.thinkingBudget(150)
						.build())
				.call()
				.content();
	}
	
}
