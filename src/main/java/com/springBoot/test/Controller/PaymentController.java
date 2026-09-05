package com.springBoot.test.Controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;

import com.springBoot.test.Model.Order;
import com.springBoot.test.Model.UserPrincipal;
import com.springBoot.test.Service.PaymentService;


@RestController
@RequestMapping("/payments")
@CrossOrigin("*")
public class PaymentController {

	@Autowired
	private PaymentService paymentService;
	
	@GetMapping("/key")
	public ResponseEntity<?> getPaymentKey(@AuthenticationPrincipal UserPrincipal principal) {
		if (principal == null) {
			return new ResponseEntity<>("User not authorized", HttpStatus.UNAUTHORIZED);
		}
		return ResponseEntity.ok(Map.of("keyId", paymentService.getApiKey()));
	}
	
	@PostMapping("/create-order")
	public ResponseEntity<?> createPaymentOrder(@AuthenticationPrincipal UserPrincipal principal){
		if(principal==null) {
			return new ResponseEntity<>("User not authorized", HttpStatus.UNAUTHORIZED);
		}
		try {
			Map<String,String> payload = paymentService.createPayment(principal.getUsername());
			return new ResponseEntity<>(payload, HttpStatus.OK);
		}
		catch(Exception e) {
			return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
		}
	}
	
	
	@PostMapping("/verify")
	public ResponseEntity<?> verifyPayment(@RequestBody Map<String,String> payload, @AuthenticationPrincipal UserPrincipal principal){
		if(principal==null) {
			return new ResponseEntity<>("User not authorized", HttpStatus.UNAUTHORIZED);
		}
		try {
			Order order = paymentService.verifyPayment(payload, principal.getUsername());
			return new ResponseEntity<>(order, HttpStatus.OK);
		}
		catch(Exception e) {
			return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
		}
	}
	
	@PostMapping("/create-order/{prodId}")
	public ResponseEntity<?> placeOrder(@AuthenticationPrincipal UserPrincipal principal, @PathVariable int prodId, @RequestParam int quantity){
		if(principal==null) {
			return new ResponseEntity<>("User not authorized", HttpStatus.UNAUTHORIZED);
		}
		try {
			Map<String,String> payload = paymentService.placeOrder(principal.getUsername(), prodId, quantity);
			return new ResponseEntity<>(payload, HttpStatus.OK);
		}
		catch(Exception e) {
			return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
		}
	}
	
	@PostMapping("/refund/{orderId}")
	public ResponseEntity<?> refundOrder(@AuthenticationPrincipal UserPrincipal principal, @PathVariable int orderId){
		if(principal==null) {
			return new ResponseEntity<>("User not authenticated", HttpStatus.UNAUTHORIZED);
		}
		try {
			String username = principal.getUsername();
			Map<String, Object> object = paymentService.refund(orderId, username);
			return new ResponseEntity<>(object, HttpStatus.OK);
		}
		catch(Exception e) {
			e.printStackTrace();
			return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
		}
	}
	
}
