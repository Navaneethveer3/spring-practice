package com.springBoot.test.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.springBoot.test.Model.Product;
import com.springBoot.test.Model.Review;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Integer> {

	public List<Review> findAllByProduct(Product prod);
	
}
