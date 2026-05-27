package com.springBoot.test.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.springBoot.test.Service.*;
import com.springBoot.test.Model.*;

import java.util.List;


@RestController()
@RequestMapping("/products")
@CrossOrigin
public class HomeController {

	
	@Autowired
	ProductService ps;
	
	@GetMapping
	public List<Product> getProducts(){
		return ps.getProducts();
	}
	
	@GetMapping("/{id}")
	public ResponseEntity<Product> getProductById(@PathVariable int id) {
		Product prod = ps.getProductById(id);
		if(prod==null) {
			return new ResponseEntity<>(HttpStatus.NOT_FOUND);
		}
		return new ResponseEntity<>(prod,HttpStatus.OK);
	}
	
	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<?> addProduct(@RequestPart("prod") Product prod, @RequestPart("image") MultipartFile image) {
		try{
			Product pro = ps.addProduct(prod,image);
			return new ResponseEntity<>(pro,HttpStatus.CREATED);
		}
		catch(Exception e) {
			return new ResponseEntity<>(e.getMessage(),HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<Product> updateProduct(@RequestPart("prod") Product prod, @PathVariable("id") int id, @RequestPart(value = "image", required = false) MultipartFile image) {
		return new ResponseEntity<>(ps.updateProduct(prod,image),HttpStatus.OK);
	}
	
	@DeleteMapping("/{id}")
	public ResponseEntity<String> deleteProduct(@PathVariable int id) {
		return new ResponseEntity<>(ps.deleteProduct(id),HttpStatus.OK);
	}
	
	@GetMapping("/search")
	public ResponseEntity<List<Product>> searchProduct(@RequestParam String keyword){
		List<Product> products = ps.searchProduct(keyword);
		return new ResponseEntity<>(products,HttpStatus.OK);
	}
}
