package com.springBoot.test.Service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.springBoot.test.Model.CartItem;
import com.springBoot.test.Model.Order;
import com.springBoot.test.Model.OrderItem;
import com.springBoot.test.Model.Product;
import com.springBoot.test.Model.Users;
import com.springBoot.test.Repository.CartItemRepository;
import com.springBoot.test.Repository.OrderItemRepository;
import com.springBoot.test.Repository.OrderRepository;
import com.springBoot.test.Repository.ProductRepository;

import jakarta.transaction.Transactional;

@Service
public class OrderService {

	@Autowired
	OrderRepository orderRepo;
	
	
	@Transactional
	public void cancelOrder(Users user, int orderId) {
		orderRepo.deleteById(orderId);
	}
	
	public List<Order> getAllOrders(Users user){
		return orderRepo.findByUser(user);
	}
}
