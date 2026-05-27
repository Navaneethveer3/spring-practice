package com.springBoot.test.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;

import com.springBoot.test.Model.Users;
import com.springBoot.test.Service.UserService;

@RestController
public class UserController {
	
	@Autowired
	UserService service;
	
	private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
	
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
	
	@PostMapping("/reset-password/{id}")
	public ResponseEntity<Users> resetPassword(@PathVariable int id, @RequestPart("password") String password){
		return new ResponseEntity<>(service.resetPassword(id, password), HttpStatus.OK);
	}
	
}
