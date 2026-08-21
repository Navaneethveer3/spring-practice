package com.springBoot.test.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.api.Advisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.memory.repository.jdbc.JdbcChatMemoryRepository;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.rag.advisor.RetrievalAugmentationAdvisor;
import org.springframework.ai.rag.retrieval.search.VectorStoreDocumentRetriever;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.redis.RedisVectorStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import redis.clients.jedis.JedisPooled;

@Configuration
public class AiConfig {

	@Bean
	public ChatMemory chatMemory(JdbcChatMemoryRepository jodbcChatMemoryRepository) {
		return MessageWindowChatMemory
				.builder()
				.chatMemoryRepository(jodbcChatMemoryRepository)
				.maxMessages(10)
				.build();
	}




	@Bean
	public ChatClient chatClient(ChatClient.Builder builder, ChatMemory chatMemory, VectorStore vectorStore) {

		Advisor ragAdvisor = RetrievalAugmentationAdvisor.builder()
									.documentRetriever(VectorStoreDocumentRetriever.builder()
											.similarityThreshold(0.75)
											.topK(5)
											.vectorStore(vectorStore)
											.build())
									.build();

		return builder
				.defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build(), ragAdvisor)
				.build();
	}

}
