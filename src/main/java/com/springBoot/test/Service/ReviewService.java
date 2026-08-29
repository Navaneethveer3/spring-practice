package com.springBoot.test.Service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.springBoot.test.Model.Product;
import com.springBoot.test.Model.Profile;
import com.springBoot.test.Model.Review;
import com.springBoot.test.Repository.ProductRepository;
import com.springBoot.test.Repository.ProfileRepository;
import com.springBoot.test.Repository.ReviewRepository;

@Service
public class ReviewService {
	
	@Autowired
	private ReviewRepository reviewRepo;

	@Autowired
	private ProductRepository prodRepo;
	
	@Autowired
	private ProfileRepository profileRepo;
	
	@Transactional
	public Review createReview(int prodId, Review review, String username) throws Exception {
		Product prod = prodRepo.findById(prodId).orElse(null);
		if(prod==null) {
			throw new Exception("Product not found");
		}
		Profile profile = profileRepo.findByUsername(username);
		if(profile==null) {
			throw new Exception("Profile doesn't exist");
		}
		review.setProduct(prod);
		review.setProfile(profile);
		return reviewRepo.save(review);
	}
	
	@Transactional
	public void deleteReview(int reviewId, String username) throws Exception {
		Review review = reviewRepo.findById(reviewId).orElse(null);
		if(review==null) {
			throw new Exception("Review doesn't exist");
		}
		if(!review.getProfile().getUsername().equals(username)) {
			throw new Exception("You are not allowed to delete this review");
		}
		reviewRepo.deleteById(reviewId);
	}
	
	@Transactional(readOnly = true)
	public List<Review> getAllReviews(int prodId) throws Exception{
		Product prod = prodRepo.findById(prodId).orElse(null);
		if(prod==null) {
			throw new Exception("Product doesn't exist");
		}
		return reviewRepo.findAllByProduct(prod);
	}
	
}
