package com.springBoot.test.Tools;

import java.util.Map;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.springBoot.test.Service.PaymentService;

@Component
public class PaymentTools {

	@Autowired
	private PaymentService paymentService;
	
	private String getAuthenticatedUsername() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
			return null;
		}
		return auth.getName();
	}
	
	@Tool(description = "create a payment order to place the order with the items in the cart")
	public Map<String,String> createPayment() {
		try {
			String username = getAuthenticatedUsername();
			if (username == null) return Map.of("error", "User must be logged in to initiate payment.");
			return paymentService.createPayment(username);
		} catch (Exception e) {
			return Map.of("error", e.getMessage() != null ? e.getMessage() : "Failed to create payment");
		}
	}
	
	@Tool(description = "place the order with the current product")
	public Map<String,String> placeOrder(@ToolParam(description = "id of the product") int prodId, @ToolParam(description = "quantity of the product") int quantity) {
		try {
			String username = getAuthenticatedUsername();
			if (username == null) return Map.of("error", "User must be logged in to place order.");
			return paymentService.placeOrder(username, prodId, quantity);
		} catch (Exception e) {
			return Map.of("error", e.getMessage() != null ? e.getMessage() : "Failed to place order");
		}
	}
	
	@Tool(description = "cancel and refund the payment for an order")
	public Map<String, Object> refundOrder(@ToolParam(description = "id of the order") int orderId) {
		try {
			String username = getAuthenticatedUsername();
			if (username == null) return Map.of("error", "User must be logged in to refund order.");
			return paymentService.refund(orderId,username);
		} catch (Exception e) {
			return Map.of("error", e.getMessage() != null ? e.getMessage() : "Failed to refund order");
		}
	}
	
}
