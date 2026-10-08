// REXION Quizzes - Comprehensive Category & Topic Catalog
// Supports 11 Core Career Tracks with 120+ Topics and dynamic question generators

export const CATEGORIES_LIST = [
  "All",
  "💻 Development",
  "🤖 AI / ML",
  "📊 Data",
  "🧠 DSA",
  "🗄️ Database",
  "☁️ Cloud & DevOps",
  "🔐 Cybersecurity",
  "🏗️ Software Architecture",
  "📱 Other Development",
  "🎨 Product / Design",
  "💼 Career Skills"
]

export const normalizeCategory = (cat = "") => {
  return String(cat).replace(/^[\p{Emoji}\s]+/u, "").trim().toLowerCase()
}

export const CATEGORY_CATALOG = {
  "development": {
    name: "Development",
    emoji: "💻",
    tagline: "Modern web, server-side development, TypeScript, and engineering workflows.",
    accent: "#D96B43",
    bg: "#FEF3EB",
    topics: [
      { id: "html-css", title: "HTML & CSS", quizCount: 6, difficulty: "Easy - Medium", desc: "Semantic HTML5, CSS Grid, Flexbox, animations, and responsive web styling.", slug: "html-css" },
      { id: "typescript", title: "TypeScript", quizCount: 7, difficulty: "Medium - Hard", desc: "Type inference, generics, union types, interfaces, and strict type safety.", slug: "typescript" },
      { id: "nextjs", title: "Next.js", quizCount: 6, difficulty: "Medium - Hard", desc: "App router, SSR, SSG, Server Actions, API routes, and React Server Components.", slug: "nextjs" },
      { id: "nodejs", title: "Node.js", quizCount: 8, difficulty: "Medium - Hard", desc: "Event loop, streams, buffers, file system, clustering, and asynchronous runtime.", slug: "nodejs" },
      { id: "expressjs", title: "Express.js", quizCount: 5, difficulty: "Easy - Medium", desc: "Middleware pipelines, routing, error handling, CORS, and REST controllers.", slug: "expressjs" },
      { id: "rest-apis", title: "REST APIs", quizCount: 7, difficulty: "Medium", desc: "HTTP methods, status codes, RESTful resource modeling, pagination, and OpenAPI.", slug: "rest-apis" },
      { id: "auth-authz", title: "Authentication & Authorization", quizCount: 6, difficulty: "Hard", desc: "JWT tokens, OAuth2, session cookies, RBAC, MFA, and secure password hashing.", slug: "auth-authz" },
      { id: "web-dev", title: "Web Development", quizCount: 8, difficulty: "Medium", desc: "DOM APIs, browser rendering lifecycle, event bubbling, and modern web APIs.", slug: "web-dev" },
      { id: "git-github", title: "Git & GitHub", quizCount: 5, difficulty: "Easy - Medium", desc: "Branching, merging, rebasing, pull requests, resolving conflicts, and CI hooks.", slug: "git-workflows" },
      { id: "testing-debugging", title: "Testing & Debugging", quizCount: 6, difficulty: "Medium", desc: "Unit testing, integration testing, Jest, Playwright, mock assertions, and profilers.", slug: "testing-debugging" },
      { id: "web-performance", title: "Web Performance", quizCount: 5, difficulty: "Hard", desc: "Core Web Vitals, code splitting, memoization, lazy loading, and asset caching.", slug: "web-performance" },
      { id: "software-engineering", title: "Software Engineering", quizCount: 7, difficulty: "Medium - Hard", desc: "SOLID principles, clean code, DRY, agile workflows, and code refactoring.", slug: "software-engineering" }
    ]
  },
  "ai / ml": {
    name: "AI / ML",
    emoji: "🤖",
    tagline: "Machine Learning, LLMs, AI Agents, RAG, and Modern Agentic Workflows.",
    accent: "#7C3AED",
    bg: "#F5F3FF",
    topics: [
      { id: "ai-basics", title: "AI Basics", quizCount: 5, difficulty: "Easy - Medium", desc: "Core heuristics, search algorithms, perceptrons, and intelligence agents.", slug: "ai-basics" },
      { id: "deep-learning", title: "Deep Learning", quizCount: 8, difficulty: "Hard", desc: "Backpropagation, CNNs, RNNs, activation functions, loss curves, and transformers.", slug: "deep-learning" },
      { id: "nlp", title: "NLP", quizCount: 6, difficulty: "Medium - Hard", desc: "Tokenization, TF-IDF, Word2Vec, self-attention, BLEU score, and sentiment analysis.", slug: "nlp" },
      { id: "generative-ai", title: "Generative AI", quizCount: 8, difficulty: "Medium - Hard", desc: "Diffusion models, GANs, autoregressive decoders, Latent Diffusion, and VAEs.", slug: "generative-ai" },
      { id: "llms", title: "LLMs", quizCount: 10, difficulty: "Hard", desc: "Pre-training, fine-tuning, RLHF, context windows, quantization, and temperature.", slug: "llms" },
      { id: "ai-agents", title: "AI Agents", quizCount: 10, difficulty: "Hard", desc: "Autonomous loops, tool invocation, ReAct prompting, self-reflection, and execution.", slug: "ai-agents" },
      { id: "rag", title: "RAG", quizCount: 8, difficulty: "Hard", desc: "Retrieval-augmented generation, chunking strategies, vector index, and reranking.", slug: "rag-vector-search" },
      { id: "mcp", title: "MCP", quizCount: 5, difficulty: "Medium - Hard", desc: "Model Context Protocol, client-server tools, schema definitions, and agent transports.", slug: "mcp" },
      { id: "mlops", title: "MLOps", quizCount: 6, difficulty: "Medium - Hard", desc: "Model registry, experiment tracking, MLflow, drift detection, and automated pipelines.", slug: "mlops" },
      { id: "ai-fundamentals", title: "Artificial Intelligence Fundamentals", quizCount: 6, difficulty: "Easy - Medium", desc: "State-space search, heuristic evaluation, Turing test, knowledge representation.", slug: "ai-fundamentals" },
      { id: "computer-vision", title: "Computer Vision", quizCount: 6, difficulty: "Hard", desc: "Convolutional layers, pooling, object detection, YOLO, segmentation, and OpenCV.", slug: "computer-vision" },
      { id: "prompt-engineering", title: "Prompt Engineering", quizCount: 7, difficulty: "Medium", desc: "Few-shot prompting, Chain-of-Thought, system instructions, and hallucination reduction.", slug: "prompt-engineering" },
      { id: "agentic-ai", title: "Agentic AI", quizCount: 8, difficulty: "Hard", desc: "Multi-agent coordination, subagents, supervisor architecture, and goal convergence.", slug: "agentic-ai" },
      { id: "langchain-langgraph", title: "LangChain / LangGraph", quizCount: 7, difficulty: "Hard", desc: "Chains, runnable state machines, conditional routing, cyclic graphs, and memory buffers.", slug: "langchain-langgraph" },
      { id: "embeddings-vector-dbs", title: "Embeddings & Vector Databases", quizCount: 6, difficulty: "Hard", desc: "High-dimensional embeddings, cosine similarity, HNSW indexes, Pinecone, and Chroma.", slug: "embeddings-vector-dbs" },
      { id: "model-evaluation", title: "Model Evaluation", quizCount: 5, difficulty: "Medium", desc: "Precision, recall, ROC-AUC, BLEU, ROUGE, perplexity, and benchmark suites.", slug: "model-evaluation" }
    ]
  },
  "data": {
    name: "Data",
    emoji: "📊",
    tagline: "Statistical analysis, data pipelines, analytics engineering, and Big Data.",
    accent: "#059669",
    bg: "#ECFDF5",
    topics: [
      { id: "statistics", title: "Statistics", quizCount: 6, difficulty: "Medium", desc: "Mean, variance, standard deviation, hypothesis testing, p-values, and distributions.", slug: "statistics" },
      { id: "probability", title: "Probability", quizCount: 5, difficulty: "Medium", desc: "Bayes theorem, conditional probability, random variables, and expectation.", slug: "probability" },
      { id: "data-analysis", title: "Data Analysis", quizCount: 8, difficulty: "Medium", desc: "Exploratory data analysis (EDA), trend identification, correlation, and anomaly spotting.", slug: "data-analysis" },
      { id: "numpy", title: "NumPy", quizCount: 6, difficulty: "Medium", desc: "N-dimensional arrays, vectorization, broadcasting, linear algebra, and masking.", slug: "numpy" },
      { id: "pandas", title: "Pandas", quizCount: 8, difficulty: "Medium - Hard", desc: "DataFrames, grouping, aggregation, pivot tables, handling missing values, and merges.", slug: "pandas" },
      { id: "data-visualization", title: "Data Visualization", quizCount: 6, difficulty: "Easy - Medium", desc: "Matplotlib, Seaborn, charting principles, color schemes, and dashboard narratives.", slug: "data-visualization" },
      { id: "power-bi", title: "Power BI", quizCount: 5, difficulty: "Medium", desc: "DAX formulas, Power Query, relationship modeling, interactive visual cards, and slicers.", slug: "power-bi" },
      { id: "excel", title: "Excel", quizCount: 6, difficulty: "Easy - Medium", desc: "XLOOKUP, INDEX-MATCH, Pivot Tables, conditional formatting, and analytical functions.", slug: "excel" },
      { id: "data-engineering", title: "Data Engineering", quizCount: 7, difficulty: "Hard", desc: "Data schemas, batch vs streaming pipelines, partitioning, and schema evolution.", slug: "data-engineering" },
      { id: "etl-elt", title: "ETL / ELT", quizCount: 6, difficulty: "Medium - Hard", desc: "Extraction, transformation staging, loading into data warehouses, and idempotency.", slug: "etl-elt" },
      { id: "data-warehousing", title: "Data Warehousing", quizCount: 6, difficulty: "Hard", desc: "Star schema, snowflake schema, columnar storage, Snowflake, BigQuery, and Redshift.", slug: "data-warehousing" },
      { id: "big-data", title: "Big Data", quizCount: 7, difficulty: "Hard", desc: "Apache Spark, Hadoop HDFS, MapReduce, Kafka streaming, and distributed computing.", slug: "big-data" }
    ]
  },
  "dsa": {
    name: "DSA",
    emoji: "🧠",
    tagline: "Data Structures & Algorithms, competitive coding, and interview problem solving.",
    accent: "#EA580C",
    bg: "#FFF7ED",
    topics: [
      { id: "arrays", title: "Arrays", quizCount: 8, difficulty: "Easy - Medium", desc: "Two-pointer technique, sliding window, prefix sums, sub-array kadane algorithm.", slug: "arrays" },
      { id: "strings", title: "Strings", quizCount: 7, difficulty: "Easy - Medium", desc: "Palindromes, anagrams, string matching, KMP algorithm, and trie structures.", slug: "strings" },
      { id: "hash-maps", title: "Hash Maps", quizCount: 6, difficulty: "Medium", desc: "Collision resolution, chaining, open addressing, load factor, and O(1) lookups.", slug: "hash-maps" },
      { id: "linked-lists", title: "Linked Lists", quizCount: 6, difficulty: "Medium", desc: "Singly, doubly linked lists, fast & slow pointers, reversing, and cycle detection.", slug: "linked-lists" },
      { id: "stacks-queues", title: "Stacks & Queues", quizCount: 6, difficulty: "Medium", desc: "Monotonic stack, priority queue, circular buffer, deque, and parenthesization.", slug: "stacks-queues" },
      { id: "trees", title: "Trees", quizCount: 8, difficulty: "Hard", desc: "Binary search trees, AVL trees, DFS traversals (in/pre/post), and Lowest Common Ancestor.", slug: "trees" },
      { id: "graphs", title: "Graphs", quizCount: 8, difficulty: "Hard", desc: "BFS, DFS, Dijkstra, Bellman-Ford, topological sort, and cycle detection in DAGs.", slug: "graphs" },
      { id: "heaps", title: "Heaps", quizCount: 5, difficulty: "Hard", desc: "Min-heap, max-heap, heapify, PriorityQueue, and Top-K element extractions.", slug: "heaps" },
      { id: "recursion", title: "Recursion", quizCount: 6, difficulty: "Medium", desc: "Base cases, call stack frames, recursive tree visualization, and divide & conquer.", slug: "recursion" },
      { id: "backtracking", title: "Backtracking", quizCount: 5, difficulty: "Hard", desc: "N-Queens, Sudoku solver, subset generation, permutations, and prune conditions.", slug: "backtracking" },
      { id: "greedy-algorithms", title: "Greedy Algorithms", quizCount: 6, difficulty: "Medium - Hard", desc: "Interval scheduling, Huffman coding, fractional knapsack, and locally optimal choices.", slug: "greedy-algorithms" },
      { id: "dynamic-programming", title: "Dynamic Programming", quizCount: 10, difficulty: "Hard", desc: "Memoization, tabulation, knapsack 0/1, LCS, LIS, coin change, and state transitions.", slug: "dynamic-programming" },
      { id: "sorting-searching", title: "Sorting & Searching", quizCount: 7, difficulty: "Medium", desc: "Binary search variations, QuickSort, MergeSort, counting sort, and asymptotic bounds.", slug: "sorting-searching" },
      { id: "bit-manipulation", title: "Bit Manipulation", quizCount: 5, difficulty: "Medium - Hard", desc: "Bitwise XOR, AND, OR, bit shifts, two's complement, power of two, and bitmasks.", slug: "bit-manipulation" }
    ]
  },
  "database": {
    name: "Database",
    emoji: "🗄️",
    tagline: "Relational, document, key-value stores, query optimization, and ACID transactions.",
    accent: "#2563EB",
    bg: "#EFF4FE",
    topics: [
      { id: "mysql", title: "MySQL", quizCount: 7, difficulty: "Medium", desc: "InnoDB engine, table schemas, foreign keys, auto-increment, and stored procedures.", slug: "mysql" },
      { id: "postgresql", title: "PostgreSQL", quizCount: 7, difficulty: "Medium - Hard", desc: "JSONB columns, CTEs, window functions, MVCC, and schema extensions.", slug: "postgresql" },
      { id: "mongodb", title: "MongoDB", quizCount: 8, difficulty: "Medium", desc: "BSON documents, aggregation pipelines, replica sets, sharding, and indexing.", slug: "mongodb" },
      { id: "redis", title: "Redis", quizCount: 6, difficulty: "Medium", desc: "In-memory caching, Pub/Sub, sorted sets, eviction policies (LRU/LFU), and TTL.", slug: "redis" },
      { id: "database-design", title: "Database Design", quizCount: 6, difficulty: "Medium - Hard", desc: "ER diagrams, 1NF/2NF/3NF/BCNF normalization, primary/foreign keys, and denormalization.", slug: "database-design" },
      { id: "sql-optimization", title: "SQL Optimization", quizCount: 6, difficulty: "Hard", desc: "EXPLAIN plans, index scans vs table scans, eliminating N+1 queries, and query tuning.", slug: "sql-optimization" },
      { id: "transactions-acid", title: "Transactions & ACID", quizCount: 5, difficulty: "Hard", desc: "Atomicity, Consistency, Isolation levels (Read Committed, Serializable), and Durability.", slug: "transactions-acid" },
      { id: "indexing", title: "Indexing", quizCount: 6, difficulty: "Hard", desc: "B-Tree vs Hash indexes, composite indexes, covering indexes, and index cardinality.", slug: "indexing" },
      { id: "nosql", title: "NoSQL", quizCount: 6, difficulty: "Medium", desc: "Document vs Wide-Column vs Graph vs Key-Value, BASE properties, and CAP theorem.", slug: "nosql" }
    ]
  },
  "cloud & devops": {
    name: "Cloud & DevOps",
    emoji: "☁️",
    tagline: "Cloud infrastructure, containerization, orchestration, and CI/CD pipelines.",
    accent: "#0284C7",
    bg: "#F0F9FF",
    topics: [
      { id: "linux", title: "Linux", quizCount: 7, difficulty: "Medium", desc: "Bash commands, file permissions (chmod/chown), process signals, and systemd services.", slug: "linux" },
      { id: "docker", title: "Docker", quizCount: 8, difficulty: "Medium - Hard", desc: "Dockerfile instructions, multi-stage builds, layers, volumes, bridge networks, and Compose.", slug: "docker" },
      { id: "kubernetes", title: "Kubernetes", quizCount: 8, difficulty: "Hard", desc: "Pods, Deployments, Services, Ingress, ConfigMaps, Secrets, HPA, and StatefulSets.", slug: "kubernetes" },
      { id: "aws", title: "AWS", quizCount: 9, difficulty: "Medium - Hard", desc: "EC2, S3, Lambda, IAM roles, VPC subnets, RDS, Route53, and CloudFront.", slug: "aws" },
      { id: "azure", title: "Azure", quizCount: 6, difficulty: "Medium", desc: "Virtual Machines, Blob Storage, Azure Functions, Entra ID, and Virtual Networks.", slug: "azure" },
      { id: "gcp", title: "GCP", quizCount: 6, difficulty: "Medium", desc: "Compute Engine, Cloud Storage, Cloud Run, GKE, BigQuery, and IAM policies.", slug: "gcp" },
      { id: "cicd", title: "CI/CD", quizCount: 7, difficulty: "Medium", desc: "GitHub Actions workflows, automated tests, build artifacts, rollback strategies, and runners.", slug: "cicd" },
      { id: "terraform", title: "Terraform", quizCount: 6, difficulty: "Hard", desc: "HCL syntax, state files, providers, resources, modules, and terraform plan/apply.", slug: "terraform" },
      { id: "cloud-architecture", title: "Cloud Architecture", quizCount: 7, difficulty: "Hard", desc: "High availability, multi-region redundancy, load balancers, and disaster recovery.", slug: "cloud-architecture" },
      { id: "devops-fundamentals", title: "DevOps Fundamentals", quizCount: 6, difficulty: "Medium", desc: "Infrastructure as Code, Continuous Delivery, shift-left testing, and SRE tenets.", slug: "devops-fundamentals" },
      { id: "monitoring-logging", title: "Monitoring & Logging", quizCount: 5, difficulty: "Medium", desc: "Prometheus, Grafana, ELK stack, log aggregation, alerting thresholds, and distributed tracing.", slug: "monitoring-logging" }
    ]
  },
  "cybersecurity": {
    name: "Cybersecurity",
    emoji: "🔐",
    tagline: "Application security, network defense, threat modeling, and ethical hacking.",
    accent: "#DC2626",
    bg: "#FEF2F2",
    topics: [
      { id: "cyber-fundamentals", title: "Cybersecurity Fundamentals", quizCount: 6, difficulty: "Easy - Medium", desc: "CIA triad, defense-in-depth, threat actors, attack vectors, and security hygiene.", slug: "cyber-fundamentals" },
      { id: "networking", title: "Networking", quizCount: 7, difficulty: "Medium", desc: "OSI model, TCP/IP, DNS resolution, TLS/SSL handshake, subnets, and routing.", slug: "networking" },
      { id: "linux-security", title: "Linux Security", quizCount: 5, difficulty: "Medium - Hard", desc: "Sudoers privileges, SSH key configurations, iptables/UFW, SELinux, and auditd.", slug: "linux-security" },
      { id: "web-security", title: "Web Security", quizCount: 7, difficulty: "Hard", desc: "CORS, Content Security Policy (CSP), SameSite cookies, clickjacking, and XSS.", slug: "web-security" },
      { id: "owasp", title: "OWASP", quizCount: 6, difficulty: "Hard", desc: "OWASP Top 10: Broken Access Control, Injection, SSRF, Security Misconfiguration.", slug: "owasp" },
      { id: "auth-security", title: "Authentication & Authorization", quizCount: 6, difficulty: "Hard", desc: "Credential stuffing defense, brute-force mitigation, OAuth grants, and token revocation.", slug: "auth-security" },
      { id: "cryptography", title: "Cryptography", quizCount: 6, difficulty: "Hard", desc: "Symmetric (AES) vs Asymmetric (RSA/ECC), hashing (SHA256), salt, and digital signatures.", slug: "cryptography" },
      { id: "ethical-hacking", title: "Ethical Hacking Fundamentals", quizCount: 5, difficulty: "Medium - Hard", desc: "Reconnaissance, port scanning with Nmap, vulnerability scanning, and responsible disclosure.", slug: "ethical-hacking" },
      { id: "threat-detection", title: "Threat Detection", quizCount: 5, difficulty: "Hard", desc: "SIEM systems, intrusion detection (IDS/IPS), honeypots, and anomaly detection.", slug: "threat-detection" },
      { id: "security-engineering", title: "Security Engineering", quizCount: 6, difficulty: "Hard", desc: "Threat modeling (STRIDE), zero trust architecture, secure SDLC, and code audits.", slug: "security-engineering" }
    ]
  },
  "software architecture": {
    name: "Software Architecture",
    emoji: "🏗️",
    tagline: "System design, distributed systems, scalability, and design patterns.",
    accent: "#B45309",
    bg: "#FEF3C7",
    topics: [
      { id: "system-design", title: "System Design", quizCount: 9, difficulty: "Hard", desc: "High-level design, estimating QPS and storage, rate limiting, and URL shortener design.", slug: "system-design" },
      { id: "software-arch", title: "Software Architecture", quizCount: 7, difficulty: "Hard", desc: "Monolith vs Microservices, Hexagonal architecture, event-driven systems, and CQRS.", slug: "software-arch" },
      { id: "design-patterns", title: "Design Patterns", quizCount: 8, difficulty: "Medium - Hard", desc: "Singleton, Factory, Observer, Strategy, Decorator, Adapter, and Dependency Injection.", slug: "design-patterns" },
      { id: "microservices", title: "Microservices", quizCount: 7, difficulty: "Hard", desc: "Service discovery, API gateway, circuit breaker pattern, and Saga distributed transactions.", slug: "microservices" },
      { id: "distributed-systems", title: "Distributed Systems", quizCount: 8, difficulty: "Hard", desc: "CAP theorem, Paxos/Raft consensus, vector clocks, gossip protocol, and split-brain.", slug: "distributed-systems" },
      { id: "api-design", title: "API Design", quizCount: 6, difficulty: "Medium", desc: "RESTful principles, GraphQL schemas, gRPC protobufs, versioning, and idempotency keys.", slug: "api-design" },
      { id: "scalability", title: "Scalability", quizCount: 7, difficulty: "Hard", desc: "Horizontal vs vertical scaling, stateless services, database sharding, and CDN caching.", slug: "scalability" },
      { id: "caching", title: "Caching", quizCount: 6, difficulty: "Medium - Hard", desc: "Cache-Aside, Write-Through, Write-Behind, Cache stampede, and Redis invalidation.", slug: "caching" },
      { id: "message-queues", title: "Message Queues", quizCount: 6, difficulty: "Hard", desc: "RabbitMQ, Apache Kafka, Amazon SQS, dead-letter queues, and pub/sub semantics.", slug: "message-queues" }
    ]
  },
  "other development": {
    name: "Other Development",
    emoji: "📱",
    tagline: "Mobile cross-platform, native mobile engineering, and game development.",
    accent: "#0D9488",
    bg: "#CCFBF1",
    topics: [
      { id: "android-dev", title: "Android Development", quizCount: 7, difficulty: "Medium - Hard", desc: "Kotlin, Jetpack Compose, Activities, ViewModels, Room DB, and Android lifecycle.", slug: "android-dev" },
      { id: "flutter", title: "Flutter", quizCount: 6, difficulty: "Medium", desc: "Dart programming, Stateless vs Stateful widgets, Provider/Bloc state, and animations.", slug: "flutter" },
      { id: "react-native", title: "React Native", quizCount: 6, difficulty: "Medium", desc: "JSX bridge, TurboModules, Expo, FlatList performance, and native module linking.", slug: "react-native" },
      { id: "ios-dev", title: "iOS Development", quizCount: 6, difficulty: "Hard", desc: "Swift, SwiftUI, UIKit, Combine, CoreData, ARC memory management, and Xcode.", slug: "ios-dev" },
      { id: "game-dev", title: "Game Development", quizCount: 5, difficulty: "Medium - Hard", desc: "Game loop, collision detection, physics engines, shaders, and Unity/Unreal basics.", slug: "game-dev" }
    ]
  },
  "product / design": {
    name: "Product / Design",
    emoji: "🎨",
    tagline: "User interface, design systems, UX research, and accessible digital products.",
    accent: "#DB2777",
    bg: "#FCE7F3",
    topics: [
      { id: "ui-ux", title: "UI/UX", quizCount: 8, difficulty: "Easy - Medium", desc: "Visual hierarchy, typography, wireframing, color theory, and user journey mapping.", slug: "ui-ux" },
      { id: "figma", title: "Figma", quizCount: 6, difficulty: "Easy - Medium", desc: "Auto-layout, components, variants, interactive prototypes, and developer handoff.", slug: "figma" },
      { id: "design-systems", title: "Design Systems", quizCount: 6, difficulty: "Medium", desc: "Design tokens, atomic design, component libraries, and style guide governance.", slug: "design-systems" },
      { id: "product-design", title: "Product Design", quizCount: 6, difficulty: "Medium", desc: "Problem definition, user empathy, MVP prioritization, and usability validation.", slug: "product-design" },
      { id: "ux-research", title: "UX Research", quizCount: 5, difficulty: "Medium", desc: "User interviews, qualitative vs quantitative testing, card sorting, and persona creation.", slug: "ux-research" },
      { id: "accessibility", title: "Accessibility", quizCount: 5, difficulty: "Medium", desc: "WCAG 2.1 AA guidelines, ARIA roles, color contrast ratios, and keyboard navigation.", slug: "accessibility" }
    ]
  },
  "career skills": {
    name: "Career Skills",
    emoji: "💼",
    tagline: "Resume crafting, ATS optimization, behavioral interviews, and career growth.",
    accent: "#6366F1",
    bg: "#EEF2FF",
    topics: [
      { id: "resume-ats", title: "Resume & ATS", quizCount: 6, difficulty: "Easy - Medium", desc: "Keyword optimization, action verbs, quantifying accomplishments, and ATS parsers.", slug: "resume-ats" },
      { id: "linkedin", title: "LinkedIn", quizCount: 5, difficulty: "Easy", desc: "Profile headline, about section narrative, recruiter visibility, and content sharing.", slug: "linkedin" },
      { id: "interview-prep", title: "Interview Preparation", quizCount: 8, difficulty: "Medium", desc: "STAR method, researching companies, handling curveball questions, and post-interview follow-ups.", slug: "interview-prep" },
      { id: "technical-interviews", title: "Technical Interviews", quizCount: 8, difficulty: "Hard", desc: "Live whiteboarding, clarifying assumptions, time/space tradeoffs, and mock practice.", slug: "technical-interviews" },
      { id: "hr-interviews", title: "HR Interviews", quizCount: 6, difficulty: "Easy - Medium", desc: "Culture fit, salary negotiation, career trajectory, and explaining employment gaps.", slug: "hr-interviews" },
      { id: "communication", title: "Communication", quizCount: 6, difficulty: "Easy - Medium", desc: "Active listening, conciseness, technical-to-business translation, and presentation skills.", slug: "communication" },
      { id: "networking", title: "Networking", quizCount: 5, difficulty: "Easy - Medium", desc: "Informational interviews, building genuine industry relationships, and conference outreach.", slug: "networking" },
      { id: "personal-branding", title: "Personal Branding", quizCount: 5, difficulty: "Easy - Medium", desc: "GitHub portfolio, technical blog posts, domain authority, and digital presence.", slug: "personal-branding" },
      { id: "freelancing", title: "Freelancing", quizCount: 5, difficulty: "Medium", desc: "Client proposals, contract pricing, deliverables management, and scope management.", slug: "freelancing" },
      { id: "workplace-skills", title: "Workplace Skills", quizCount: 6, difficulty: "Easy - Medium", desc: "Collaboration in cross-functional teams, asynchronous work, and conflict resolution.", slug: "workplace-skills" },
      { id: "professional-email", title: "Professional Email", quizCount: 5, difficulty: "Easy", desc: "Clear subject lines, executive brevity, call-to-action framing, and polite tone.", slug: "professional-email" },
      { id: "problem-solving", title: "Problem Solving", quizCount: 7, difficulty: "Medium - Hard", desc: "First-principles thinking, root-cause analysis, 5 Whys, and hypothesis testing.", slug: "problem-solving" },
      { id: "leadership", title: "Leadership", quizCount: 6, difficulty: "Medium - Hard", desc: "Mentorship, delegating tasks, fostering psychological safety, and driving team goals.", slug: "leadership" }
    ]
  }
}

