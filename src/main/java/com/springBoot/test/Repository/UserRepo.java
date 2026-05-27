package com.springBoot.test.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.springBoot.test.Model.Users;


@Repository
public interface UserRepo extends JpaRepository<Users, Integer> {

	public Users findByUsername(String username);

}
