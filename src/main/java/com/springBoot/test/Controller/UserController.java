package com.springBoot.test.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.springBoot.test.Model.Users;
import com.springBoot.test.Service.UserService;

@RestController
public class UserController {
	
	@Autowired
	UserService service;
	
	private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
	
	@PostMapping("/register")
	public ResponseEntity<Users> register(@RequestBody Users user) {
		user.setPassword(encoder.encode(user.getPassword()));
		return new ResponseEntity<>(service.register(user), HttpStatus.OK);
	}
}
