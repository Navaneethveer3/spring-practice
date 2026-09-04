package com.springBoot.test.config;

import java.util.List;

import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class ChatMemoryCleanup implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ChatMemory chatMemory;

    @Override
    public void run(String... args) throws Exception {
        try {
            // Find all users and clear their chat memory directly using the ChatMemory bean
            List<String> usernames = jdbcTemplate.queryForList("SELECT username FROM users", String.class);
            for (String username : usernames) {
                chatMemory.clear(username);
            }
            System.out.println("✅ Successfully cleared old chat memory for all users using ChatMemory bean.");
        } catch (Exception e) {
            System.out.println("Chat memory cleanup skipped: " + e.getMessage());
        }
    }
}
