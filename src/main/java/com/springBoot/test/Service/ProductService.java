package com.springBoot.test.Service;

import java.io.IOException;
import java.util.*;

import org.springframework.ai.document.Document;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.springBoot.test.Model.*;
import com.springBoot.test.Repository.*;

@Service
public class ProductService {

	@Autowired
	private ProductRepository repo;
	
	@Autowired
	private VectorStore vectorStore;
	
	@Transactional(readOnly = true)
	public List<Product> getProducts(){
		
		return repo.findAll();
	}
	
	@Transactional(readOnly = true)
	@Cacheable(key = "#prodId", value = "products")
	@Tool
	public Product getProductById(int prodId) {
		return repo.findById(prodId).orElse(null);
	}
	
	int MAX_FILE_SIZE = 200*1024;
	
	@Transactional
	public Product addProduct(Product prod, MultipartFile imageFile) throws IOException {
		if(imageFile != null && !imageFile.isEmpty()) {
			if(imageFile.getSize() > MAX_FILE_SIZE) {
				throw new RuntimeException("Image should be within 200KB");
			}
			prod.setImageName(imageFile.getOriginalFilename());
			prod.setImageType(imageFile.getContentType());
			prod.setImageData(imageFile.getBytes());
		}
		
		Product saved = repo.save(prod);
		
		try {
			String prodDetails = """
					product details :
						id : %s
						name : %s,
						price : %s,
						description : %s,
						brand : %s
					""".formatted(saved.getId(), saved.getName(), saved.getPrice(), saved.getDescription(), saved.getBrand());
			
			Document document = new Document(prodDetails);
			vectorStore.add(List.of(document));
		} catch (Exception e) {
			System.err.println("Warning: VectorStore indexing skipped for product " + saved.getId() + ": " + e.getMessage());
		}
		
		return saved;
	}
	
	@Transactional
	@CachePut(key = "#prod.id", value = "products")
	public Product updateProduct(Product prod, MultipartFile image) throws Exception {
		try {
			Product curProd = repo.findById(prod.getId()).orElse(null);
			if(curProd==null) {
				throw new Exception("Product doesn't exist");
			}
			if (image != null && !image.isEmpty()) {
				if(image!=null && image.getSize()>MAX_FILE_SIZE) {
					throw new RuntimeException("Image should be within 200KB");
				}
				curProd.setImageName(image.getOriginalFilename());
				curProd.setImageType(image.getContentType());
				curProd.setImageData(image.getBytes());
				
			}
			if(prod.getName()!=null) {
				curProd.setName(prod.getName());
			}
			if(prod.getBrand()!=null) {
				curProd.setBrand(prod.getBrand());
			}
			if(prod.getDescription()!=null) {
				curProd.setDescription(prod.getDescription());
			}
			if(prod.getPrice()!=null) {
				curProd.setPrice(prod.getPrice());
			}
			if(prod.getQuantity()!=null) {
				curProd.setQuantity(prod.getQuantity());
			}
			if(prod.getLaunchDate()!=null) {
				curProd.setLaunchDate(prod.getLaunchDate());
			}
			return repo.save(curProd);
		}
		catch(Exception e) {
			return null;
		}
	}
	
	@CacheEvict(key = "#prodId", value = "products")
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
	@Cacheable(key = "#keyword", value = "products")
	public List<Product> searchProduct(String keyword) {
		return repo.searchProduct(keyword);
	}
}
