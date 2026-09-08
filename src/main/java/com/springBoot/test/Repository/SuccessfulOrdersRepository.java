package com.springBoot.test.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.springBoot.test.Model.SuccessfulOrders;

@Repository
public interface SuccessfulOrdersRepository extends JpaRepository<SuccessfulOrders, Integer>{
	
}
