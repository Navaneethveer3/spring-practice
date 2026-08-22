package com.springBoot.test.config;

import java.util.List;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.SafeGuardAdvisor;
import org.springframework.ai.chat.client.advisor.api.Advisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.memory.repository.jdbc.JdbcChatMemoryRepository;
import org.springframework.ai.rag.advisor.RetrievalAugmentationAdvisor;
import org.springframework.ai.rag.preretrieval.query.transformation.QueryTransformer;
import org.springframework.ai.rag.preretrieval.query.transformation.RewriteQueryTransformer;
import org.springframework.ai.rag.retrieval.search.VectorStoreDocumentRetriever;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.springBoot.test.Tools.ProductTools;

@Configuration
public class AiConfig {

	@Bean
	public QueryTransformer queryTransformer(ChatClient.Builder builder) {
		return RewriteQueryTransformer.builder()
				.chatClientBuilder(builder)
				.build();
	}
	
	@Bean
	public ChatMemory chatMemory(JdbcChatMemoryRepository jodbcChatMemoryRepository) {
		return MessageWindowChatMemory
				.builder()
				.chatMemoryRepository(jodbcChatMemoryRepository)
				.maxMessages(10)
				.build();
	}


	@Bean
	public ChatClient chatClient(ChatClient.Builder builder, ChatMemory chatMemory, VectorStore vectorStore, QueryTransformer queryTransformer,
								ProductTools prodTools) {

		
		Advisor ragAdvisor = RetrievalAugmentationAdvisor.builder()
									.queryTransformers(queryTransformer)
									.documentRetriever(VectorStoreDocumentRetriever.builder()
											.similarityThreshold(0.75)
											.topK(5)
											.vectorStore(vectorStore)
											.build())
									.build();

		List<String> guardrails = List.of("password");
		
		return builder
				.defaultTools(prodTools)
				.defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build(), ragAdvisor, new SafeGuardAdvisor(guardrails))
				.build();
	}

}
