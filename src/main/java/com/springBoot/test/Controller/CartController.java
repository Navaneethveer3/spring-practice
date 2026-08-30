package com.springBoot.test.Controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import com.springBoot.test.Model.CartItem;
import com.springBoot.test.Model.UserPrincipal;
import com.springBoot.test.Model.Order;
import com.springBoot.test.Model.Product;
import com.springBoot.test.Model.Users;
import com.springBoot.test.Service.CartService;

@RestController
@RequestMapping("/cart")
@CrossOrigin("*")
public class CartController {
	
	@Autowired
	CartService cartService;
	
	@PostMapping("/add")
	public ResponseEntity<CartItem> addToCart(@AuthenticationPrincipal UserPrincipal principal, @RequestParam int productId) throws Exception{
		return new ResponseEntity<>(cartService.add(principal.getUser(), productId),HttpStatus.OK);
	}
	
	@DeleteMapping("/delete")
	public ResponseEntity<?> delete(@AuthenticationPrincipal UserPrincipal principal, @RequestParam int prodId) throws Exception{
		cartService.remove(principal.getUser(), prodId);
		return new ResponseEntity<>(HttpStatus.OK);
	}
	
	@GetMapping("/get-cart-value")
	public ResponseEntity<Double> getCartValue(@AuthenticationPrincipal UserPrincipal principal){
		return new ResponseEntity<>(cartService.getCartValue(principal.getUser()), HttpStatus.OK);
	}
	
	@GetMapping
	public ResponseEntity<java.util.List<CartItem>> getCart(@AuthenticationPrincipal UserPrincipal principal){
		return new ResponseEntity<>(cartService.getCart(principal.getUser()), HttpStatus.OK);
	}
	
	
	@PostMapping("/clear-cart")
	public ResponseEntity<?> clearCart(@AuthenticationPrincipal UserPrincipal principal){
		cartService.clearCart(principal.getUser());
		return new ResponseEntity<>(HttpStatus.OK);
	}
}
