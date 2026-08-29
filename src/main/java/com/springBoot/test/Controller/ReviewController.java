package com.springBoot.test.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.springBoot.test.Model.Review;
import com.springBoot.test.Model.UserPrincipal;
import com.springBoot.test.Service.ReviewService;

@RestController
@RequestMapping("/products")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ReviewController {

	@Autowired
	private ReviewService reviewService;
	
	@PostMapping("/{prodId}/reviews")
	public ResponseEntity<?> createReview(
			@PathVariable int prodId,
			@RequestBody Review review,
			@AuthenticationPrincipal UserPrincipal principal) {
		if (principal == null) {
			return new ResponseEntity<>("Unauthorized: You must be logged in to leave a review", HttpStatus.UNAUTHORIZED);
		}
		try {
			String username = principal.getUsername();
			Review createdReview = reviewService.createReview(prodId, review, username);
			return new ResponseEntity<>(createdReview, HttpStatus.CREATED);
		} catch (Exception e) {
			return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
		}
	}
	
	@DeleteMapping("/reviews/{reviewId}")
	public ResponseEntity<?> deleteReview(
			@PathVariable int reviewId,
			@AuthenticationPrincipal UserPrincipal principal) {
		if (principal == null) {
			return new ResponseEntity<>("Unauthorized: You must be logged in to delete a review", HttpStatus.UNAUTHORIZED);
		}
		try {
			String username = principal.getUsername();
			reviewService.deleteReview(reviewId, username);
			return new ResponseEntity<>("Review deleted successfully", HttpStatus.OK);
		} catch (Exception e) {
			return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
		}
	}
	
	@GetMapping("/{prodId}/reviews")
	public ResponseEntity<?> getAllReviews(@PathVariable int prodId) {
		try {
			List<Review> reviews = reviewService.getAllReviews(prodId);
			return new ResponseEntity<>(reviews, HttpStatus.OK);
		} catch (Exception e) {
			return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
		}
	}
	
}
