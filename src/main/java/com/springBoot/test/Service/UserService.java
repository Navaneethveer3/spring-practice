package com.springBoot.test.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.springBoot.test.Model.Users;
import com.springBoot.test.Repository.UserRepo;

@Service
public class UserService {

	@Autowired
	UserRepo repo;
	
	public Users register(Users user) {
		return repo.save(user);
	}
}
