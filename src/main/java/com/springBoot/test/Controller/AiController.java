package com.springBoot.test.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.springBoot.test.Model.UserPrincipal;
import com.springBoot.test.Service.AiService;

import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/ai")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AiController {

	@Autowired
	private AiService aiService;

	/**
	 * Streaming chat endpoint. Accepts an optional productId so the LLM
	 * can use the ProductTools to fetch live product data from the DB / vector store.
	 *
	 * GET /ai/chat?prompt=...&productId=42
	 *
	 * Produces a Server-Sent Events stream so the frontend can render tokens
	 * as they arrive without waiting for the full response.
	 */
	@GetMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
	public Flux<String> chat(
			@AuthenticationPrincipal UserPrincipal principal,
			@RequestParam String prompt,
			@RequestParam(required = false) Integer productId) {

		return aiService.getResponse(principal, prompt, productId);
	}
}
