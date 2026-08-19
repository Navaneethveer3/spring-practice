package com.springBoot.test.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.springBoot.test.Model.Users;
import com.springBoot.test.Repository.UserRepo;

@Configuration
public class AdminSeeder {

	@Autowired
	private UserRepo userRepo;
	
	@Bean
	CommandLineRunner initDB(BCryptPasswordEncoder encoder) {
		return args ->{
			if(userRepo.findByUsername("Admin")==null) {
				Users admin = new Users();
				admin.setUsername("Admin");
				admin.setPassword(encoder.encode("Navaneethveer"));
				admin.setRole("ADMIN");
				userRepo.save(admin);
			}
		};
	}
}
