package com.springBoot.test.Service;

import java.security.Principal;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.springBoot.test.Model.Profile;
import com.springBoot.test.Model.Users;
import com.springBoot.test.Repository.ProfileRepository;
import com.springBoot.test.Repository.UserRepo;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProfileService {
	
	@Autowired
	private ProfileRepository profileRepo;
	
	@Autowired
	private UserRepo userRepo;
	
	public Profile getProfile(String username) throws Exception{
		Profile profile = profileRepo.findByUsername(username);
		if(profile==null) {
			throw new Exception("No user exists with the {username}");
		}
		return profile;
	}
	
	public Profile updateProfile(Profile profile, String username, Optional<MultipartFile> imageFile) throws Exception{
		Profile newProfile = profileRepo.findByUsername(username);
		if (newProfile == null) {
			newProfile = new Profile();
		}
		
		Profile existingByUsername = profileRepo.findByUsername(profile.getUsername());
		if(existingByUsername != null && !existingByUsername.getUsername().equals(username)) {
			throw new Exception("Username already exists");
		}
		
		Profile existingByEmail = profileRepo.findByEmail(profile.getEmail());
		if(profile.getEmail() != null && existingByEmail != null && !existingByEmail.getUsername().equals(username)) {
			throw new Exception("Email already exists");
		}
		
		Users user = userRepo.findByUsername(username);
		if(user != null) {
			newProfile.setUsername(profile.getUsername());
			user.setUsername(profile.getUsername());
			userRepo.save(user);
		}
		if(imageFile.isPresent()) {
			newProfile.setImageName(imageFile.get().getOriginalFilename());
			newProfile.setImageType(imageFile.get().getContentType());
			newProfile.setImageData(imageFile.get().getBytes());
		}
		if(profile.getDOB()!=null) {
			newProfile.setDOB(profile.getDOB());
		}
		if(profile.getEmail()!=null) {
			newProfile.setEmail(profile.getEmail());
		}
		profileRepo.save(newProfile);
		return newProfile;
	}
	
}
