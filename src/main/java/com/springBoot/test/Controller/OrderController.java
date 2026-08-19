package com.springBoot.test.Controller;

import java.security.Principal;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import com.springBoot.test.Model.Order;
import com.springBoot.test.Model.UserPrincipal;
import com.springBoot.test.Model.Users;
import com.springBoot.test.Repository.UserRepo;
import com.springBoot.test.Service.OrderService;

@RestController
@RequestMapping("/orders")
@CrossOrigin("*")
public class OrderController {
	
	@Autowired
	OrderService orderService;
	
	@Autowired
	UserRepo userRepo;
	
	@PostMapping("/{orderId}")
	public ResponseEntity<?> cancelOrder(@AuthenticationPrincipal UserPrincipal principal, @PathVariable int orderId){
		orderService.cancelOrder(principal.getUser(), orderId);
		return new ResponseEntity<>(HttpStatus.OK);
	}
	
	@GetMapping
	public ResponseEntity<List<Order>> getAllOrders(@AuthenticationPrincipal UserPrincipal principal){
		return new ResponseEntity<>(orderService.getAllOrders(principal.getUser()), HttpStatus.OK);
	}
	
}
