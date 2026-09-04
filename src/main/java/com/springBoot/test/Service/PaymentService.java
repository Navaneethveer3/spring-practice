package com.springBoot.test.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.razorpay.RazorpayClient;
import com.razorpay.Refund;
import com.razorpay.Utils;
import com.springBoot.test.DTO.InventoryDTO;
import com.springBoot.test.Model.CartItem;
import com.springBoot.test.Model.DeliveryStatus;
import com.springBoot.test.Model.Order;
import com.springBoot.test.Model.OrderItem;
import com.springBoot.test.Model.Product;
import com.springBoot.test.Model.Status;
import com.springBoot.test.Model.Users;
import com.springBoot.test.Repository.CartItemRepository;
import com.springBoot.test.Repository.OrderRepository;
import com.springBoot.test.Repository.ProductRepository;
import com.springBoot.test.Repository.UserRepo;

import jakarta.transaction.Transactional;

@Service
public class PaymentService {

	@Autowired
	private OrderRepository orderRepo;

	@Autowired
	private CartItemRepository cartRepo;

	@Autowired
	private CartService cartService;

	@Autowired
	private UserRepo userRepo;

	@Autowired
	private ProductRepository prodRepo;

	@Autowired
	private RazorpayClient razorpayClient;

	@Value("${razorpay.api.key}")
	private String apiKey;

	@Value("${razorpay.api.secret}")
	private String apiSecret;

	@Autowired
	private KafkaTemplate<String, InventoryDTO> kafka;
	
	@Autowired
	private KafkaTemplate<String, List<InventoryDTO>> refundKafka;

	@Transactional
	public Map<String, String> createPayment(String username) throws Exception {
		Users user = userRepo.findByUsername(username);
		if (user == null) {
			throw new Exception("User not authenticated");
		}
		List<CartItem> cart = cartRepo.findByUser(user);
		if (cart == null || cart.isEmpty()) {
			throw new Exception("Cart is empty");
		}
		double cartValue = cartService.getCartValue(user);
		long convertedAmount = (long) Math.round(cartValue * 100);
		JSONObject orderRequest = new JSONObject();
		orderRequest.put("amount", convertedAmount);
		orderRequest.put("currency", "INR");
		orderRequest.put("receipt", "txn_" + user.getUsername() + System.currentTimeMillis());

		com.razorpay.Order razorpayOrder = razorpayClient.orders.create(orderRequest);

		Order order = new Order();
		order.setUser(user);
		order.setPrice((int) cartValue);
		order.setStatus(Status.PENDING);
		order.setDelivery(DeliveryStatus.Created);
		order.setRazorpayOrderId(razorpayOrder.get("id"));
		for (CartItem item : cart) {
			OrderItem orderItem = new OrderItem();
			orderItem.setOrder(order);
			orderItem.setProduct(item.getProduct());
			orderItem.setQuantity(item.getQuantity());
			order.getItem().add(orderItem);
		}
		Order savedOrder = orderRepo.save(order);
		Map<String, String> payload = new HashMap<>();
		payload.put("razorpayOrderId", razorpayOrder.get("id"));
		payload.put("amount", Long.toString(convertedAmount));
		payload.put("currency", "INR");
		payload.put("keyId", apiKey);
		payload.put("orderId", Integer.toString(savedOrder.getId()));
		return payload;
	}

	@Transactional
	public Order verifyPayment(Map<String, String> payload, String username) throws Exception {
		Users user = userRepo.findByUsername(username);
		if (user == null) {
			throw new Exception("User not authenticated");
		}
		String razorpayOrderId = payload.get("razorpay_order_id");
		String razorpayPaymentId = payload.get("razorpay_payment_id");
		String razorpaySignature = payload.get("razorpay_signature");
		Order pendingOrder = orderRepo.findByRazorpayOrderId(razorpayOrderId).orElse(null);
		if (pendingOrder == null) {
			throw new Exception("Order not found or may be expired");
		}
		JSONObject json = new JSONObject();
		json.put("razorpay_order_id", razorpayOrderId);
		json.put("razorpay_payment_id", razorpayPaymentId);
		json.put("razorpay_signature", razorpaySignature);
		boolean isValid = Utils.verifyPaymentSignature(json, apiSecret);
		if (isValid) {
			pendingOrder.setStatus(Status.PAID);
			pendingOrder.setRazorpayOrderId(razorpayOrderId);
			pendingOrder.setRazorpayPaymentId(razorpayPaymentId);
			pendingOrder.setRazorpaySignature(razorpaySignature);
			for (OrderItem item : pendingOrder.getItem()) {
				Product prod = item.getProduct();
				int prodId = prod.getId();
				int quantity = item.getQuantity();
				InventoryDTO dto = new InventoryDTO();
				dto.setId(prodId);
				dto.setQuantity(quantity);
				kafka.send("order-success", dto);
			}
			cartRepo.deleteAllByUser(user);
			cartService.clearCart(user);
			return orderRepo.save(pendingOrder);
		} else {
			pendingOrder.setStatus(Status.FAILED);
			pendingOrder.setDelivery(DeliveryStatus.Cancelled);
			orderRepo.save(pendingOrder);
			throw new Exception("Payment verification failed");
		}
	}

