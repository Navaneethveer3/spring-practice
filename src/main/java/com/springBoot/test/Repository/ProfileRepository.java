package com.springBoot.test.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.springBoot.test.Model.Profile;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, Integer>{

	Profile findByUsername(String username);
	
	Profile findByEmail(String email);
	
}
