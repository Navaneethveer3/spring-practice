# 🛒 Agentic E-Commerce

An autonomous, agentic e-commerce platform built on **Spring Boot** with a microservices architecture. Beyond standard product/order management, the platform embeds a **tool-calling AI agent** that can understand natural language, retrieve product information via RAG, place orders and manage the cart on the user's behalf, and automate the entire Razorpay payment lifecycle — while explaining payment policies, EMI options, and cost breakdowns in plain language.

The system is designed with **scalability, performance, security, and maintainability** in mind, using **Spring Security, Spring AI, Redis, Kafka, Docker, and Microsoft Azure SQL**.

## 🚀 Key Features

### 🤖 Agentic AI Assistant

- Conversational agent powered by **Spring AI** with **Tool Calling**, **RAG**, and **Generative AI**
- Understands natural-language product queries and answers them using **RAG over the product catalog**
- **Places orders and adds items to the cart on the user's behalf**, then redirects the user directly to the payment page
- Automates the full payment lifecycle via tool calling: **createOrder()**, **verify()**, **refund()** against Razorpay
- Explains **payment policies, EMI options, price breakdowns, discounts/offers, and applicable charges** in clear, simple language
- Reduces support overhead by answering product and order questions conversationally, backed by real data

### 💳 Razorpay Payment Integration

- `createOrder()` — creates a Razorpay order for checkout
- `verify()` — verifies payment signature/status after completion
- `refund()` — handles refund requests
- All three exposed as agent tools, so the AI can trigger payment actions directly during a conversation

### 🔐 Secure Authentication & Authorization

- Authentication and authorization via **Spring Security**
- **Role-based access control** on protected endpoints
- Secure handling of user resources and protected REST APIs

### 🔄 Event-Driven Microservices Architecture

- Business functionality decomposed into independently deployable services
- Services communicate asynchronously via **Kafka**
- Improves scalability, maintainability, and fault isolation

### ⚡ High-Performance APIs

- Improved API response time from ~**33 ms to 11 ms** (~67% reduction) via **Redis caching**
- Identified and resolved the **N+1 query problem**
- Reduced redundant database calls and optimized data-access patterns

### 📊 Database Optimization

- Indexes added to frequently queried columns
- Pagination implemented for product and order listing APIs
- Reduced database load and network payload for large datasets

### 🐳 Containerized Deployment

- Frontend, backend, Redis, and Kafka containerized together via `docker-compose.yml`
- Prepared for deployment on **Microsoft Azure**

## 🏗️ Architecture

```
                     ┌─────────────────────┐
                     │      Frontend       │
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │     API Gateway     │
                     └──────────┬──────────┘
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
             ▼                  ▼                  ▼
    ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
    │  User/Auth     │ │ Product        │ │ Order          │
    │  Service       │ │ Service        │ │ Service        │
    └───────┬────────┘ └───────┬────────┘ └───────┬────────┘
            │                  │                  │
            └──────────────────┼──────────────────┘
                               │
                               ▼
                     ┌─────────────────────┐
                     │   Kafka Event Bus   │
                     └─────────────────────┘

                     ┌─────────────────────┐
                     │  AI Agent (Spring   │
                     │  AI + Tool Calling  │
                     │      + RAG)         │
                     └──────────┬──────────┘
                                │
                     ┌──────────┴──────────┐
                     ▼                     ▼
             Product RAG Store      Razorpay Tools
           (vector embeddings)   (createOrder/verify/refund)
```

## 🤖 AI Agent — Example Interactions

**Customer:**
> What laptops do you have under 60,000 with good battery life?

**Agent:**
> Retrieves matching products via RAG and responds with relevant options and specs.

**Customer:**
> Add the Dell Inspiron to my cart and checkout.

**Agent:**
> Adds the item to the cart, creates a Razorpay order, and redirects the user to the payment page.

**Customer:**
> Can you break down the EMI cost for this order?

**Agent:**
> Explains the EMI tenure options, interest charges, processing fees, and total payable amount in plain language.

## 🧩 Build Challenges & Technical Obstacles

**1. RAG Vector Database Management**
Managing embeddings and vector storage for product data and tool metadata was an early challenge. Resolved by studying the Spring AI documentation in depth and configuring a vector database suited to the retrieval performance needs of the application.