	@Transactional
	public Map<String, String> placeOrder(String username, int prodId, int quantity) throws Exception {
		Users user = userRepo.findByUsername(username);
		if (user == null) {
			throw new Exception("User not authenticated");
		}
		Product product = prodRepo.findById(prodId).orElse(null);
		if (product == null) {
			throw new Exception("Product not found");
		}
		double orderValue = product.getPrice() * quantity;
		long convertedAmount = (long) Math.round(orderValue * 100);
		JSONObject orderRequest = new JSONObject();
		orderRequest.put("amount", convertedAmount);
		orderRequest.put("currency", "INR");
		orderRequest.put("receipt", "txn_" + user.getUsername() + System.currentTimeMillis());

		com.razorpay.Order razorpayOrder = razorpayClient.orders.create(orderRequest);

		Order order = new Order();
		order.setUser(user);
		order.setPrice((int) orderValue);
		order.setStatus(Status.PENDING);
		order.setDelivery(DeliveryStatus.Created);
		order.setRazorpayOrderId(razorpayOrder.get("id"));
		OrderItem item = new OrderItem();
		item.setOrder(order);
		item.setProduct(product);
		item.setQuantity(quantity);
		order.getItem().add(item);
		InventoryDTO dto = new InventoryDTO();
		dto.setId(prodId);
		dto.setQuantity(quantity);
		kafka.send("place-order", dto);
		Order savedOrder = orderRepo.save(order);
		Map<String, String> payload = new HashMap<>();
		payload.put("razorpayOrderId", razorpayOrder.get("id"));
		payload.put("amount", Long.toString(convertedAmount));
		payload.put("currency", "INR");
		payload.put("keyId", apiKey);
		payload.put("orderId", Integer.toString(savedOrder.getId()));
		return payload;
	}
	
	@Transactional
	public Map<String, Object> refund(int orderId, String username) throws Exception{
		Order order = orderRepo.findById(orderId).orElse(null);
		if(order==null) {
			throw new Exception("Order doesn't exist");
		}
		Users user = userRepo.findByUsername(username);
		if(user==null) {
			throw new Exception("User is not authenticated");
		}
		if(!order.getUser().getId().equals(user.getId())) {
			throw new Exception("Unauthorized to refund this order");
		}
		if(order.getStatus()!=Status.PAID || order.getRazorpayPaymentId()==null) {
			throw new Exception("Can not initiate refund on this order");
		}
		long convertedAmount = (long) Math.round(order.getPrice()*100);
		
		JSONObject refundObject = new JSONObject();
		refundObject.put("amount", convertedAmount);
		refundObject.put("speed", "normal");
		
		JSONObject notes = new JSONObject();
		notes.put("orderId", String.valueOf(order.getId()));
		notes.put("username", username);
		refundObject.put("notes", notes);
		
		Refund refund = razorpayClient.payments.refund(order.getRazorpayPaymentId(), refundObject);
		
		List<InventoryDTO> dtoList = new ArrayList<>();
		for(OrderItem item : order.getItem()) {
			if(item.getProduct()!=null) {
				InventoryDTO dto = new InventoryDTO();
				dto.setId(item.getProduct().getId());
				dto.setQuantity(item.getQuantity());
				dtoList.add(dto);
			}
		}
		refundKafka.send("cancel-order", dtoList);
		order.setStatus(Status.REFUNDED);
		order.setDelivery(DeliveryStatus.Cancelled);
		orderRepo.save(order);
		
		Map<String, Object> response = new HashMap<>();
		response.put("refundId", refund.get("id"));
		response.put("status", refund.get("status"));
		response.put("amount", refund.get("amount"));
		response.put("orderId", order.getId());
		response.put("message", "Refund processed successfully");
		return response;
	}

}
