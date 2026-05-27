package com.springBoot.test.Service;

import java.io.IOException;
import java.util.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.springBoot.test.Model.*;
import com.springBoot.test.Repository.*;

@Service
public class ProductService {

	@Autowired
	private ProductRepository repo;
	
	
	@Transactional(readOnly = true)
	public List<Product> getProducts(){
		
		return repo.findAll();
	}
	
	@Transactional(readOnly = true)
	public Product getProductById(int prodId) {
		return repo.findById(prodId).orElse(null);
	}
	
	int MAX_FILE_SIZE = 200*1024;
	
	@Transactional
	public Product addProduct(Product prod, MultipartFile imageFile) throws IOException {
		if(imageFile!=null && imageFile.getSize()>MAX_FILE_SIZE) {
			throw new RuntimeException("Image should be within 200KB");
		}
		prod.setImageName(imageFile.getOriginalFilename());
		prod.setImageType(imageFile.getContentType());
		prod.setImageData(imageFile.getBytes());
		return repo.save(prod);
	}
	
	@Transactional
	public Product updateProduct(Product prod, MultipartFile image) {
		
		try {
			if (image != null && !image.isEmpty()) {
				if(image!=null && image.getSize()>MAX_FILE_SIZE) {
					throw new RuntimeException("Image should be within 200KB");
				}
				prod.setImageName(image.getOriginalFilename());
				prod.setImageType(image.getContentType());
				prod.setImageData(image.getBytes());
				
			}
			repo.save(prod);
			return prod;
		}
		catch(Exception e) {
			return null;
		}
	}
	
	public String deleteProduct(int prodId) {
		
		try {
			if(!repo.existsById(prodId)) {
				return "Product doesn't exist";
			}
			repo.deleteById(prodId);
			return "Product deleted successfully!";
		}
		catch(Exception e) {
			return e.toString();
		}
	}

	@Transactional(readOnly = true)
	public List<Product> searchProduct(String keyword) {
		return repo.searchProduct(keyword);
	}
}
