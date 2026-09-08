package com.springBoot.test.Service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.springBoot.test.Model.Order;
import com.springBoot.test.Model.SuccessfulOrders;
import com.springBoot.test.Repository.SuccessfulOrdersRepository;

@Service
public class SuccessfulOrdersService {

	@Autowired
	private SuccessfulOrdersRepository successfulOrderRepo;
	
	@KafkaListener(topics = "placed-order", groupId = "payment-service")
	public void saveOrder(Order order) throws Exception{
		try {
			SuccessfulOrders successOrder = new SuccessfulOrders();
			successOrder.setOrder(order);
			successfulOrderRepo.save(successOrder);
		}
		catch(Exception e) {
			throw new Exception(e.getMessage());
		}
	}
	
	public List<SuccessfulOrders> getAllOrders(){
		return successfulOrderRepo.findAll();
	}
	
}
