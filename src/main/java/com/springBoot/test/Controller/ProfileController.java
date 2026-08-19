package com.springBoot.test.Controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.springBoot.test.Model.Profile;
import com.springBoot.test.Model.UserPrincipal;
import com.springBoot.test.Service.ProfileService;

@RestController
@RequestMapping("/profile")
public class ProfileController {

	@Autowired
	private ProfileService profileService;
	
	@GetMapping("/{username}")
	public ResponseEntity<?> getProfile(@PathVariable String username){
		try {
			Profile profile = profileService.getProfile(username);
			return new ResponseEntity<>(profile, HttpStatus.FOUND);
		}
		catch(Exception e) {
			return new ResponseEntity<>(HttpStatus.NO_CONTENT);
		}
	}
	
	@PutMapping("/{username}/update")
	public ResponseEntity<?> updateProfile(@AuthenticationPrincipal UserPrincipal principal, @RequestPart("profile") Profile profile, @PathVariable String username, @RequestPart Optional<MultipartFile> imageFile) throws Exception{
		if(!principal.getUsername().equals(username)) {
			return new ResponseEntity<>("You don't have access to modify this profile",HttpStatus.UNAUTHORIZED);
		}
		try {
			Profile curProfile = profileService.updateProfile(profile, username, imageFile);
			return new ResponseEntity<>(curProfile,HttpStatus.ACCEPTED);
		}
		catch(Exception e) {
			return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
		}
	}
	
}