// Generate tailored quiz metadata and questions for any topic
export const getCustomTopicQuiz = (slugOrId, fallbackTitle = "") => {
  const norm = String(slugOrId).toLowerCase().replace(/[^a-z0-9]+/g, "-")

  // Find topic in catalog
  let matchedTopic = null
  let matchedCat = null
  for (const catKey in CATEGORY_CATALOG) {
    const cat = CATEGORY_CATALOG[catKey]
    const found = cat.topics.find(t => t.slug === norm || t.id === norm || t.title.toLowerCase() === fallbackTitle.toLowerCase())
    if (found) {
      matchedTopic = found
      matchedCat = cat
      break
    }
  }

  const topicTitle = matchedTopic ? matchedTopic.title : (fallbackTitle || slugOrId)
  const categoryName = matchedCat ? matchedCat.name : "Engineering"
  const catEmoji = matchedCat ? matchedCat.emoji : "💡"
  const accent = matchedCat ? matchedCat.accent : "#D96B43"
  const bg = matchedCat ? matchedCat.bg : "#FEF3EB"

  // Curated questions generator based on keyword matching
  const generateQuestions = (title, cat) => {
    const t = title.toLowerCase()

    if (t.includes("ai agent") || t.includes("agentic")) {
      return [
        { id: "ag1", question: "In modern AI Agent architectures, what is the primary role of the 'ReAct' framework?", options: ["Compiling prompts to bytecode", "Synergizing reasoning (thought) and acting (tool execution)", "Replacing transformer attention heads", "Handling database migrations"], correct: 1, tip: "ReAct stands for Reasoning + Acting, prompting the LLM to think before invoking tools." },
        { id: "ag2", question: "What distinguishes an AI Agent from a standard chat completion?", options: ["Agents have no prompt limit", "Agents can autonomously perceive state, invoke tools, and loop to achieve goals", "Agents only run on GPUs", "Agents cannot generate text"], correct: 1, tip: "Agents maintain state, use tool APIs, and loop until a completion condition is reached." },
        { id: "ag3", question: "What is 'tool calling' in the context of LLM agents?", options: ["The LLM outputs structured arguments (e.g. JSON) that an external executor runs", "The model directly modifies its weights at runtime", "Hardcoded regex scripts", "Compiling python code inside the context"], correct: 0, tip: "The model outputs structured schema (JSON) that the client executes and feeds results back." },
        { id: "ag4", question: "Which strategy helps prevent infinite agent execution loops?", options: ["Deleting conversation history", "Max recursion/step limits and stopping condition checks", "Always setting temperature to 0", "Running multiple agents simultaneously"], correct: 1, tip: "Setting max iterations and explicit termination criteria prevents runaway execution." },
        { id: "ag5", question: "In multi-agent systems, what is a Supervisor Agent responsible for?", options: ["Formatting raw CSS", "Decomposing goals and routing sub-tasks to specialized worker agents", "Writing SQL queries directly", "Hosting the vector database"], correct: 1, tip: "The supervisor orchestrates, evaluates intermediate outputs, and delegates tasks." }
      ]
    }

    if (t.includes("llm") || t.includes("generative")) {
      return [
        { id: "llm1", question: "What does temperature control in LLM inference?", options: ["Model execution speed", "Randomness in token sampling probability distribution", "Context window size in tokens", "GPU core temperature"], correct: 1, tip: "Lower temperature yields more deterministic output; higher temperature increases variety." },
        { id: "llm2", question: "What does RLHF stand for in LLM alignment?", options: ["Real-time Latency Heuristic Factor", "Reinforcement Learning from Human Feedback", "Recursive Layer High Frequency", "Relational Language Hidden Feature"], correct: 1, tip: "RLHF aligns model generation with human preferences and instructions." },
        { id: "llm3", question: "What is the primary benefit of KV (Key-Value) caching during autoregressive generation?", options: ["Reduces memory to zero", "Avoids recomputing attention key/value vectors for previous tokens", "Enables multilingual support", "Translates Python to Rust"], correct: 1, tip: "KV cache stores previous key and value projections, drastically speeding up token generation." },
        { id: "llm4", question: "What is quantization in model deployment?", options: ["Reducing weight precision (e.g., FP16 to INT8 or INT4) to save VRAM", "Multiplying layers by 4", "Training with more datasets", "Encrypting prompt responses"], correct: 0, tip: "Quantization reduces memory footprint and enables running larger models on consumer hardware." },
        { id: "llm5", question: "What is the purpose of 'System Prompts' in chat models?", options: ["To define persistent behavior, persona, rules, and constraints for the conversation", "To reboot the server", "To measure latency", "To compile CSS"], correct: 0, tip: "System prompts set the guiding boundaries and behavioral persona." }
      ]
    }

    if (t.includes("mcp")) {
      return [
        { id: "mcp1", question: "What does MCP stand for in modern AI tooling?", options: ["Multi-Cloud Protocol", "Model Context Protocol", "Memory Cache Processing", "Machine Core Pipeline"], correct: 1, tip: "Model Context Protocol is an open standard connecting AI models to data sources and tools." },
        { id: "mcp2", question: "In the MCP architecture, what are the primary building blocks exposed by an MCP Server?", options: ["CSS animations and cookies", "Tools, Resources, and Prompts", "Docker images and VMs", "SQL databases only"], correct: 1, tip: "MCP servers provide Tools (actions), Resources (readable data), and Prompts (templates)." },
        { id: "mcp3", question: "How does an MCP Client interact with an MCP Server securely?", options: ["Through standardized JSON-RPC over transports like stdio or SSE", "Direct raw memory pointers", "By copying binary files", "Via unencrypted telnet"], correct: 0, tip: "MCP uses JSON-RPC 2.0 communication over standard input/output (stdio) or Server-Sent Events (SSE)." },
        { id: "mcp4", question: "What advantage does MCP provide over proprietary tool-calling SDKs?", options: ["Vendors can share one open interface across IDEs, chatbots, and agents without custom glue code", "It increases LLM training speed", "It eliminates the need for prompts", "It replaces all APIs"], correct: 0, tip: "MCP creates universal interoperability between any AI client and any tool server." },
        { id: "mcp5", question: "What defines an MCP 'Resource' vs an MCP 'Tool'?", options: ["Resources are passive readable context (like files); Tools are callable actions that do things", "They are identical", "Resources only run on Windows", "Tools cannot accept arguments"], correct: 0, tip: "Resources expose data for reading; Tools accept parameters to execute side effects or operations." }
      ]
    }

    if (t.includes("rag") || t.includes("vector") || t.includes("embedding")) {
      return [
        { id: "rag1", question: "Why is semantic chunking often superior to fixed-size character chunking in RAG?", options: ["It uses zero disk space", "It keeps coherent ideas and sentences intact rather than arbitrarily cutting words", "It removes all punctuation", "It skips embedding generation"], correct: 1, tip: "Semantic chunking respects paragraph and conceptual boundaries, improving retrieval precision." },
        { id: "rag2", question: "What algorithm is most commonly used for Approximate Nearest Neighbor (ANN) vector indexing?", options: ["HNSW (Hierarchical Navigable Small World)", "Bubble Sort", "Dijkstra algorithm", "B-Tree index"], correct: 0, tip: "HNSW is the gold standard for high-speed, high-recall vector similarity searches." },
        { id: "rag3", question: "What role does a 'Cross-Encoder / Reranker' play after initial vector retrieval?", options: ["Compresses the database", "Re-scores candidate chunks with full joint attention to identify the most relevant excerpts", "Translates language to French", "Deletes redundant vectors"], correct: 1, tip: "Rerankers evaluate query and passage together, achieving higher semantic precision than vector cosine similarity alone." },
        { id: "rag4", question: "What metric is most frequently used to measure distance between normalized dense vector embeddings?", options: ["Cosine similarity", "Levenshtein distance", "Hamming distance", "Entropy difference"], correct: 0, tip: "Cosine similarity measures the angle between directional embeddings in high-dimensional space." },
        { id: "rag5", question: "What is 'Hallucination Mitigation' in RAG systems?", options: ["Instructing the model to cite retrieved passages and abstain if facts are missing", "Doubling prompt length", "Removing temperature setting", "Increasing vector dimensions"], correct: 0, tip: "Grounding responses strictly on retrieved context prevents generative hallucinations." }
      ]
    }

    if (t.includes("deep learning") || t.includes("nlp") || t.includes("vision")) {
      return [
        { id: "dl1", question: "What problem does the Vanishing Gradient problem cause during backpropagation?", options: ["Early layers learn extremely slowly because gradients shrink exponentially", "Gradients become infinity instantly", "Memory leaks in GPUs", "Loss becomes negative"], correct: 0, tip: "Vanishing gradients hinder deep network convergence, solved in part by ReLUs and residual connections." },
        { id: "dl2", question: "Why are Residual Connections (Skip Connections) effective in deep architectures like ResNet?", options: ["They allow gradients to propagate directly through identity shortcuts", "They remove the need for activation functions", "They double the number of parameters", "They convert CNNs to RNNs"], correct: 0, tip: "Skip connections provide highway paths for gradient flow, enabling networks hundreds of layers deep." },
        { id: "dl3", question: "What is the primary mechanism that powers Transformer architectures?", options: ["Multi-Head Self-Attention", "Recurrent LSTM cells", "Max Pooling filters", "Genetic mutation"], correct: 0, tip: "Self-attention computes dynamic weights between all token pairs in parallel." },
        { id: "dl4", question: "What is the purpose of Adam optimizer compared to standard SGD?", options: ["It adapts individual learning rates for each parameter using momentum and squared gradients", "It only trains on CPU", "It eliminates batching", "It guarantees 100% test accuracy"], correct: 0, tip: "Adam combines momentum and RMSprop for faster, adaptive parameter optimization." },
        { id: "dl5", question: "What does Transfer Learning allow ML practitioners to do?", options: ["Fine-tune a large pre-trained model on domain-specific data with less compute", "Transfer code from Python to Java", "Train models without data", "Skip validation"], correct: 0, tip: "Transfer learning leverages representations learned from vast datasets for specific downstream tasks." }
      ]
    }

    if (t.includes("mlops") || t.includes("evaluation")) {
      return [
        { id: "ops1", question: "What is 'Data Drift' in machine learning production systems?", options: ["When the distribution of incoming inference data shifts away from training data", "When files are deleted from S3", "Slow hard drive read speeds", "Syntax errors in code"], correct: 0, tip: "Data drift happens when real-world input distributions diverge from what the model was trained on." },
        { id: "ops2", question: "What is the primary role of MLflow or Weights & Biases?", options: ["Experiment tracking, hyperparameter logging, and model artifact versioning", "Writing frontend React components", "Generating vector embeddings", "Replacing Docker"], correct: 0, tip: "Experiment tracking frameworks log parameters, metrics, code versions, and trained weights." },
        { id: "ops3", question: "What is a 'Canary Deployment' for an ML model?", options: ["Routing a small fraction of real production traffic to a new model to verify stability", "Deploying only on weekends", "Testing only locally", "Shutting down the previous server immediately"], correct: 0, tip: "Canary releases validate new models safely on live users before full rollout." },
        { id: "ops4", question: "What does Precision measure in classification metrics?", options: ["Of all positive predictions, how many were actually correct", "Of all real positives, how many did the model find", "Training step latency", "Model weight size"], correct: 0, tip: "Precision = True Positives / (True Positives + False Positives)." },
        { id: "ops5", question: "What does ROC-AUC evaluate?", options: ["The model's ability to discriminate between classes across all possible classification thresholds", "RAM usage", "Loss curve steepness", "Data ingestion rate"], correct: 0, tip: "ROC-AUC evaluates sensitivity vs false positive rate independent of decision thresholds." }
      ]
    }

    if (t.includes("array") || t.includes("string") || t.includes("dsa") || t.includes("tree") || t.includes("graph") || t.includes("dynamic programming")) {
      return [
        { id: "dsa1", question: "What is the optimal time complexity to find if a pair in a sorted array sums to a target?", options: ["O(n) using two pointers", "O(n^2) brute force", "O(n log n)", "O(1)"], correct: 0, tip: "Two pointers starting at opposite ends converge in linear O(n) time." },
        { id: "dsa2", question: "What property defines a Dynamic Programming problem?", options: ["Optimal substructure and overlapping subproblems", "Random execution order", "No memory requirement", "Linear graphs only"], correct: 0, tip: "DP breaks problems into overlapping subproblems whose solutions can be cached." },
        { id: "dsa3", question: "What is the average time complexity of searching a value in a Balanced Binary Search Tree (AVL / Red-Black)?", options: ["O(log n)", "O(n)", "O(1)", "O(n log n)"], correct: 0, tip: "Each comparison eliminates half of the remaining subtree in balanced BSTs." },
        { id: "dsa4", question: "Which traversal explores graph neighbors layer by layer?", options: ["Breadth-First Search (BFS)", "Depth-First Search (DFS)", "In-order Traversal", "Post-order Traversal"], correct: 0, tip: "BFS uses a Queue to explore all nodes at distance k before moving to k+1." },
        { id: "dsa5", question: "What data structure is used to implement a Monotonic Stack?", options: ["A standard stack maintaining strictly increasing or decreasing elements", "A linked list with random pointers", "A binary heap", "A hash table"], correct: 0, tip: "Monotonic stacks solve 'next greater/smaller element' problems in O(n) time." }
      ]
    }

    if (t.includes("system design") || t.includes("architecture") || t.includes("microservice")) {
      return [
        { id: "sd1", question: "According to the CAP Theorem, when a network partition (P) occurs, what must a distributed system choose between?", options: ["Consistency (C) or Availability (A)", "Speed or Storage", "Memory or Disk", "CPU or Bandwidth"], correct: 0, tip: "When network splits occur, systems must prioritize returning fresh data (C) or responding (A)." },
        { id: "sd2", question: "What is the primary role of a Reverse Proxy (e.g. Nginx, Cloudflare)?", options: ["Intercepting client requests to provide load balancing, SSL termination, and security", "Writing database migrations", "Compiling TypeScript", "Managing Git branches"], correct: 0, tip: "Reverse proxies sit between clients and origin servers for routing, caching, and SSL termination." },
        { id: "sd3", question: "What is the 'Cache Stampede' (Thundering Herd) problem?", options: ["When a popular cache key expires and thousands of concurrent requests hammer the DB simultaneously", "When Redis runs out of memory", "When cache writes fail silently", "When disks fill up"], correct: 0, tip: "Cache stampede occurs when high-traffic cache misses overwhelm underlying databases." },
        { id: "sd4", question: "What pattern is recommended to manage distributed transactions across microservices?", options: ["Saga pattern (choreography or orchestration)", "Two-Phase Commit across all services always", "Single shared database table", "Manual human approval"], correct: 0, tip: "Sagas use a sequence of local transactions with compensating rollback actions." },
        { id: "sd5", question: "Why is Database Sharding used?", options: ["To horizontally partition massive datasets across multiple independent database nodes", "To create daily backups", "To convert SQL to NoSQL", "To index columns"], correct: 0, tip: "Sharding splits rows across multiple database servers to scale write throughput and storage." }
      ]
    }

    if (t.includes("docker") || t.includes("kubernetes") || t.includes("cloud") || t.includes("devops")) {
      return [
        { id: "dk1", question: "Why are multi-stage Docker builds recommended?", options: ["They drastically reduce the final image size by discarding build tools and intermediate artifacts", "They make containers run faster in memory", "They encrypt the Dockerfile", "They replace Kubernetes"], correct: 0, tip: "Multi-stage builds copy only compiled artifacts into a lightweight production runtime image." },
        { id: "dk2", question: "What is the smallest deployable compute unit in Kubernetes?", options: ["Pod", "Node", "Cluster", "Service"], correct: 0, tip: "A Pod encapsulates one or more co-located containers sharing network and storage." },
        { id: "dk3", question: "In Kubernetes, what controller ensures a specified number of Pod replicas are always running?", options: ["Deployment / ReplicaSet", "Ingress", "ConfigMap", "DaemonSet"], correct: 0, tip: "ReplicaSets maintain the desired count of active pod replicas, self-healing failures." },
        { id: "dk4", question: "What is Infrastructure as Code (IaC)?", options: ["Managing and provisioning compute/network resources through declarative code files (e.g., Terraform)", "Writing Python scripts manually on servers", "Building web pages", "Configuring email clients"], correct: 0, tip: "IaC enables repeatable, version-controlled cloud infrastructure provisioning." },
        { id: "dk5", question: "What is the purpose of a health check probe (liveness and readiness) in container orchestration?", options: ["To detect crashes and determine when containers are prepared to accept live user traffic", "To check disk temperature", "To bill cloud costs", "To format logs"], correct: 0, tip: "Readiness routes traffic; Liveness restarts unresponsive or deadlocked containers." }
      ]
    }

    // Default high-quality engineering questions
    return [
      { id: "gen1", question: `In modern ${title}, what is considered the primary best practice for maintainability?`, options: ["Clear abstraction, modular components, and separation of concerns", "Writing all logic in a single file for speed", "Avoiding unit tests to deploy faster", "Hardcoding configuration values"], correct: 0, tip: `Modularity and clear separation make ${title} codebases scalable and testable.` },
      { id: "gen2", question: `When debugging an unexpected issue in ${title}, what should be done first?`, options: ["Inspect logs, reproduce with minimal test case, and verify inputs", "Rewrite the entire subsystem from scratch", "Ignore the warnings", "Restart without checking errors"], correct: 0, tip: "Reproducing the error with minimal inputs isolates the exact root cause." },
      { id: "gen3", question: `How do automated tests contribute to long-term velocity in ${title}?`, options: ["They provide safety guards against regressions and make refactoring fearless", "They slow down development permanently", "They eliminate the need for code review", "They replace documentation completely"], correct: 0, tip: "Comprehensive tests allow developers to refactor confidently without breaking features." },
      { id: "gen4", question: `What is the significance of idempotency in API and system operations?`, options: ["Executing the same operation multiple times produces the identical result without duplicate side-effects", "The operation runs in under 1ms", "The operation requires no authentication", "The database automatically backs up"], correct: 0, tip: "Idempotent requests (like PUT or DELETE) can be safely retried upon network timeouts." },
      { id: "gen5", question: `What principle helps prevent technical debt when building ${title}?`, options: ["Continuous refactoring, documentation, and adhering to established code standards", "Shipping code without review", "Using deprecated packages", "Disabling linter rules"], correct: 0, tip: "Consistent small refactors and automated linting keep the codebase healthy over time." }
    ]
  }

  const questions = generateQuestions(topicTitle, categoryName)

  return {
    id: slugOrId,
    slug: norm,
    title: `${topicTitle} Quiz`,
    topic: topicTitle,
    category: categoryName,
    icon: norm.includes("py") ? "python" : norm.includes("js") ? "javascript" : norm.includes("react") ? "react" : norm.includes("sql") ? "database" : norm.includes("ai") ? "brain" : "code",
    color: accent,
    bg: bg,
    difficulty: matchedTopic ? matchedTopic.difficulty : "Medium",
    questionsCount: questions.length,
    durationMinutes: Math.round(questions.length * 2.5),
    xp: questions.length * 20,
    coverTopics: [
      `${topicTitle} Core Architecture`,
      "Practical Implementation & Syntax",
      "Performance & Optimization",
      "Real-world Troubleshooting & Best Practices"
    ],
    beforeStart: [
      `This test evaluates your practical knowledge of ${topicTitle}.`,
      "Read each question and scenario thoroughly before selecting an answer.",
      "Each correct answer earns XP toward your weekly leaderboard ranking.",
      "Good luck! You've got this! 😊"
    ],
    skillProgress: [
      { label: "Core Architecture", pct: 75, color: accent },
      { label: "Practical Syntax", pct: 82, color: "#10B981" },
      { label: "Best Practices", pct: 68, color: "#F59E0B" }
    ],
    questions
  }
}
