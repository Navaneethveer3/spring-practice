package com.springBoot.test.Controller;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;

import com.springBoot.test.Model.RefreshToken;
import com.springBoot.test.Model.Users;
import com.springBoot.test.Service.JWTService;
import com.springBoot.test.Service.RefreshTokenService;
import com.springBoot.test.Service.UserService;

@RestController
public class UserController {
	
	@Autowired
	UserService service;
	
	@Autowired
	RefreshTokenService tokenService;
	
	@Autowired
	JWTService jwtService;

	
	@PostMapping("/register")
	public ResponseEntity<?> register(@RequestBody Users user) throws Exception {
		try {
			Users u = service.register(user);
			return new ResponseEntity<>(u, HttpStatus.OK);
		}
		catch(Exception e) {
			return new ResponseEntity<>(e.getMessage(),HttpStatus.ALREADY_REPORTED);
		}
	}
	
	@PostMapping("/reset-password")
	public ResponseEntity<Users> resetPassword(Principal principal, @RequestBody Users user){
		String username = principal.getName();
		return new ResponseEntity<>(service.resetPassword(username, user.getPassword()), HttpStatus.OK);
	}
	
	
	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody Users user) throws Exception{
		try {
			String accessToken = service.login(user);
			RefreshToken refreshToken = tokenService.createRefreshToken(user.getUsername());
			Map<String, String> tokens = new HashMap<>();
			tokens.put("accessToken", accessToken);
			tokens.put("refreshToken", refreshToken.getToken());
			
			return new ResponseEntity<>(tokens,HttpStatus.OK);
		}
		catch(Exception e) {
			return new ResponseEntity<>(e.getMessage(),HttpStatus.UNAUTHORIZED);
		}
	}
	
	
	@PostMapping("/refresh")
	public ResponseEntity<?> refreshToken(@RequestBody Map<String,String> request){
		String requestRefreshToken = request.get("refreshToken");
		
		return tokenService.findByToken(requestRefreshToken)
				.map(tokenService::verifyExpiration)
				.map(RefreshToken::getUser)
				.map(user->{
					String accessToken = jwtService.generateToken(user.getUsername());
					Map<String, String> response = new HashMap<>();
					response.put("accessToken", accessToken);
					response.put("refreshToken", requestRefreshToken);
					return new ResponseEntity<>(response, HttpStatus.OK);
				}).orElseThrow(() -> new RuntimeException("Refresh token not in database!"));
				
	}
	
	
	@PostMapping("/logout")
	public ResponseEntity<?> logout(@RequestBody Map<String, String> token){
		String requestRefreshToken = token.get("refreshToken");
		return new ResponseEntity<>(service.logout(requestRefreshToken), HttpStatus.OK);
	}
}
