package com.springBoot.test.Service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.springBoot.test.Model.Product;
import com.springBoot.test.Model.UserPrincipal;

import reactor.core.publisher.Flux;

@Service
public class AiService {

	@Autowired
	private ChatClient chatClient;

	@Autowired
	private ProductService productService;

	
	public String chat(String prompt) {
		return chatClient
				.prompt(prompt)
				.call()
				.content();
	}
	
	public Flux<String> getResponse(UserPrincipal principal, String userPrompt, Integer productId) {

		String systemContext;

		if (productId != null) {
			Product product = productService.getProductById(productId);
			if (product != null) {
				systemContext = String.format(
					"You are a helpful shopping assistant. " +
					"The user is currently viewing the following product:\n" +
					"  - ID: %d\n" +
					"  - Name: %s\n" +
					"  - Brand: %s\n" +
					"  - Price: $%s\n" +
					"  - Description: %s\n" +
					"  - Stock: %s units available\n\n" +
					"Use these details to answer the user's question accurately. " +
					"Also leverage the knowledge base for any additional context.",
					product.getId(),
					product.getName(),
					product.getBrand() != null ? product.getBrand() : "N/A",
					product.getPrice(),
					product.getDescription() != null ? product.getDescription() : "No description available",
					product.getQuantity() != null ? product.getQuantity() : 0
				);
			} else {
				systemContext = "You are a helpful shopping assistant. " +
					"The user referenced product ID " + productId + " but it could not be found. " +
					"Let the user know and offer to help with other products.";
			}
		} else {
			systemContext = "You are a helpful shopping assistant for an online store. " +
				"Use the knowledge base to answer questions about products, prices, availability, and recommendations accurately.";
		}
		
		systemContext += "\n you have tool access, never execute the tools until you have enough details that are required for the tool execution"
				+ "you need to assist the customers in a very simple way, like the conversations should be very clear and concise but everything should covered that is asked by user in a simple manner";

		return this.chatClient
				.prompt()
//				.options(GoogleGenAiChatOptions.builder()
//						.thinkingBudget(0) // disable thinking for faster streaming
//						.build())
				.advisors(a -> a.param(ChatMemory.CONVERSATION_ID, principal.getUsername()))
				.system(systemContext)
				.user(userPrompt)
				.stream()
				.content();
	}
}
