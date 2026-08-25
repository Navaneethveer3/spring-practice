package com.springBoot.test.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import com.springBoot.test.Model.Order;
import com.springBoot.test.Model.UserPrincipal;
import com.springBoot.test.Service.OrderService;

@RestController
@RequestMapping("/orders")
@CrossOrigin("*")
public class OrderController {
	
	@Autowired
	private OrderService orderService;
	
	@PostMapping("/{orderId}")
	public ResponseEntity<?> cancelOrder(@AuthenticationPrincipal UserPrincipal principal, @PathVariable int orderId){
		if (principal == null) {
			return new ResponseEntity<>("User not authorized", HttpStatus.UNAUTHORIZED);
		}
		orderService.cancelOrder(principal.getUser(), orderId);
		return new ResponseEntity<>(HttpStatus.OK);
	}

	@PostMapping("/{orderId}/cancel")
	public ResponseEntity<?> cancelOrderExplicit(@AuthenticationPrincipal UserPrincipal principal, @PathVariable int orderId){
		if (principal == null) {
			return new ResponseEntity<>("User not authorized", HttpStatus.UNAUTHORIZED);
		}
		orderService.cancelOrder(principal.getUser(), orderId);
		return new ResponseEntity<>(HttpStatus.OK);
	}
	
	@GetMapping("/{orderId}")
	public ResponseEntity<?> getOrderById(@AuthenticationPrincipal UserPrincipal principal, @PathVariable int orderId){
		if (principal == null) {
			return new ResponseEntity<>("User not authorized", HttpStatus.UNAUTHORIZED);
		}
		Order order = orderService.getOrderById(principal.getUser(), orderId);
		if (order == null) {
			return new ResponseEntity<>("Order not found", HttpStatus.NOT_FOUND);
		}
		return new ResponseEntity<>(order, HttpStatus.OK);
	}

	@GetMapping
	public ResponseEntity<List<Order>> getAllOrders(@AuthenticationPrincipal UserPrincipal principal){
		if (principal == null) {
			return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
		}
		return new ResponseEntity<>(orderService.getAllOrders(principal.getUser()), HttpStatus.OK);
	}
	
}
