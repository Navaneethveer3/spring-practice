package com.springBoot.test.Tools;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.ai.document.Document;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class KnowledgeBaseTools {

	@Autowired
    private VectorStore vectorStore;

    @Tool(description = "Search the product catalog and knowledge base using semantic vector search. Use this whenever the user asks for product recommendations, specifications, comparisons, or searches by budget or features (e.g. 'best mobile under 35000').")
    public String searchKnowledgeBase(
            @ToolParam(description = "The specific product search query or recommendation criteria (e.g. 'best mobile under 35000', 'Apple iPhone')") String query,
            @ToolParam(description = "the maximum number of results to return, e.g. 3, 5. Default is 5", required = false) Integer maxResults) {
        try {
            int topK = (maxResults != null && maxResults > 0) ? maxResults : 5;

            List<Document> results = vectorStore.similaritySearch(
                SearchRequest.builder()
                    .query(query)
                    .topK(topK)
                    .build()
            );

            if (results == null || results.isEmpty()) {
                return "No relevant information found in the knowledge base for this query.";
            }

            return results.stream()
                    .map(doc->{
                    	String source = (String) doc.getMetadata().getOrDefault("source", "unknown document");
                        String text = doc.getText();
                        if (text != null && text.length() > 600) {
                            text = text.substring(0, 600) + "... (truncated)";
                        }
                    	return "[source document: "+source+"]\n"+text;
                    })
                    .collect(Collectors.joining("\n\n---\n\n"));
        } catch (Exception e) {
            return "An error occurred while searching the knowledge base: " + e.getMessage();
        }
    }
	
}
