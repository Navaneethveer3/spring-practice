package com.springBoot.test.Tools;

import java.util.List;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.springBoot.test.Model.Order;
import com.springBoot.test.Service.OrderService;

@Component
public class OrderTools {

	@Autowired
	private OrderService orderService;
	
	private String getAuthenticatedUsername() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
			throw new IllegalStateException("User must be logged in to initiate payment.");
		}
		return auth.getName();
	}
	
	@Tool(description = "get all the orders that are avaiable to refund for the logged in user")
	public List<Order> getAllOrder() throws Exception{
		String username = getAuthenticatedUsername();
		return orderService.getAllRefundableOrders(username);
	}
	
}
