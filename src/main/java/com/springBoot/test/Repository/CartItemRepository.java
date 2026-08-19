package com.springBoot.test.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.springBoot.test.Model.CartItem;
import com.springBoot.test.Model.Product;
import com.springBoot.test.Model.Users;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Integer> {
	
	CartItem findByUserAndProduct(Users user, Product prod);
	
	@Query("SELECT DISTINCT c FROM CartItem c JOIN FETCH c.product WHERE c.user = :user")
	List<CartItem> findByUser(Users user);
	
	void deleteAllByUser(Users user);
}
