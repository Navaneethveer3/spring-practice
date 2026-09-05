package com.springBoot.test.config;

import java.util.List;

import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;

@Component
public class ChatMemoryCleanup implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ChatMemory chatMemory;

    @Autowired(required = false)
    private CacheManager cacheManager;

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

        try {
            if (cacheManager != null) {
                var cartCache = cacheManager.getCache("cartitems");
                if (cartCache != null) cartCache.clear();
                var doubleCache = cacheManager.getCache("double");
                if (doubleCache != null) doubleCache.clear();
                System.out.println("✅ Cleared stale cartitems and double Redis caches.");
            }
        } catch (Exception e) {
            System.out.println("Redis cache eviction skipped: " + e.getMessage());
        }

        try {
            // Drop outdated check constraint on orders.status so REFUNDED is accepted by SQL Server
            jdbcTemplate.execute("""
                DECLARE @sql NVARCHAR(MAX) = '';
                SELECT @sql += 'ALTER TABLE ' + OBJECT_SCHEMA_NAME(parent_object_id) + '.[' + OBJECT_NAME(parent_object_id) + '] DROP CONSTRAINT [' + name + ']; '
                FROM sys.check_constraints
                WHERE parent_object_id = OBJECT_ID('orders')
                  AND parent_column_id = COLUMNPROPERTY(OBJECT_ID('orders'), 'status', 'ColumnId');
                IF @sql <> '' EXEC sp_executesql @sql;
            """);
            System.out.println("✅ Successfully updated orders.status check constraint in SQL Server.");
        } catch (Exception e) {
            System.out.println("Could not alter check constraint: " + e.getMessage());
        }
    }
}
