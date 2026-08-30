package com.springBoot.test.Service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.springBoot.test.Model.Profile;
import com.springBoot.test.Model.Users;
import com.springBoot.test.Repository.ProfileRepository;
import com.springBoot.test.Repository.RefreshTokenRepo;
import com.springBoot.test.Repository.UserRepo;

@Service
public class UserService {

	@Autowired
	UserRepo repo;
	
	@Autowired
	PasswordEncoder passwordEncoder;
	
	@Autowired
	AuthenticationManager authManager;
	
	@Autowired
	RefreshTokenService tokenService;
	
	@Autowired
	RefreshTokenRepo tokenRepo;
	
	@Autowired
	ProfileRepository profileRepo;
	
	@Autowired
	JWTService jwt;
	
	public Users register(Users user) throws Exception {
		if(repo.findByUsername(user.getUsername())!=null) {
			throw new Exception("Username already exists");
		}
		user.setPassword(passwordEncoder.encode(user.getPassword()));
		user.setRole("USER");
		Profile profile = new Profile();
		profile.setUsername(user.getUsername());
		profile.setUser(user);
		profileRepo.save(profile);
		return repo.save(user);
	}
	
	@CacheEvict(key = "#username", value = "users")
	public Users resetPassword(String username, String str) {
		Users curUser = repo.findByUsername(username);
		if(curUser==null) {
			throw new UsernameNotFoundException("User doesn't exist");
		}
		curUser.setPassword(passwordEncoder.encode(str));
		return repo.save(curUser);
	}
	
	@Cacheable(key = "#user.username", value = "users")
	public String login(Users user) throws Exception{
		Authentication authentication = authManager.authenticate(new UsernamePasswordAuthenticationToken(user.getUsername(), user.getPassword()));
		if(authentication.isAuthenticated()) {
			
			return jwt.generateToken(user.getUsername());
		}
		else {
			throw new Exception("check username and password");
		}
	}
	
	public String logout(String refreshToken) {
		tokenService.findByToken(refreshToken).ifPresent(token->{
			tokenRepo.delete(token);
		});
		return "Logged out successfully";
	}
	
}
