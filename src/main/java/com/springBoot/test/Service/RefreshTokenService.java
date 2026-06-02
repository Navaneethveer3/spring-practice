package com.springBoot.test.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.springBoot.test.Model.RefreshToken;
import com.springBoot.test.Repository.RefreshTokenRepo;
import com.springBoot.test.Repository.UserRepo;

@Service
public class RefreshTokenService {

	@Autowired
	RefreshTokenRepo tokenRepo;
	
	@Autowired
	UserRepo userRepo;
	
	public RefreshToken createRefreshToken(String username) {
		RefreshToken refreshToken = new RefreshToken();
		refreshToken.setUser(userRepo.findByUsername(username));
		refreshToken.setToken(UUID.randomUUID().toString());
		refreshToken.setExpiryDate(Instant.now().plusMillis(600000*100));
		
		return tokenRepo.save(refreshToken);
	}
	
	public Optional<RefreshToken> findByToken(String token){
		return tokenRepo.findByToken(token);
	}
	
	public RefreshToken verifyExpiration(RefreshToken token) {
		if(token.getExpiryDate().compareTo(Instant.now())<0) {
			tokenRepo.delete(token);
			throw new RuntimeException("Refresh token was expired. Please make a new sign in request");
		}
		return token;
	}
}
