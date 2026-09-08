package com.springBoot.test.Model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class SuccessfulOrders {

	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;
	
	private Order order;

	public Integer getId() {
		return id;
	}

	public void setId(Integer id) {
		this.id = id;
	}

	public Order getOrder() {
		return order;
	}

	public void setOrder(Order order) {
		this.order = order;
	}
	
	
	
}
