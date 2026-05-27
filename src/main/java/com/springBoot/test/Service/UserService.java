package com.springBoot.test.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.springBoot.test.Model.Users;
import com.springBoot.test.Repository.UserRepo;

@Service
public class UserService {

	@Autowired
	UserRepo repo;
	
	@Autowired
	PasswordEncoder passwordEncoder;
	
	public Users register(Users user) throws Exception {
		if(repo.findByUsername(user.getUsername())!=null) {
			throw new Exception("Username already exists");
		}
		user.setPassword(passwordEncoder.encode(user.getPassword()));
		return repo.save(user);
	}
	
	public Users resetPassword(int id, String str) {
		Users curUser = repo.findById(id);
		if(curUser==null) {
			throw new UsernameNotFoundException("User doesn't exist");
		}
		curUser.setPassword(passwordEncoder.encode(str));
		return repo.save(curUser);
	}
}
