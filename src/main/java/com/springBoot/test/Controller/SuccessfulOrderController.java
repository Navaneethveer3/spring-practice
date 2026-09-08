package com.springBoot.test.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.springBoot.test.Model.SuccessfulOrders;
import com.springBoot.test.Service.SuccessfulOrdersService;

@RestController
@RequestMapping("/successful-orders")
public class SuccessfulOrderController {

	@Autowired
	private SuccessfulOrdersService service;
	
	@GetMapping
	public ResponseEntity<?> getAllOrder() throws Exception{
		try {
			List<SuccessfulOrders> orders = service.getAllOrders();
			return new ResponseEntity<>(orders, HttpStatus.OK);
		}
		catch(Exception e) {
			throw new Exception(e.getMessage());
		}
	}
	
}
