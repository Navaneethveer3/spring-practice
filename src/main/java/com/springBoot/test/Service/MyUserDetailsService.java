package com.springBoot.test.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.springBoot.test.Model.UserPrincipal;
import com.springBoot.test.Model.Users;
import com.springBoot.test.Repository.UserRepo;

@Service
public class MyUserDetailsService implements UserDetailsService{

	@Autowired
	private UserRepo repo;
	
	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		Users user = repo.findByUsername(username);
		if(user==null) {
			throw new UsernameNotFoundException("User not found");
		}
		return new UserPrincipal(user);
	}

	
}
