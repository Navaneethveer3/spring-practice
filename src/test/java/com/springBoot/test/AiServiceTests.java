package com.springBoot.test;

import static org.junit.jupiter.api.Assertions.*;

import java.util.Arrays;

import org.junit.jupiter.api.Test;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.springBoot.test.Model.UserPrincipal;
import com.springBoot.test.Model.Users;
import com.springBoot.test.Service.AiService;

@SpringBootTest
class AiServiceTests {


	@Autowired
	private AiService service;
	
	@Test
	void getResponse() {
		String prompt = "Tell me about Sympy in one line.";
		Users user = new Users();
		user.setUsername("tester");
		UserPrincipal principal = new UserPrincipal(user);
		String response = this.service.chat(prompt);
		System.out.println(response);
	}
	
//	@Autowired
//	VectorStore vectorStore;
//	
//	@Test
//	void load() {
//		Document doc = new Document("Sympy is an AI-powered application designed to make everyday tasks smarter, faster, and easier. It can help users find information, generate ideas, solve problems, write content, summarize information, and learn new topics. Sympy is designed to provide a simple and user-friendly experience for people with different levels of technical knowledge. Its AI can understand natural-language questions and provide useful responses. The application could be helpful for students, professionals, creators, and general users. Sympy can also reduce time spent on repetitive tasks through intelligent automation. The name “Sympy” represents simplicity combined with smart AI technology. In the future, Sympy could include features such as voice interaction, personalized assistance, and advanced automation. Overall, Sympy aims to make AI more accessible and useful in everyday life.");
//		vectorStore.add(Arrays.asList(doc));
//		assertNotNull(doc);
//	}
	
}
