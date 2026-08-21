package com.springBoot.test.Service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Flux;

@Service
public class AiService {
	
	@Autowired
	private ChatClient chatClient;
	
	
	public String getResponse(String prompt){
		return this.chatClient
				.prompt(prompt)
				.options(GoogleGenAiChatOptions.builder()
						.thinkingBudget(150)
						.build())
				.advisors(a->a.param(ChatMemory.CONVERSATION_ID, "user"))
				.call()
				.content();
	}
	
}
