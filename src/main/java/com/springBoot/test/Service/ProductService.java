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
		
		if (prod.getPayments() != null) {
			prod.getPayments().forEach(payment -> payment.setProduct(prod));
		}
		
		Product saved = repo.save(prod);
		
		try {
			StringBuilder paymentText = new StringBuilder();
			if (saved.getPayments() != null && !saved.getPayments().isEmpty()) {
				paymentText.append("\nPayment Options & Offers:\n");
				for (PaymentOptions opt : saved.getPayments()) {
					if (opt.getEMI() != null) paymentText.append(" - EMI Options: ").append(opt.getEMI()).append("\n");
					if (opt.getDebit() != null) paymentText.append(" - Debit Card Offers: ").append(opt.getDebit()).append("\n");
					if (opt.getCredit() != null) paymentText.append(" - Credit Card Offers: ").append(opt.getCredit()).append("\n");
				}
			}

			String prodDetails = """
					Product Details:
					ID: %s
					Name: %s
					Price: %s
					Brand: %s
					Description: %s
					%s
					""".formatted(saved.getId(), saved.getName(), saved.getPrice(), saved.getBrand(), saved.getDescription(), paymentText.toString());
			
			Document document = new Document(prodDetails, Map.of("productId", saved.getId()));
			vectorStore.add(List.of(document));
		} catch (Exception e) {
			System.err.println("Warning: VectorStore indexing skipped for product " + saved.getId() + ": " + e.getMessage());
		}
		
		return saved;
	}
	
	@Transactional
	@CacheEvict(key = "#prod.id", value = "products")
	public Product updateProduct(Product prod, MultipartFile image) throws Exception {
		try {
			Product curProd = repo.findById(prod.getId()).orElse(null);
			if(curProd==null) {
				throw new Exception("Product doesn't exist");
			}
			if (image != null && !image.isEmpty()) {
				if(image.getSize()>MAX_FILE_SIZE) {
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
			if(prod.getPayments()!=null) {
				curProd.updatePayments(prod.getPayments());
			}
			Product saved = repo.save(curProd);

			try {
				StringBuilder paymentText = new StringBuilder();
				if (saved.getPayments() != null && !saved.getPayments().isEmpty()) {
					paymentText.append("\nPayment Options & Offers:\n");
					for (PaymentOptions opt : saved.getPayments()) {
						if (opt.getEMI() != null) paymentText.append(" - EMI Options: ").append(opt.getEMI()).append("\n");
						if (opt.getDebit() != null) paymentText.append(" - Debit Card Offers: ").append(opt.getDebit()).append("\n");
						if (opt.getCredit() != null) paymentText.append(" - Credit Card Offers: ").append(opt.getCredit()).append("\n");
					}
				}

				String prodDetails = """
						Product Details:
						ID: %s
						Name: %s
						Price: %s
						Brand: %s
						Description: %s
						%s
						""".formatted(saved.getId(), saved.getName(), saved.getPrice(), saved.getBrand(), saved.getDescription(), paymentText.toString());
				
				Document document = new Document(prodDetails, Map.of("productId", saved.getId()));
				vectorStore.add(List.of(document));
			} catch (Exception ex) {
				System.err.println("Warning: VectorStore indexing skipped for product update " + saved.getId() + ": " + ex.getMessage());
			}

			return saved;
		}
		catch(Exception e) {
			e.printStackTrace();
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
