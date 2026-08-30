package com.springBoot.test.Service;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.springBoot.test.Model.CartItem;
import com.springBoot.test.Model.Order;
import com.springBoot.test.Model.OrderItem;
import com.springBoot.test.Model.Product;
import com.springBoot.test.Model.Users;
import com.springBoot.test.Repository.CartItemRepository;
import com.springBoot.test.Repository.OrderRepository;
import com.springBoot.test.Repository.ProductRepository;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class CartService {
	
	@Autowired
	private CartItemRepository cartRepo;
	
	@Autowired
	private ProductRepository prodRepo;
	
	@Autowired
	private OrderRepository orderRepo;
	
	@Caching(
		evict = {
				@CacheEvict(key = "#user.id", value = "cartitems"),
				@CacheEvict(key = "#user.id", value = "double")
		}
	)
	public CartItem add(Users user, int prodId) throws Exception {
		Product product = prodRepo.findById(prodId).orElseThrow(()->new Exception("Product not found"));
		CartItem existingCart = cartRepo.findByUserAndProduct(user, product);
		if(existingCart!=null) {
			existingCart.setQuantity(existingCart.getQuantity()+1);
			return cartRepo.save(existingCart);
		}
		else {
			CartItem cart = new CartItem();
			cart.setProduct(product);
			cart.setUser(user);
			cart.setQuantity(1);
			return cartRepo.save(cart);
		}
	}
	
	@Caching(
			evict = {
					@CacheEvict(key = "#user.id", value = "cartitems"),
					@CacheEvict(key = "#user.id", value = "double")
			}
		)
	public void remove(Users user, int prodId) throws Exception {
		Product prod = prodRepo.findById(prodId).orElseThrow(()->new Exception("Product not found"));
		CartItem existingCart = cartRepo.findByUserAndProduct(user, prod);
		if(existingCart!=null) {
			if(existingCart.getQuantity()>1) {
				existingCart.setQuantity(existingCart.getQuantity()-1);
				cartRepo.save(existingCart);
			}
			else {
				cartRepo.delete(existingCart);
			}
		}
	}
	
	@Cacheable(key = "#user.id", value = "double")
	public Double getCartValue(Users user) {
		List<CartItem> cart = this.getCart(user);
		Double value = 0.0;
		for(CartItem item : cart) {
			value += (item.getProduct().getPrice()*item.getQuantity());
		}
		return value;
	}
	
	@Cacheable(key = "#user.id", value = "cartitems")
	public List<CartItem> getCart(Users user) {
		return cartRepo.findByUser(user);
	}
	
	
	@Caching(
			evict = {
					@CacheEvict(key = "#user.id", value = "cartitems"),
					@CacheEvict(key = "#user.id", value = "double")
			}
		)
	public void clearCart(Users user) {
		cartRepo.deleteAllByUser(user);
	}
}
