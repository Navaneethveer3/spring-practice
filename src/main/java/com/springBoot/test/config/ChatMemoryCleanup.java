package com.springBoot.test.config;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;

import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;

import com.springBoot.test.Repository.ProductRepository;
import com.springBoot.test.Model.PaymentOptions;

@Component
public class ChatMemoryCleanup implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ChatMemory chatMemory;

    @Autowired(required = false)
    private CacheManager cacheManager;

    @Autowired(required = false)
    private ProductRepository productRepo;

    @Autowired(required = false)
    private VectorStore vectorStore;

    @Override
    public void run(String... args) throws Exception {
        try {
            if (productRepo != null && vectorStore != null) {
                var products = productRepo.findAll();
                if (!products.isEmpty()) {
                    List<Document> documents = new ArrayList<>();
                    for (var p : products) {
                        StringBuilder paymentText = new StringBuilder();
                        if (p.getPayments() != null && !p.getPayments().isEmpty()) {
                            paymentText.append("\nPayment Options & Offers:\n");
                            for (PaymentOptions opt : p.getPayments()) {
                                if (opt.getEMI() != null) paymentText.append(" - EMI Options: ").append(opt.getEMI()).append("\n");
                                if (opt.getDebit() != null) paymentText.append(" - Debit Card Offers: ").append(opt.getDebit()).append("\n");
                                if (opt.getCredit() != null) paymentText.append(" - Credit Card Offers: ").append(opt.getCredit()).append("\n");
                            }
                        }

                        String prodDetails = """
                                Product Details:
                                ID: %s
                                Name: %s
                                Price: %s
                                Brand: %s
                                Description: %s
                                %s
                                """.formatted(p.getId(), p.getName(), p.getPrice(), p.getBrand(), p.getDescription(), paymentText.toString());

                        documents.add(new Document(prodDetails, Map.of("productId", p.getId())));
                    }
                    vectorStore.add(documents);
                    System.out.println("✅ Synced " + documents.size() + " products into Redis VectorStore for RAG.");
                }
            }
        } catch (Exception e) {
            System.out.println("VectorStore product sync skipped: " + e.getMessage());
        }
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
                var productsCache = cacheManager.getCache("products");
                if (productsCache != null) productsCache.clear();
                System.out.println("✅ Cleared stale cartitems, double, and products Redis caches.");
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
