package com.springBoot.test.Service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.springBoot.test.DTO.InventoryDTO;
import com.springBoot.test.Model.DeliveryStatus;
import com.springBoot.test.Model.Order;
import com.springBoot.test.Model.OrderItem;
import com.springBoot.test.Model.Product;
import com.springBoot.test.Model.Status;
import com.springBoot.test.Model.Users;
import com.springBoot.test.Repository.OrderRepository;
import com.springBoot.test.Repository.ProductRepository;
import com.springBoot.test.Repository.UserRepo;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class OrderService {

	@Autowired
	private OrderRepository orderRepo;
	
	@Autowired
	private UserRepo userRepo;
	
	@Autowired
	private KafkaTemplate<String, InventoryDTO> kafka;
	
	@Transactional
	public void cancelOrder(Users user, int orderId) {
		Order order = orderRepo.findById(orderId).orElse(null);
		if (order != null && order.getUser() != null && order.getUser().getId().equals(user.getId())) {
			if (order.getStatus() == Status.PAID) {
				for (OrderItem item : order.getItem()) {
					Product prod = item.getProduct();
					if (prod != null) {
						int prodId = prod.getId();
						int quantity = item.getQuantity();
						InventoryDTO dto = new InventoryDTO();
						dto.setId(prodId);
						dto.setQuantity(quantity);
						kafka.send("order-cancel", dto);
					}
				}
			}
			order.setStatus(Status.CANCELLED);
			order.setDelivery(DeliveryStatus.Cancelled);
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
	
	public List<Order> getAllRefundableOrders(String username) throws Exception{
		Users user = userRepo.findByUsername(username);
		if(user==null) {
			throw new Exception("User not authenticated");
		}
		Optional<List<Order>> orders = orderRepo.findByStatusAndDeliveryAndUser(Status.PAID, DeliveryStatus.Created, user);
		return orders.orElse(List.of());
	}
	
	public List<Order> getTop10DeliveredOrders(String username) throws Exception{
		Users user = userRepo.findByUsername(username);
		if(user==null) {
			throw new Exception("User not authenticated");
		}
		Optional<List<Order>> orders = orderRepo.findTop10ByDeliveryAndUser(DeliveryStatus.Delivered, user);
		return orders.get();
	}
	
}

