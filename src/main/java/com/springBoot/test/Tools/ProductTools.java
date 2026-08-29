package com.springBoot.test.Tools;

import java.util.List;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import com.springBoot.test.Model.Product;
import com.springBoot.test.Service.ProductService;

@Component
public class ProductTools {

	@Autowired
	private ProductService prodService;
	
	@Tool(description = "get the product details by ID")
	@Cacheable(key = "#prodId", value = "products")
	public Product getProductById(int prodId) {
		return prodService.getProductById(prodId);
	}
	
	@Tool(description = "search for the product")
	@Cacheable(key = "#keyword", value = "products")
	public List<Product> searchProduct(String keyword){
		return prodService.searchProduct(keyword);
	}
	
}
