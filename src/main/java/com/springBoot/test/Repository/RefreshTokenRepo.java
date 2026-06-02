package com.springBoot.test.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.springBoot.test.Model.RefreshToken;

public interface RefreshTokenRepo extends JpaRepository<RefreshToken, Integer>{

	Optional<RefreshToken> findByToken(String token);
	void deleteByUser_Id(int userId);
}
