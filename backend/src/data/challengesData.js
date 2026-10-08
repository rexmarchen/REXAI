export const DEDICATED_CHALLENGES = [
  {
    id: "ch-1",
    slug: "reverse-string",
    title: "Reverse a String",
    desc: "Write an efficient function to reverse a string handling UTF-8, punctuation, and whitespaces.",
    category: "python",
    tags: ["Python", "Strings", "Algorithms"],
    difficulty: "Easy",
    xp: 50,
    isNew: true,
    locked: false,
    icon: "python",
    language: "python",
    functionName: "reverse_string",
    statement: `### Reverse a String

Implement an efficient string reversal in Python. Your function \`reverse_string(s)\` must handle:
1. Standard ASCII alphanumeric strings.
2. Strings with whitespace, special characters, and punctuation.
3. Empty strings and single-character strings.

#### Example 1:
\`\`\`python
Input: s = "hello"
Output: "olleh"
\`\`\`

#### Example 2:
\`\`\`python
Input: s = "OpenAI 2026"
Output: "6202 IAnepO"
\`\`\`

#### Constraints:
- \`0 <= len(s) <= 10^5\`
- Expected Time Complexity: \`O(N)\`
- Expected Space Complexity: \`O(N)\``,
    starterCode: {
      python: `def reverse_string(s: str) -> str:
    # Write your solution here
    return s[::-1]`,
      javascript: `function reverseString(s) {
    // Write your solution here
    return s.split('').reverse().join('');
}`
    },
    tests: [
      { input: ["hello"], expected: "olleh", isSample: true },
      { input: ["OpenAI 2026"], expected: "6202 IAnepO", isSample: true },
      { input: [""], expected: "", isSample: false },
      { input: ["a"], expected: "a", isSample: false },
      { input: ["racecar"], expected: "racecar", isSample: false }
    ]
  },
  {
    id: "ch-2",
    slug: "debounce-function",
    title: "Debounce Function",
    desc: "Implement a production-grade debounce utility that limits high-frequency function calls.",
    category: "javascript",
    tags: ["JavaScript", "Functions", "Async"],
    difficulty: "Medium",
    xp: 75,
    isNew: false,
    locked: false,
    icon: "javascript",
    language: "javascript",
    functionName: "debounceSimulator",
    statement: `### Debounce Function Utility

In web development, high-frequency events like window resizing, scrolling, and keystroke searching can cause performance bottlenecks.
Implement a debounce executor \`debounceSimulator(callTimestamps, delay)\` that returns the timestamps when the function actually executed.

#### Rules:
- A call executes only after \`delay\` milliseconds have passed without any new invocations.
- If a new call arrives before the delay elapses, the timer resets.

#### Example:
\`\`\`javascript
Input: callTimestamps = [0, 50, 100, 300], delay = 100
Output: [200, 400]
Explanation: Calls at 0, 50, 100 merge and execute at 100 + 100 = 200. Call at 300 executes at 300 + 100 = 400.
\`\`\`

#### Constraints:
- \`0 <= callTimestamps[i] <= 10^6\`
- \`1 <= delay <= 1000\``,
    starterCode: {
      javascript: `function debounceSimulator(callTimestamps, delay) {
    if (!callTimestamps || callTimestamps.length === 0) return [];
    const results = [];
    let pending = callTimestamps[0] + delay;
    
    for (let i = 1; i < callTimestamps.length; i++) {
        if (callTimestamps[i] < pending) {
            pending = callTimestamps[i] + delay;
        } else {
            results.push(pending);
            pending = callTimestamps[i] + delay;
        }
    }
    results.push(pending);
    return results;
}`,
      python: `def debounceSimulator(callTimestamps, delay):
    if not callTimestamps:
        return []
    results = []
    pending = callTimestamps[0] + delay
    for t in callTimestamps[1:]:
        if t < pending:
            pending = t + delay
        else:
            results.append(pending)
            pending = t + delay
    results.append(pending)
    return results`
    },
    tests: [
      { input: [[0, 50, 100, 300], 100], expected: [200, 400], isSample: true },
      { input: [[10, 20, 30], 50], expected: [80], isSample: true },
      { input: [[100, 300, 500], 50], expected: [150, 350, 550], isSample: false }
    ]
  },
  {
    id: "ch-3",
    slug: "valid-anagram",
    title: "Valid Anagram",
    desc: "Check if two strings are anagrams of each other with linear runtime and constant extra space.",
    category: "dsa",
    tags: ["DSA", "Hash Table", "Strings"],
    difficulty: "Medium",
    xp: 75,
    isNew: true,
    locked: false,
    icon: "dsa",
    language: "python",
    functionName: "is_anagram",
    statement: `### Valid Anagram

Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.
An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

#### Example 1:
\`\`\`python
Input: s = "anagram", t = "nagaram"
Output: True
\`\`\`

#### Example 2:
\`\`\`python
Input: s = "rat", t = "car"
Output: False
\`\`\`

#### Constraints:
- \`1 <= len(s), len(t) <= 5 * 10^4\`
- \`s\` and \`t\` consist of lowercase English letters.`,
    starterCode: {
      python: `def is_anagram(s: str, t: str) -> bool:
    # Write your solution here
    if len(s) != len(t):
        return False
    from collections import Counter
    return Counter(s) == Counter(t)`,
      javascript: `function isAnagram(s, t) {
    if (s.length !== t.length) return false;
    return s.split('').sort().join('') === t.split('').sort().join('');
}`
    },
    tests: [
      { input: ["anagram", "nagaram"], expected: true, isSample: true },
      { input: ["rat", "car"], expected: false, isSample: true },
      { input: ["a", "a"], expected: true, isSample: false },
      { input: ["ab", "a"], expected: false, isSample: false }
    ]
  },
  {
    id: "ch-4",
    slug: "find-duplicate-records",
    title: "Find Duplicate Records",
    desc: "Extract duplicate records from database tables and identify frequency anomalies.",
    category: "sql",
    tags: ["SQL", "Data Quality", "Aggregations"],
    difficulty: "Easy",
    xp: 50,
    isNew: false,
    locked: false,
    icon: "sql",
    language: "python",
    functionName: "find_duplicate_emails",
    statement: `### Find Duplicate Records (SQL Logic)

In data engineering and database administration, deduplicating customer profiles is critical.
Write a function \`find_duplicate_emails(records)\` representing a SQL query:
\`\`\`sql
SELECT email FROM Users GROUP BY email HAVING COUNT(email) > 1 ORDER BY email ASC;
\`\`\`

#### Example 1:
\`\`\`python
Input: records = [{"id": 1, "email": "a@b.com"}, {"id": 2, "email": "c@d.com"}, {"id": 3, "email": "a@b.com"}]
Output: ["a@b.com"]
\`\`\`

#### Constraints:
- Return list sorted alphabetically.
- If no duplicates exist, return an empty list \`[]\`.`,
    starterCode: {
      python: `def find_duplicate_emails(records):
    # Write your deduplication logic here
    from collections import Counter
    counts = Counter(r['email'] for r in records)
    return sorted([email for email, count in counts.items() if count > 1])`,
      javascript: `function findDuplicateEmails(records) {
    const counts = {};
    for (const r of records) counts[r.email] = (counts[r.email] || 0) + 1;
    return Object.keys(counts).filter(e => counts[e] > 1).sort();
}`
    },
    tests: [
      {
        input: [[{ id: 1, email: "a@b.com" }, { id: 2, email: "c@d.com" }, { id: 3, email: "a@b.com" }]],
        expected: ["a@b.com"],
        isSample: true
      },
      {
        input: [[{ id: 1, email: "user@rexion.ai" }, { id: 2, email: "admin@rexion.ai" }]],
        expected: [],
        isSample: true
      },
      {
        input: [[{ id: 1, email: "z@z.com" }, { id: 2, email: "m@m.com" }, { id: 3, email: "z@z.com" }, { id: 4, email: "m@m.com" }]],
        expected: ["m@m.com", "z@z.com"],
        isSample: false
      }
    ]
  },
  {
    id: "ch-5",
    slug: "rag-pipeline",
    title: "RAG Pipeline Embeddings",
    desc: "Calculate cosine similarity and retrieve the top-K relevant document chunks for an LLM query.",
    category: "rag",
    tags: ["RAG", "LLMs", "Vector Search"],
    difficulty: "Hard",
    xp: 150,
    isNew: false,
    locked: false,
    icon: "rag",
    language: "python",
    functionName: "rank_documents",
    statement: `### RAG Pipeline: Vector Similarity Ranker

Retrieval-Augmented Generation (RAG) relies on retrieving the most relevant context chunks before sending them to the LLM.
Implement \`rank_documents(query_embedding, doc_embeddings, top_k)\` which calculates the cosine similarity between the query and each document embedding and returns the indices of the top-K highest-ranking documents in descending order.

$$\\text{Cosine Similarity}(A, B) = \\frac{A \\cdot B}{\\|A\\| \\|B\\|}$$

#### Example:
\`\`\`python
Input:
query = [1.0, 0.0]
docs = [[1.0, 0.0], [0.0, 1.0], [0.707, 0.707]]
top_k = 2

Output: [0, 2]
\`\`\`

#### Constraints:
- Vectors have matching non-zero lengths.
- Return indices of top_k results sorted by highest similarity first.`,
    starterCode: {
      python: `import math

def rank_documents(query_embedding, doc_embeddings, top_k=2):
    def dot_product(v1, v2):
        return sum(x * y for x, y in zip(v1, v2))
    def magnitude(v):
        return math.sqrt(sum(x * x for x in v))
        
    q_mag = magnitude(query_embedding)
    scored = []
    for idx, doc in enumerate(doc_embeddings):
        d_mag = magnitude(doc)
        sim = dot_product(query_embedding, doc) / (q_mag * d_mag) if (q_mag * d_mag) > 0 else 0
        scored.append((sim, idx))
        
    scored.sort(key=lambda item: item[0], reverse=True)
    return [idx for _, idx in scored[:top_k]]`,
      javascript: `function rankDocuments(queryEmbedding, docEmbeddings, topK = 2) {
    const dot = (a, b) => a.reduce((sum, val, i) => sum + val * b[i], 0);
    const mag = (v) => Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
    const qMag = mag(queryEmbedding);

    const scored = docEmbeddings.map((doc, idx) => {
        const dMag = mag(doc);
        const sim = (qMag * dMag) > 0 ? dot(queryEmbedding, doc) / (qMag * dMag) : 0;
        return { sim, idx };
    });

    scored.sort((a, b) => b.sim - a.sim);
    return scored.slice(0, topK).map(item => item.idx);
}`
    },
    tests: [
      {
        input: [[1.0, 0.0], [[1.0, 0.0], [0.0, 1.0], [0.707, 0.707]], 2],
        expected: [0, 2],
        isSample: true
      },
      {
        input: [[0.5, 0.5], [[1.0, 1.0], [-1.0, -1.0]], 1],
        expected: [0],
        isSample: true
      }
    ]
  },
  {
    id: "ch-6",
    slug: "design-twitter",
    title: "Design Twitter Feed",
    desc: "Architect a simplified in-memory feed fanout system with follow, post, and 10 most recent tweets.",
    category: "system-design",
    tags: ["System Design", "OOP", "Architecture"],
    difficulty: "Hard",
    xp: 200,
    isNew: false,
    locked: false,
    icon: "system-design",
    language: "python",
    functionName: "simulate_feed",
    statement: `### Design In-Memory Newsfeed (Twitter Architecture)

Design a simplified newsfeed system where users can post tweets, follow/unfollow others, and view the 10 most recent tweet IDs in their feed.
Implement \`simulate_feed(actions)\` where actions is a list of commands:
- \`["post", userId, tweetId]\`
- \`["getFeed", userId]\` -> returns up to 10 most recent tweet IDs (from self and followees) ordered newest first.
- \`["follow", followerId, followeeId]\`
- \`["unfollow", followerId, followeeId]\`

#### Example:
\`\`\`python
actions = [
  ["post", 1, 5],
  ["getFeed", 1],
  ["follow", 1, 2],
  ["post", 2, 6],
  ["getFeed", 1]
]
Output: [[5], [6, 5]]
\`\`\``,
    starterCode: {
      python: `def simulate_feed(actions):
    from collections import defaultdict
    tweets = [] # (userId, tweetId)
    followers = defaultdict(set)
    feed_results = []
    
    for act in actions:
        cmd = act[0]
        if cmd == "post":
            tweets.append((act[1], act[2]))
        elif cmd == "follow":
            followers[act[1]].add(act[2])
        elif cmd == "unfollow":
            followers[act[1]].discard(act[2])
        elif cmd == "getFeed":
            u = act[1]
            allowed = followers[u] | {u}
            feed = []
            for author, twId in reversed(tweets):
                if author in allowed:
                    feed.append(twId)
                if len(feed) == 10:
                    break
            feed_results.append(feed)
    return feed_results`,
      javascript: `function simulateFeed(actions) {
    const tweets = [];
    const followers = {};
    const feedResults = [];

    for (const act of actions) {
        const [cmd, u1, u2] = act;
        if (cmd === 'post') {
            tweets.push({ userId: u1, tweetId: u2 });
        } else if (cmd === 'follow') {
            if (!followers[u1]) followers[u1] = new Set();
            followers[u1].add(u2);
        } else if (cmd === 'unfollow') {
            if (followers[u1]) followers[u1].delete(u2);
        } else if (cmd === 'getFeed') {
            const allowed = new Set(followers[u1] ? Array.from(followers[u1]) : []);
            allowed.add(u1);
            const feed = [];
            for (let i = tweets.length - 1; i >= 0; i--) {
                if (allowed.has(tweets[i].userId)) {
                    feed.push(tweets[i].tweetId);
                }
                if (feed.length === 10) break;
            }
            feedResults.push(feed);
        }
    }
    return feedResults;
}`
    },
    tests: [
      {
        input: [[["post", 1, 5], ["getFeed", 1], ["follow", 1, 2], ["post", 2, 6], ["getFeed", 1]]],
        expected: [[5], [6, 5]],
        isSample: true
      },
      {
        input: [[["post", 1, 101], ["unfollow", 1, 2], ["getFeed", 1]]],
        expected: [[101]],
        isSample: true
      }
    ]
  },
  {
    id: "ch-7",
    slug: "data-analysis-pandas",
    title: "Data Analysis: Sales Metrics",
    desc: "Calculate total revenue, highest margin department, and average order value from sales records.",
    category: "python",
    tags: ["Python", "Data Analysis", "Analytics"],
    difficulty: "Medium",
    xp: 75,
    isNew: false,
    locked: false,
    icon: "python",
    language: "python",
    functionName: "analyze_sales",
    statement: `### Data Analysis: Business Sales Metrics

Write a function \`analyze_sales(transactions)\` that computes high-level financial KPIs from a list of sales dicts.
Each transaction has \`{"item": str, "category": str, "price": float, "quantity": int}\`.

Your function should return a dict:
\`\`\`python
{
  "total_revenue": round(sum(price * quantity), 2),
  "top_category": category_with_highest_revenue,
  "total_items_sold": sum(quantity)
}
\`\`\`

#### Example:
\`\`\`python
Input: [
  {"item": "Laptop", "category": "Electronics", "price": 1000.0, "quantity": 2},
  {"item": "Desk", "category": "Furniture", "price": 300.0, "quantity": 1}
]
Output: {"total_revenue": 2300.0, "top_category": "Electronics", "total_items_sold": 3}
\`\`\``,
    starterCode: {
      python: `def analyze_sales(transactions):
    from collections import defaultdict
    if not transactions:
        return {"total_revenue": 0.0, "top_category": "", "total_items_sold": 0}
        
    total_rev = 0.0
    total_items = 0
    cat_rev = defaultdict(float)
    
    for t in transactions:
        rev = t["price"] * t["quantity"]
        total_rev += rev
        total_items += t["quantity"]
        cat_rev[t["category"]] += rev
        
    top_cat = max(cat_rev.items(), key=lambda x: x[1])[0]
    return {
        "total_revenue": round(total_rev, 2),
        "top_category": top_cat,
        "total_items_sold": total_items
    }`,
      javascript: `function analyzeSales(transactions) {
    if (!transactions || transactions.length === 0) {
        return { total_revenue: 0.0, top_category: '', total_items_sold: 0 };
    }
    let totalRev = 0;
    let totalItems = 0;
    const catRev = {};

    for (const t of transactions) {
        const rev = t.price * t.quantity;
        totalRev += rev;
        totalItems += t.quantity;
        catRev[t.category] = (catRev[t.category] || 0) + rev;
    }

    let topCat = '';
    let maxRev = -1;
    for (const cat in catRev) {
        if (catRev[cat] > maxRev) {
            maxRev = catRev[cat];
            topCat = cat;
        }
    }

    return {
        total_revenue: Math.round(totalRev * 100) / 100,
        top_category: topCat,
        total_items_sold: totalItems
    };
}`
    },
    tests: [
      {
        input: [[
          { item: "Laptop", category: "Electronics", price: 1000.0, quantity: 2 },
          { item: "Desk", category: "Furniture", price: 300.0, quantity: 1 }
        ]],
        expected: { total_revenue: 2300.0, top_category: "Electronics", total_items_sold: 3 },
        isSample: true
      },
      {
        input: [[{ item: "Coffee", category: "Beverages", price: 4.5, quantity: 10 }]],
        expected: { total_revenue: 45.0, top_category: "Beverages", total_items_sold: 10 },
        isSample: true
      }
    ]
  },
  {
    id: "ch-8",
    slug: "dockerfile-optimization",
    title: "Dockerfile Optimization",
    desc: "Reorder container directives to maximize layer caching and minimize rebuild time.",
    category: "devops",
    tags: ["DevOps", "Docker", "Containers"],
    difficulty: "Medium",
    xp: 75,
    isNew: false,
    locked: false,
    icon: "devops",
    language: "python",
    functionName: "optimize_dockerfile_steps",
    statement: `### Dockerfile Layer Cache Optimizer

In continuous integration (CI/CD), layer order dictates cache invalidation. Directives that change rarely (like \`package.json\` copying and dependency installation) must come before application source code copying.

Write a function \`optimize_dockerfile_steps(steps)\` that accepts an unordered list of Docker instructions and outputs them ordered in the canonical optimal caching sequence:
1. \`FROM\`
2. \`WORKDIR\`
3. \`COPY package*\` / dependency manifests
4. \`RUN npm install\` / dependency install
5. \`COPY .\` / application source
6. \`EXPOSE\`
7. \`CMD\` / \`ENTRYPOINT\`

#### Example:
\`\`\`python
Input: ["CMD npm start", "COPY . .", "FROM node:18", "RUN npm install", "COPY package.json .", "WORKDIR /app"]
Output: ["FROM node:18", "WORKDIR /app", "COPY package.json .", "RUN npm install", "COPY . .", "CMD npm start"]
\`\`\``,
    starterCode: {
      python: `def optimize_dockerfile_steps(steps):
    def get_priority(step):
        s = step.strip().upper()
        if s.startswith("FROM"): return 1
        if s.startswith("WORKDIR"): return 2
        if s.startswith("COPY PACKAGE") or s.startswith("COPY REQUIREMENTS"): return 3
        if s.startswith("RUN NPM INSTALL") or s.startswith("RUN PIP"): return 4
        if s.startswith("COPY"): return 5
        if s.startswith("EXPOSE"): return 6
        if s.startswith("CMD") or s.startswith("ENTRYPOINT"): return 7
        return 8
        
    return sorted(steps, key=get_priority)`,
      javascript: `function optimizeDockerfileSteps(steps) {
    const priority = (step) => {
        const s = step.trim().toUpperCase();
        if (s.startsWith('FROM')) return 1;
        if (s.startsWith('WORKDIR')) return 2;
        if (s.startsWith('COPY PACKAGE') || s.startsWith('COPY REQUIREMENTS')) return 3;
        if (s.startsWith('RUN NPM INSTALL') || s.startsWith('RUN PIP')) return 4;
        if (s.startsWith('COPY')) return 5;
        if (s.startsWith('EXPOSE')) return 6;
        if (s.startsWith('CMD') || s.startsWith('ENTRYPOINT')) return 7;
        return 8;
    };
    return [...steps].sort((a, b) => priority(a) - priority(b));
}`
    },
    tests: [
      {
        input: [["CMD npm start", "COPY . .", "FROM node:18", "RUN npm install", "COPY package.json .", "WORKDIR /app"]],
        expected: ["FROM node:18", "WORKDIR /app", "COPY package.json .", "RUN npm install", "COPY . .", "CMD npm start"],
        isSample: true
      }
    ]
  },
  {
    id: "ch-9",
    slug: "responsive-navbar",
    title: "Build Responsive Navigation",
    desc: "Generate navigation layout state based on viewport width breakpoints.",
    category: "web-dev",
    tags: ["Web Development", "Responsive", "UI"],
    difficulty: "Easy",
    xp: 50,
    isNew: false,
    locked: false,
    icon: "web-dev",
    language: "javascript",
    functionName: "getNavLayout",
    statement: `### Responsive Navbar State Manager

In modern web development, navigation components adapt dynamically between mobile hamburger menus and desktop horizontal bars based on screen width.
Write a function \`getNavLayout(viewportWidth, isOpen)\` returning a state object:
- If \`viewportWidth >= 768\`: \`{ mode: "desktop", showLinks: true, showHamburger: false }\`
- If \`viewportWidth < 768\`: \`{ mode: "mobile", showLinks: isOpen, showHamburger: true }\`

#### Example:
\`\`\`javascript
Input: viewportWidth = 1024, isOpen = false
Output: { mode: "desktop", showLinks: true, showHamburger: false }
\`\`\``,
    starterCode: {
      javascript: `function getNavLayout(viewportWidth, isOpen) {
    if (viewportWidth >= 768) {
        return { mode: "desktop", showLinks: true, showHamburger: false };
    }
    return { mode: "mobile", showLinks: Boolean(isOpen), showHamburger: true };
}`,
      python: `def getNavLayout(viewportWidth, isOpen):
    if viewportWidth >= 768:
        return {"mode": "desktop", "showLinks": True, "showHamburger": False}
    return {"mode": "mobile", "showLinks": bool(isOpen), "showHamburger": True}`
    },
    tests: [
      {
        input: [1024, false],
        expected: { mode: "desktop", showLinks: true, showHamburger: false },
        isSample: true
      },
      {
        input: [375, true],
        expected: { mode: "mobile", showLinks: true, showHamburger: true },
        isSample: true
      },
      {
        input: [375, false],
        expected: { mode: "mobile", showLinks: false, showHamburger: true },
        isSample: false
      }
    ]
  },
  {
    id: "ch-10",
    slug: "api-rate-limiter",
    title: "API Rate Limiting Shield",
    desc: "Implement a sliding-window rate limiter protecting microservices from request bursts.",
    category: "python",
    tags: ["Python", "Networking", "Security"],
    difficulty: "Medium",
    xp: 80,
    isNew: true,
    locked: false,
    icon: "python",
    language: "python",
    functionName: "rate_limiter_check",
    statement: `### API Rate Limiting Shield

Write a function \`rate_limiter_check(client_requests, window_size, max_requests)\` that accepts a sorted list of request timestamps (in seconds) and returns a list of booleans indicating whether each request was \`True\` (allowed) or \`False\` (rate-limited).

#### Rule:
A request at time \`t\` is allowed if strictly fewer than \`max_requests\` were allowed in the interval \`[t - window_size + 1, t]\`.

#### Example:
\`\`\`python
Input: requests = [1, 2, 2, 3, 10], window = 3, max_requests = 2
Output: [True, True, False, False, True]
\`\`\``,
    starterCode: {
      python: `def rate_limiter_check(client_requests, window_size, max_requests):
    allowed_timestamps = []
    results = []
    
    for req in client_requests:
        # Keep only timestamps in window
        allowed_timestamps = [t for t in allowed_timestamps if t > req - window_size]
        if len(allowed_timestamps) < max_requests:
            allowed_timestamps.append(req)
            results.append(True)
        else:
            results.append(False)
    return results`,
      javascript: `function rateLimiterCheck(clientRequests, windowSize, maxRequests) {
    let allowed = [];
    const results = [];
    for (const req of clientRequests) {
        allowed = allowed.filter(t => t > req - windowSize);
        if (allowed.length < maxRequests) {
            allowed.push(req);
            results.push(true);
        } else {
            results.push(false);
        }
    }
    return results;
}`
    },
    tests: [
      {
        input: [[1, 2, 2, 3, 10], 3, 2],
        expected: [true, true, false, false, true],
        isSample: true
      },
      {
        input: [[1, 1, 1], 5, 2],
        expected: [true, true, false],
        isSample: true
      }
    ]
  },
  {
    id: "ch-11",
    slug: "deep-clone-object",
    title: "Deep Clone Object",
    desc: "Implement a recursive deep clone utility in JavaScript that preserves nested objects and arrays.",
    category: "javascript",
    tags: ["JavaScript", "Utilities", "Memory"],
    difficulty: "Medium",
    xp: 75,
    isNew: false,
    locked: false,
    icon: "javascript",
    language: "javascript",
    functionName: "deepClone",
    statement: `### Deep Clone Object Utility

In JavaScript, shallow copies (\`Object.assign\` or spread \`{...obj}\`) only duplicate top-level references.
Write a function \`deepClone(obj)\` that returns a completely decoupled deep clone of any nested JSON-compatible object or array.

#### Example:
\`\`\`javascript
const original = { a: 1, b: { c: [2, 3] } };
const clone = deepClone(original);
clone.b.c.push(4);
// original.b.c remains [2, 3]
\`\`\``,
    starterCode: {
      javascript: `function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
    }
    const cloned = {};
    for (const key of Object.keys(obj)) {
        cloned[key] = deepClone(obj[key]);
    }
    return cloned;
}`,
      python: `def deepClone(obj):
    import copy
    return copy.deepcopy(obj)`
    },
    tests: [
      {
        input: [{ a: 1, b: { c: [2, 3] } }],
        expected: { a: 1, b: { c: [2, 3] } },
        isSample: true
      },
      {
        input: [[1, [2, [3]]]],
        expected: [1, [2, [3]]],
        isSample: true
      }
    ]
  },
  {
    id: "ch-12",
    slug: "jwt-sanitizer",
    title: "JWT Payload Validator",
    desc: "Inspect token claims, verify expiration windows, and sanitize sensitive user attributes.",
    category: "other",
    tags: ["Security", "Authentication", "Validation"],
    difficulty: "Easy",
    xp: 50,
    isNew: true,
    locked: false,
    icon: "other",
    language: "python",
    functionName: "validate_jwt_claims",
    statement: `### JWT Claims Validator & Sanitizer

Implement a security function \`validate_jwt_claims(payload, current_timestamp)\` that inspects token claims:
1. Returns \`{"valid": False, "sanitized": None}\` if \`exp\` (expiration) is present and \`exp <= current_timestamp\`.
2. Strips out forbidden keys (\`"password_hash"\`, \`"secret_key"\`) from the payload if present.
3. Returns \`{"valid": True, "sanitized": cleaned_dict}\`.

#### Example:
\`\`\`python
Input:
payload = {"sub": "user_123", "role": "admin", "exp": 1700000000, "password_hash": "abc"}
current_time = 1690000000

Output:
{"valid": True, "sanitized": {"sub": "user_123", "role": "admin", "exp": 1700000000}}
\`\`\``,
    starterCode: {
      python: `def validate_jwt_claims(payload, current_timestamp):
    if not payload:
        return {"valid": False, "sanitized": None}
    if "exp" in payload and payload["exp"] <= current_timestamp:
        return {"valid": False, "sanitized": None}
    
    forbidden = {"password_hash", "secret_key"}
    sanitized = {k: v for k, v in payload.items() if k not in forbidden}
    return {"valid": True, "sanitized": sanitized}`,
      javascript: `function validateJwtClaims(payload, currentTimestamp) {
    if (!payload) return { valid: false, sanitized: null };
    if (payload.exp && payload.exp <= currentTimestamp) {
        return { valid: false, sanitized: null };
    }
    const forbidden = new Set(['password_hash', 'secret_key']);
    const sanitized = {};
    for (const key of Object.keys(payload)) {
        if (!forbidden.has(key)) sanitized[key] = payload[key];
    }
    return { valid: true, sanitized };
}`
    },
    tests: [
      {
        input: [{ sub: "user_123", role: "admin", exp: 1700000000, password_hash: "abc" }, 1690000000],
        expected: { valid: true, sanitized: { sub: "user_123", role: "admin", exp: 1700000000 } },
        isSample: true
      },
      {
        input: [{ sub: "user_123", exp: 1600000000 }, 1690000000],
        expected: { valid: false, sanitized: null },
        isSample: true
      }
    ]
  }
]
