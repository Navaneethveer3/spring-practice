package com.springBoot.test.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.springBoot.test.Model.*;
import java.util.*;


@Repository
public interface ProductRepository extends JpaRepository<Product,Integer>{
	
	@Query("SELECT p FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :keyword, '%'))")
	List<Product> searchProduct(@Param("keyword") String keyword);
}
