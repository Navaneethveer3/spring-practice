package com.springBoot.test.Service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.springBoot.test.DTO.InventoryDTO;
import com.springBoot.test.Model.OrderItem;
import com.springBoot.test.Model.Product;
import com.springBoot.test.Repository.ProductRepository;

@Service
public class InventoryService {

	@Autowired
	private ProductRepository prodRepo;
	
	@KafkaListener(topics = {"order-success", "place-order"}, groupId = "payment-service")
	public void updateInventory(InventoryDTO dto) throws Exception{
		int id = dto.getId();
		int quantity = dto.getQuantity();
		Product prod = prodRepo.findById(id).orElse(null);
		if(prod==null) {
			throw new Exception("Product not found");
		}
		if(prod.getQuantity()<quantity) {
			throw new Exception("Product doesn't has enough stock");
		}
		prod.setQuantity(prod.getQuantity()-quantity);
		prodRepo.save(prod);
	}
	
	@KafkaListener(topics = "order-cancel", groupId = "order-service")
	public void restoreInventory(InventoryDTO dto) throws Exception{
		int id = dto.getId();
		int quantity = dto.getQuantity();
		Product prod = prodRepo.findById(id).orElse(null);
		if(prod==null) {
			throw new Exception("Product not found");
		}
		prod.setQuantity(prod.getQuantity()+quantity);
		prodRepo.save(prod);
	}
	
	@KafkaListener(topics = "cancel-order", groupId = "payment-service")
	public void cancelOrder(List<InventoryDTO> dtoList) throws Exception{
		if(dtoList.isEmpty()) {
			throw new Exception("Order is Empty");
		}
		for(InventoryDTO dto : dtoList) {
			int id = dto.getId();
			int quantity = dto.getQuantity();
			Product product = prodRepo.findById(id).orElse(null);
			if(product==null) {					
				throw new Exception("Product not found");
			}
			product.setQuantity(product.getQuantity()+quantity);
			prodRepo.save(product);
		}
	}
	
}
