package com.springBoot.test.Service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.springBoot.test.Model.Order;
import com.springBoot.test.Model.OrderItem;
import com.springBoot.test.Model.Product;
import com.springBoot.test.Model.Status;
import com.springBoot.test.Model.Users;
import com.springBoot.test.Repository.OrderRepository;
import com.springBoot.test.Repository.ProductRepository;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class OrderService {

	@Autowired
	private OrderRepository orderRepo;
	
	@Autowired
	private ProductRepository prodRepo;
	
	@Transactional
	public void cancelOrder(Users user, int orderId) {
		Order order = orderRepo.findById(orderId).orElse(null);
		if (order != null && order.getUser() != null && order.getUser().getId().equals(user.getId())) {
			if (order.getStatus() == Status.PAID) {
				for (OrderItem item : order.getItem()) {
					Product prod = item.getProduct();
					if (prod != null) {
						prod.setQuantity(prod.getQuantity() + item.getQuantity());
						prodRepo.save(prod);
					}
				}
			}
			order.setStatus(Status.CANCELLED);
			orderRepo.save(order);
		}
	}
	
	public List<Order> getAllOrders(Users user){
		return orderRepo.findByUser(user);
	}

	public Order getOrderById(Users user, int orderId){
		Order order = orderRepo.findById(orderId).orElse(null);
		if (order != null && order.getUser() != null && order.getUser().getId().equals(user.getId())) {
			return order;
		}
		return null;
	}
	
	public List<Order> getAllOrders(){
		return orderRepo.findAll();
	}
	
}

