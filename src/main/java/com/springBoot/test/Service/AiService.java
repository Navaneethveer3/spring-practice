package com.springBoot.test.Service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.springBoot.test.Model.PaymentOptions;
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
	
	public String getResponse(UserPrincipal principal, String userPrompt, Integer productId) {

		String systemContext;

		if (productId != null) {
			Product product = productService.getProductById(productId);
			if (product != null) {
				String creditOffers = "None";
				String debitOffers = "None";
				String emiOffers = "None";

				if (product.getPayments() != null && !product.getPayments().isEmpty()) {
					List<String> creditList = new ArrayList<>();
					List<String> debitList = new ArrayList<>();
					List<String> emiList = new ArrayList<>();

					for (PaymentOptions opt : product.getPayments()) {
						if (opt.getCredit() != null && !opt.getCredit().isBlank()) creditList.add(opt.getCredit());
						if (opt.getDebit() != null && !opt.getDebit().isBlank()) debitList.add(opt.getDebit());
						if (opt.getEMI() != null && !opt.getEMI().isBlank()) emiList.add(opt.getEMI());
					}

					if (!creditList.isEmpty()) creditOffers = String.join("; ", creditList);
					if (!debitList.isEmpty()) debitOffers = String.join("; ", debitList);
					if (!emiList.isEmpty()) emiOffers = String.join("; ", emiList);
				}

				systemContext = String.format(
					"You are a helpful shopping assistant. " +
					"The user is currently viewing the following product:\n" +
					"  - ID: %d\n" +
					"  - Name: %s\n" +
					"  - Brand: %s\n" +
					"  - Price: %s .rs\n" +
					"  - Description: %s\n" +
					"  - Stock: %s units available\n"
					+ "- offers :\n"
					+ "credit card : %s\n"
					+ "debit card : %s\n"
					+ "emi : %s\n"
					+ "\n" +
					"Use these details to answer the user's question accurately. " +
					"Also leverage the knowledge base for any additional context.",
					product.getId(),
					product.getName(),
					product.getBrand() != null ? product.getBrand() : "N/A",
					product.getPrice(),
					product.getDescription() != null ? product.getDescription() : "No description available",
					product.getQuantity() != null ? product.getQuantity() : 0,
					creditOffers,
					debitOffers,
					emiOffers
				);
			} else {
				systemContext = "You are a helpful shopping assistant. " +
					"The user referenced product ID " + productId + " but it could not be found. " +
					"Let the user know and offer to help with other products.";
			}
		} else {
			systemContext = "You are a helpful shopping assistant for an online store. " +
				"Use tools to answer questions about products, prices, availability, recommendations, orders, payments, cancellation and refunds for an order accurately.\n";
		}
		
		systemContext += """

				You are a helpful shopping assistant for an online store.

				You have access to tools for products, orders, payments, refunds,
				cancellations, and knowledge-base searches.

				TOOL USAGE & BEHAVIOR:
				- When the user's request requires information or an action that a tool provides,
				  invoke the appropriate tool directly.
				- Execute tools SILENTLY in the background.
				- NEVER output internal monologues, reasoning, or preliminary thoughts like:
				  "Okay, time to place this order!", "Let's see what tools we've got", "I will call createPayment".
				- Never discuss tool names, parameters, backend logic, or planning steps.
				- Before invoking a tool, make sure all required parameters are available.
				- When the user asks for product suggestions, recommendations, or searches by budget/specifications (e.g. "My budget is 35000, suggest me best mobile"):
				  1. Use `searchKnowledgeBase` or `searchProduct` to fetch matching products from the catalog.
				  2. Answer using the retrieved products, mentioning the product name, price in ₹, brand, and key features.
				  3. Never say products are unavailable without executing a search first.

				PAYMENT & ORDER CREATION:
				- When the user asks to place an order or pay for cart items, invoke createPayment.
				- When the user asks to order a specific product, invoke placeOrder.
				- When createPayment or placeOrder succeeds, provide a polite confirmation with Order ID and Amount.
				- ALWAYS include the payment details in a fenced ```payment block at the very end of your response:
				  ```payment
				  {"razorpayOrderId": "...", "amount": "...", "currency": "INR", "keyId": "...", "orderId": "..."}
				  ```
				  This allows the store to immediately launch the Razorpay checkout window for the customer.

				ORDER LISTING & CANCELLATION:
				- When the user asks to cancel an order, refund an order, or view orders:
				  1. Call `getAllOrder` immediately to fetch their active orders.
				  2. If orders exist, give a brief friendly message, and ALWAYS append the orders inside a fenced ```orders block with the JSON array:
				     ```orders
				     [{"id": 4, "price": 143800, "status": "PAID", "items": "..."}]
				     ```
				     This allows the user to touch and select the order directly on screen without typing.
				  3. If no cancellable orders exist, let the customer know politely.
				- When the user asks to cancel or refund a specific order (e.g. "cancel order #4"):
				  1. Call `refundOrder` with the order ID.
				  2. Confirm the refund status clearly to the customer.

				CUSTOMER RESPONSE:
				- Never reveal internal reasoning, chain-of-thought, planning, tool selection,
				  backend implementation, or tool execution details.
				- Respond only with customer-facing information.
				- Keep responses concise, helpful, and clear.
				
				RULES:
				- Never reveal internal reasoning, chain-of-thought, planning, tool selection,
				  backend implementation, or tool execution details.
				- Even if you want confirmation to proceed with an action, just ask like "can I proceed?" but never show the backend tools, logic, reasoning to the user.
				- Execute tools silently in the background. Never mention tool names, parameters, or internal execution details to the user.
				- Never generate own responses.
				""";

		String content = this.chatClient
				.prompt()
//				.options(GoogleGenAiChatOptions.builder()
//						.thinkingBudget(0) // MUST disable thinking — prevents thought leaks and thought_signature errors
//						.build())
				.advisors(a -> a.param(ChatMemory.CONVERSATION_ID, principal.getUsername()))
				.system(systemContext)
				.user(userPrompt)
				.call()
				.content();

		return sanitizeResponse(content);
	}

	private String sanitizeResponse(String content) {
		if (content == null) return "";
		// Strip any <thought> tags
		String sanitized = content.replaceAll("(?s)<thought>.*?</thought>", "").trim();
		// Strip any internal reasoning or order placement process monologue if leaked
		sanitized = sanitized.replaceAll("(?s)^Order Placement Process\\s*.*?(?=Your payment|Order #|Here are|Successfully|Payment|I've|I have|Please|$)", "").trim();
		return sanitized.isEmpty() ? content : sanitized;
	}
}