**2. High Token Consumption from Tool Calling**
Tool parsing and usage consumed significantly more tokens than expected as the toolset grew. Solved by implementing Spring AI's **Tool Search Tool**, which indexes available tools using similarity-distance search and retrieves only the tools relevant to a given request, cutting unnecessary token overhead.

**3. Gemini API Tool-Calling "Thought Signature" Issue**
Configuring tool calling with the Gemini LLM surfaced a persistent thought-signature issue. Resolved after extensive research (Spring AI docs, community blogs, forums) by enabling internal tool execution, turning on the model's thinking capability, and writing clearer, more explicit tool descriptions.

## 🔐 Security

- Authentication and authorization via Spring Security
- Role-based access control on protected endpoints
- Secure handling of user resources and restricted access to protected functionality

## 📊 Database Optimization

### 🔎 Database Indexing
Indexes added to frequently queried columns to reduce query execution time.

### 📄 Pagination
```
GET /api/products?page=0&size=20
```
Reduces memory consumption, database load, network payload, and API response time.

### 🔄 N+1 Query Optimization
Identified and resolved N+1 query issues in data-access operations, cutting redundant database calls.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Java | Application development |
| Spring Boot | Backend framework |
| Spring Security | Authentication & authorization |
| Spring AI | Agentic AI — tool calling, RAG, generative AI |
| Razorpay | Payment gateway (create/verify/refund) |
| Redis | Caching |
| Kafka | Event-driven service communication |
| Azure SQL Database | Persistent data storage |
| Docker | Containerization |
| Microsoft Azure | Cloud deployment |

## ⚙️ Getting Started

**Prerequisites**
- Java 17+
- Maven
- Docker
- Git
- Azure SQL Database (or compatible SQL DB)
- Razorpay API credentials
- AI provider API credentials

**1. Clone the Repository**
```bash
git clone https://github.com/Navaneethveer3/spring-practice.git
cd spring-practice
```

**2. Configure Environment Variables**
```bash
DB_URL=your_database_url
DB_USERNAME=your_database_username
DB_PASSWORD=your_database_password
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
AI_API_KEY=your_ai_api_key
```
> **Important:** Never commit API keys, passwords, JWT secrets, or other credentials to the repository.

**3. Build the Application**
```bash
./mvnw clean install
```

**4. Run with Docker Compose**
```bash
docker compose up --build
```

## 📈 Performance Highlights

| Optimization | Result |
|---|---|
| API response optimization | ~33 ms → ~11 ms |
| Caching | Reduced repeated data retrieval |
| N+1 query resolution | Reduced redundant database calls |
| Database indexing | Faster frequently used queries |
| Pagination | Efficient handling of large datasets |
| Containerization | Consistent deployment environment |

## 🔮 Future Improvements

- Distributed tracing and centralized observability
- Advanced monitoring and alerting
- Automated CI/CD pipelines
- Rate limiting and API throttling
- More advanced AI-powered product recommendations
- Automated unit and integration testing
- Kubernetes-based orchestration
- Improved fault tolerance and resilience patterns
- Centralized logging across microservices
- Advanced caching and distributed cache management

## 👨‍💻 What I Learned

- Designing and integrating an agentic AI layer (tool calling + RAG) into a production system
- Managing vector databases and embeddings for RAG
- Optimizing LLM token usage via tool search/indexing
- Debugging provider-specific LLM tool-calling issues (Gemini thought signatures)
- Automating payment workflows (Razorpay) through AI tool calling
- Designing event-driven microservices with Kafka
- Implementing secure, role-based APIs with Spring Security
- Improving backend performance using caching, indexing, and pagination
- Containerizing and preparing microservices for Azure deployment

## 📌 Project Highlights

- 🤖 Agentic AI that places orders, manages the cart, and redirects to payment autonomously
- 💳 Full Razorpay lifecycle automation (create/verify/refund) via tool calling
- 📚 RAG-powered product search and Q&A
- 🧮 Plain-language EMI, offer, and cost breakdowns for users
- 🚀 API response time improved from 33 ms to 11 ms
- 🔐 Role-based access control with Spring Security
- 🔄 Event-driven microservices architecture with Kafka
- 🐳 Fully containerized with Docker
- ☁️ Production-ready, Azure-deployable design
