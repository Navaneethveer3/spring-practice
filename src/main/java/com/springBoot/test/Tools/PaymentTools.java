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
			throw new IllegalStateException("User must be logged in to initiate payment.");
		}
		return auth.getName();
	}
	
	@Tool(description = "create a payment order to place the order with the items in the cart")
	public Map<String,String> createPayment() throws Exception {
		String username = getAuthenticatedUsername();
		return paymentService.createPayment(username);
	}
	
	@Tool(description = "place the order with the current product")
	public Map<String,String> placeOrder(@ToolParam(description = "id of the product") int prodId, @ToolParam(description = "quantity of the product") int quantity) throws Exception {
		String username = getAuthenticatedUsername();
		return paymentService.placeOrder(username, prodId, quantity);
	}
	
	@Tool(description = "refund the payment for an order")
	public Map<String, Object> refundOrder(@ToolParam(description = "id of the order") int orderId) throws Exception{
		String username = getAuthenticatedUsername();
		return paymentService.refund(orderId,username);
	}
	
}
