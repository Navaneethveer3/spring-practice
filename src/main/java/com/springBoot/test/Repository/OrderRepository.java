package com.springBoot.test.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.springBoot.test.Model.Order;
import com.springBoot.test.Model.Users;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
	
	@Query("SELECT DISTINCT o FROM Order o JOIN FETCH o.item i JOIN FETCH i.product WHERE o.user = :user")
	List<Order> findByUser(Users user);
}
