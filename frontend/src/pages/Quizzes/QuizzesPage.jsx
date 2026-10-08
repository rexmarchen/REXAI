import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Home, GraduationCap, BookOpen, Target, Layers, Flame, Code2, Sparkles,
  Network, Trophy, Clock, Settings, Headphones, Search, Bell,
  ChevronRight, ChevronDown, Star, ArrowRight,
  Check, FileCode, Terminal, Database, Cpu, Layers2,
  ClipboardList, Crosshair, FileText, Copy,
  TrendingUp, BarChart2, Zap, X
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { getStoredUser } from "../../utils/authSession"
import profileApi from "../../services/profileApi"
import quizApi from "../../services/quizApi"
import heroDeskAsset from "../../assets/quizzes_hero_desk.jpg"
import styles from "./QuizzesPage.module.css"
import { CATEGORIES_LIST, CATEGORY_CATALOG, normalizeCategory, getCustomTopicQuiz } from "./quizCatalog"
import CareerTrackModal from "../../components/common/CareerTrackModal/CareerTrackModal"

const resolveImageUrl = (url) => {
  if (!url) return ""
  const t = String(url).trim()
  if (t.startsWith("data:") || t.startsWith("http") || t.startsWith("blob:")) return t
  if (t.startsWith("/uploads")) {
    const b = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api"
    return `${b.replace(/\/api\/?$/, "")}${t}`
  }
  return t
}
const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`

const TopicLogo = ({ type, size=38 }) => {
  const s = { width: size, height: size, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 800 }
  const m = {
    python: <div style={{ ...s, background: "#EEF4FD", color: "#3776AB", fontSize: "1.3rem" }}>🐍</div>,
    javascript: <div style={{ ...s, background: "#FEF9E7", color: "#B48805", fontSize: "1rem" }}>JS</div>,
    react: <div style={{ ...s, background: "#EEF7FF", color: "#0284C7", fontSize: "1.3rem" }}>⚛️</div>,
    database: <div style={{ ...s, background: "#EFF4FE", color: "#2563EB" }}><Database size={size>40?22:16} /></div>,
    git: <div style={{ ...s, background: "#FEF2F2", color: "#DC2626", fontSize: "1.2rem" }}>🌿</div>,
    brain: <div style={{ ...s, background: "#F5F3FF", color: "#7C3AED" }}><Cpu size={size>40?22:16} /></div>,
    "search-ai": <div style={{ ...s, background: "#ECFDF5", color: "#059669" }}><Search size={size>40?22:16} /></div>,
    code: <div style={{ ...s, background: "#FEF3EB", color: "#D96B43" }}><Code2 size={size>40?22:16} /></div>,
  }
  return m[type] || <div style={{ ...s, background: "#FEF3EB", color: "#D96B43" }}><Layers2 size={size>40?22:16} /></div>
}

const DonutChart = ({ percentage=72, size=80, stroke=7, color="#10B981" }) => {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className={styles.donutWrapper}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle stroke="#EAE4DA" strokeWidth={stroke} fill="transparent" r={r} cx={size/2} cy={size/2} />
        <circle stroke={color} strokeWidth={stroke} strokeDasharray={c}
          strokeDashoffset={c-(percentage/100)*c} strokeLinecap="round"
          fill="transparent" r={r} cx={size/2} cy={size/2}
          style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <div className={styles.donutScore}>{percentage}%</div>
    </div>
  )
}

const ProgressBar = ({ value, max, color="#D96B43" }) => (
  <div style={{ background: "#EAE4DA", borderRadius: 999, height: 7, overflow: "hidden", flex: 1 }}>
    <div style={{ width: `${Math.min((value/max)*100,100)}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.5s ease" }} />
  </div>
)

const TOPIC_DATA = {
  "python-basics": {
    title:"Python Basics Quiz", topic:"Python", icon:"python", color:"#3776AB", bg:"#EEF4FD",
    category:"Development", difficulty:"Medium", questionsCount:5, durationMinutes:12, xp:100,
    coverTopics:["Variables & Data Types","Operators","Control Flow","Functions","Lists & Tuples","Dictionaries","Input & Output","Basic Problem Solving"],
    beforeStart:["Make sure you have a stable internet connection.","You can take this quiz only once.","Use the code editor for coding questions (if any).","Good luck! You have got this! 😊"],
    skillProgress:[{label:"Variables & Data Types",pct:85,color:"#D96B43"},{label:"Operators",pct:78,color:"#10B981"},{label:"Control Flow",pct:74,color:"#6366F1"},{label:"Functions",pct:68,color:"#F59E0B"}],
    questions:[
      {id:"py1",question:"What will be the output of the following code?",code:"x = [1, 2, 3]\ny = x\nx.append(4)\nprint(y)",language:"python",options:["[1, 2, 3]","[1, 2, 3, 4]","[1, 2, 3, 4, 4]","Error"],correct:1,tip:"In Python, lists are mutable, and assigning a list to another variable creates a reference, not a copy."},
      {id:"py2",question:"Which is the correct way to create a dictionary in Python?",options:["dict = [1: 'a']","dict = {1: 'a', 2: 'b'}","dict = (1: 'a')","dict = <1: 'a'>"],correct:1,tip:"Dictionaries use curly braces {} with key-value pairs separated by colons."},
      {id:"py3",question:"What does len('Hello') return?",options:["4","5","6","None"],correct:1,tip:"len() returns the number of characters. 'Hello' has 5 characters."},
      {id:"py4",question:"What is the output of print(type(3.14))?",options:["<class 'int'>","<class 'float'>","<class 'double'>","<class 'decimal'>"],correct:1,tip:"3.14 is a floating-point number, its type is float."},
      {id:"py5",question:"Which keyword defines a function in Python?",options:["function","fun","def","define"],correct:2,tip:"`def` is the keyword used to define a function in Python."}
    ]
  },
  "javascript-modern": {
    title:"JavaScript Essentials Quiz", topic:"JavaScript", icon:"javascript", color:"#B48805", bg:"#FEF9E7",
    category:"Development", difficulty:"Medium", questionsCount:5, durationMinutes:14, xp:100,
    coverTopics:["Variables & Scope","ES6+ Features","Promises & Async","DOM Manipulation","Array Methods","Closures","Event Loop","Prototypes"],
    beforeStart:["This quiz covers modern ES6+ JavaScript syntax.","You can take this quiz only once per session.","Code snippets may be included — read carefully.","Good luck! You have got this! 😊"],
    skillProgress:[{label:"ES6+ Syntax",pct:80,color:"#F59E0B"},{label:"Promises & Async",pct:65,color:"#D96B43"},{label:"Array Methods",pct:88,color:"#10B981"},{label:"Closures",pct:55,color:"#6366F1"}],
    questions:[
      {id:"js1",question:"What is the output of the following?",code:"const arr = [1, 2, 3];\nconsole.log(arr.map(x => x * 2));",language:"javascript",options:["[1, 2, 3]","[2, 4, 6]","[1, 4, 9]","undefined"],correct:1,tip:".map() creates a new array by applying the callback to each element."},
      {id:"js2",question:"Which creates a Promise that resolves immediately?",options:["new Promise()","Promise.resolve()","Promise.reject()","async function(){}"],correct:1,tip:"Promise.resolve() returns a Promise object that is already resolved."},
      {id:"js3",question:"What does typeof null return in JavaScript?",options:["'null'","'undefined'","'object'","'boolean'"],correct:2,tip:"This is a well-known JS bug — typeof null returns 'object' due to legacy reasons."},
      {id:"js4",question:"What is the difference between let and var?",options:["No difference","let is block-scoped, var is function-scoped","var is block-scoped, let is function-scoped","let cannot be reassigned"],correct:1,tip:"let respects block scope; var is function-scoped."},
      {id:"js5",question:"What is a closure in JavaScript?",options:["A function that returns another function","A function with access to outer scope variables after the outer function returns","A sealed object","An IIFE pattern"],correct:1,tip:"Closures allow inner functions to access variables from their enclosing scope even after the outer function has returned."}
    ]
  },
  "react-components-hooks": {
    title:"React Hooks & Components Quiz", topic:"React", icon:"react", color:"#0284C7", bg:"#EEF7FF",
    category:"Development", difficulty:"Medium", questionsCount:5, durationMinutes:14, xp:100,
    coverTopics:["useState","useEffect","useRef","Custom Hooks","Component Lifecycle","Props & State","Context API","Performance"],
    beforeStart:["This quiz covers React 18+ concepts.","Hooks are the primary focus.","No coding environment needed.","Good luck! 😊"],
    skillProgress:[{label:"useState / useEffect",pct:82,color:"#0284C7"},{label:"Custom Hooks",pct:60,color:"#D96B43"},{label:"Context API",pct:70,color:"#10B981"},{label:"Performance",pct:55,color:"#F59E0B"}],
    questions:[
      {id:"r1",question:"Which hook performs side effects in a functional component?",options:["useState","useEffect","useRef","useMemo"],correct:1,tip:"useEffect lets you perform side effects like fetching data or DOM mutations."},
      {id:"r2",question:"What does the dependency array in useEffect control?",options:["Number of renders","When the effect runs","The component state","Props validation"],correct:1,tip:"The dependency array tells React to re-run the effect when those values change."},
      {id:"r3",question:"Which hook accesses a DOM element directly?",options:["useState","useEffect","useRef","useCallback"],correct:2,tip:"useRef returns a mutable ref object whose .current holds the DOM element."},
      {id:"r4",question:"How to share state between deeply nested components without prop drilling?",options:["Redux only","Context API","useEffect","useState"],correct:1,tip:"Context API lets you share values across the component tree without props."},
      {id:"r5",question:"Correct way to update state based on the previous state?",code:"const [count, setCount] = useState(0);",language:"javascript",options:["setCount(count + 1)","setCount(prev => prev + 1)","count = count + 1","setCount(setState + 1)"],correct:1,tip:"Using the functional form prev => prev + 1 ensures you use the latest state value."}
    ]
  },
  "machine-learning-fundamentals": {
    title:"Machine Learning Fundamentals", topic:"Machine Learning", icon:"brain", color:"#7C3AED", bg:"#F5F3FF",
    category:"AI / ML", difficulty:"Hard", questionsCount:5, durationMinutes:18, xp:150,
    coverTopics:["Supervised Learning","Unsupervised Learning","Model Evaluation","Overfitting","Neural Networks","Gradient Descent","Feature Engineering","Bias-Variance Tradeoff"],
    beforeStart:["Covers core ML theory and concepts.","Some math knowledge is expected.","Read each question carefully.","Good luck! 😊"],
    skillProgress:[{label:"Supervised Learning",pct:75,color:"#7C3AED"},{label:"Model Evaluation",pct:62,color:"#D96B43"},{label:"Neural Networks",pct:50,color:"#10B981"},{label:"Feature Engineering",pct:68,color:"#F59E0B"}],
    questions:[
      {id:"ml1",question:"Which technique helps prevent overfitting in a neural network?",options:["Increasing model complexity","Dropout regularization","Removing validation data","Using larger batches only"],correct:1,tip:"Dropout randomly disables neurons during training, preventing overfitting."},
      {id:"ml2",question:"What does the F1 score measure?",options:["Accuracy alone","Harmonic mean of precision and recall","Only precision","Model training speed"],correct:1,tip:"F1 = 2 * (Precision * Recall) / (Precision + Recall). It balances both metrics."},
      {id:"ml3",question:"What does the learning rate control in gradient descent?",options:["Number of epochs","Size of steps toward the minimum","Number of features","Regularization strength"],correct:1,tip:"High learning rate = overshooting; low learning rate = slow convergence."},
      {id:"ml4",question:"Which algorithm is used for clustering (unsupervised learning)?",options:["Linear Regression","K-Means","SVM","Decision Tree"],correct:1,tip:"K-Means partitions data into K clusters based on proximity to centroids."},
      {id:"ml5",question:"What is the bias-variance tradeoff?",options:["More data always fixes both","Complex models reduce bias but increase variance","Simple models have high variance","Only applies to neural networks"],correct:1,tip:"High-bias = underfit; high-variance = overfit. The goal is to find the sweet spot."}
    ]
  },
  "sql-mastery": {
    title:"SQL Mastery Quiz", topic:"SQL", icon:"database", color:"#2563EB", bg:"#EFF4FE",
    category:"Database", difficulty:"Medium", questionsCount:5, durationMinutes:15, xp:100,
    coverTopics:["SELECT Queries","JOINs","Aggregate Functions","Subqueries","Indexes","Transactions","GROUP BY","Window Functions"],
    beforeStart:["Covers ANSI SQL with practical examples.","Pay attention to query outputs.","Good luck! 😊"],
    skillProgress:[{label:"JOINs",pct:78,color:"#2563EB"},{label:"Aggregates",pct:85,color:"#D96B43"},{label:"Subqueries",pct:60,color:"#10B981"},{label:"Window Functions",pct:45,color:"#F59E0B"}],
    questions:[
      {id:"sql1",question:"What does the following query return?",code:"SELECT COUNT(*) FROM employees\nWHERE department = 'Engineering';",language:"sql",options:["All employee names","Number of engineers","All departments","NULL"],correct:1,tip:"COUNT(*) counts all rows matching the WHERE condition."},
      {id:"sql2",question:"Which JOIN returns all rows from the left table even without a match?",options:["INNER JOIN","RIGHT JOIN","LEFT JOIN","FULL JOIN"],correct:2,tip:"LEFT JOIN returns all records from the left table and matched records from right."},
      {id:"sql3",question:"What is the correct order of SQL clauses?",options:["WHERE, FROM, SELECT","SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY","FROM, WHERE, SELECT","GROUP BY, SELECT, FROM"],correct:1,tip:"The logical order: SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY."},
      {id:"sql4",question:"What does HAVING do in a SQL query?",options:["Filters rows before grouping","Filters groups after GROUP BY","Joins two tables","Creates an index"],correct:1,tip:"HAVING is like WHERE but for groups — filters after GROUP BY."},
      {id:"sql5",question:"Which keyword removes duplicate rows from a result set?",options:["UNIQUE","DISTINCT","REMOVE","FILTER"],correct:1,tip:"SELECT DISTINCT eliminates duplicate rows from the result."}
    ]
  },
  "dsa-algorithms": {
    title:"DSA — Data Structures & Algorithms", topic:"DSA", icon:"code", color:"#D96B43", bg:"#FEF3EB",
    category:"DSA", difficulty:"Hard", questionsCount:5, durationMinutes:18, xp:150,
    coverTopics:["Arrays","Linked Lists","Stacks & Queues","Trees","Graphs","Sorting","Searching","Dynamic Programming"],
    beforeStart:["Covers algorithmic thinking and Big-O.","Some questions include code snippets.","Think carefully before answering.","Good luck! 😊"],
    skillProgress:[{label:"Arrays & Strings",pct:80,color:"#D96B43"},{label:"Trees & Graphs",pct:60,color:"#10B981"},{label:"Dynamic Programming",pct:45,color:"#6366F1"},{label:"Sorting",pct:75,color:"#F59E0B"}],
    questions:[
      {id:"dsa1",question:"What is the time complexity of binary search?",options:["O(n)","O(log n)","O(n^2)","O(1)"],correct:1,tip:"Binary search halves the search space at each step — O(log n)."},
      {id:"dsa2",question:"Which data structure uses LIFO (Last In, First Out) order?",options:["Queue","Stack","Tree","Heap"],correct:1,tip:"A Stack follows LIFO — the last element pushed is the first to be popped."},
      {id:"dsa3",question:"Worst-case time complexity of Quick Sort?",options:["O(n log n)","O(n)","O(n^2)","O(log n)"],correct:2,tip:"Quick Sort degrades to O(n^2) when the pivot is always smallest or largest."},
      {id:"dsa4",question:"Time complexity to access nth node in a singly linked list?",options:["O(1)","O(log n)","O(n)","O(n^2)"],correct:2,tip:"You must traverse from head to reach the nth node — O(n)."},
      {id:"dsa5",question:"Algorithm for shortest path in a weighted graph?",options:["BFS","DFS","Dijkstra","Merge Sort"],correct:2,tip:"Dijkstra algorithm finds shortest path from a source node in a weighted graph."}
    ]
  },
  "git-workflows": {
    title:"Git & GitHub Workflows", topic:"Git", icon:"git", color:"#DC2626", bg:"#FEF2F2",
    category:"Development", difficulty:"Easy", questionsCount:4, durationMinutes:10, xp:80,
    coverTopics:["git init / clone","Commits & Staging","Branching","Merging & Rebasing","Pull Requests","Resolving Conflicts","Tags & Releases","GitHub Actions"],
    beforeStart:["Covers Git CLI and GitHub workflows.","Terminal commands will be shown.","Good luck! 😊"],
    skillProgress:[{label:"Branching",pct:88,color:"#DC2626"},{label:"Merging",pct:72,color:"#D96B43"},{label:"Pull Requests",pct:80,color:"#10B981"},{label:"Conflict Resolution",pct:60,color:"#F59E0B"}],
    questions:[
      {id:"git1",question:"What does git stash do?",options:["Deletes untracked files","Temporarily shelves changes","Creates a new branch","Resets to HEAD"],correct:1,tip:"git stash temporarily saves your working directory changes."},
      {id:"git2",question:"Difference between git merge and git rebase?",options:["No difference","Merge creates merge commit; rebase replays commits on another branch","Rebase creates merge commits","Merge replays commits"],correct:1,tip:"Rebase creates linear history; merge preserves branch history."},
      {id:"git3",question:"Which command shows the commit history?",options:["git status","git log","git diff","git show"],correct:1,tip:"git log displays the commit history for the current branch."},
      {id:"git4",question:"What does git pull do?",options:["Push local commits","Fetch and merge remote changes","Create a new branch","Stash changes"],correct:1,tip:"git pull = git fetch + git merge. It updates your local branch from remote."}
    ]
  },
  "rag-vector-search": {
    title:"RAG & Vector Search", topic:"RAG", icon:"search-ai", color:"#059669", bg:"#ECFDF5",
    category:"AI / ML", difficulty:"Hard", questionsCount:4, durationMinutes:16, xp:130,
    coverTopics:["Retrieval-Augmented Generation","Embeddings","Vector Databases","Chunking Strategies","Similarity Search","Re-ranking","LangChain","Semantic Search"],
    beforeStart:["Covers modern RAG pipeline concepts.","Familiarity with LLMs is helpful.","Good luck! 😊"],
    skillProgress:[{label:"Embeddings",pct:70,color:"#059669"},{label:"Vector DBs",pct:60,color:"#D96B43"},{label:"RAG Pipeline",pct:55,color:"#6366F1"},{label:"Re-ranking",pct:40,color:"#F59E0B"}],
    questions:[
      {id:"rag1",question:"Primary purpose of a vector database in a RAG system?",options:["Store raw SQL data","Store and retrieve embeddings via similarity search","Cache API responses","Train language models"],correct:1,tip:"Vector databases store embeddings and enable fast approximate nearest neighbor search."},
      {id:"rag2",question:"What does chunking refer to in a RAG pipeline?",options:["Splitting model weights","Dividing documents into smaller pieces for embedding","Compressing vector dimensions","Batching API calls"],correct:1,tip:"Chunking breaks large documents so each piece can be embedded and retrieved independently."},
      {id:"rag3",question:"Most commonly used similarity metric in vector search?",options:["Euclidean distance only","Cosine similarity","Jaccard similarity","Manhattan distance"],correct:1,tip:"Cosine similarity measures the angle between two vectors — direction over magnitude."},
      {id:"rag4",question:"What is a vector embedding?",options:["A compressed image","A dense numerical representation of text/data capturing semantic meaning","A database index","A hash function"],correct:1,tip:"Embeddings are dense vectors capturing semantic meaning — similar concepts have similar vectors."}
    ]
  }
}

const getTopicData = (slug, fallbackTitle) => {
  if (TOPIC_DATA[slug]) return TOPIC_DATA[slug]
  return getCustomTopicQuiz(slug, fallbackTitle)
}

const MAIN_NAV = [
  { id:"home", label:"Home", icon:Home, route:"/workspace" },
  { id:"career", label:"Career", icon:GraduationCap, route:"/career" },
  { id:"learn", label:"Learn", icon:BookOpen, route:"/career" },
  { id:"challenges", label:"Challenges", icon:Target, route:"/challenges" },
  { id:"projects", label:"Projects", icon:Layers, route:"/workspace" },
  { id:"quizzes", label:"Quizzes", icon:Flame, route:"/quizzes" },
  { id:"code-arena", label:"Code Arena", icon:Code2, route:"/code-arena" },
  { id:"ai-tutor", label:"AI Tutor", icon:Sparkles, route:"/ai-tutor" }
]
const PROGRESS_NAV = [
  { id:"skill-graph", label:"Skill Graph", icon:Network, route:"/skill-graph" },
  { id:"my-skills", label:"My Skills", icon:Layers, route:"/my-skills" },
  { id:"achievements", label:"Achievements", icon:Trophy, route:"/career" },
  { id:"learning-history", label:"Learning History", icon:Clock, route:"/challenges" }
]
const MORE_NAV = [
  { id:"settings", label:"Settings", icon:Settings, route:"/profile" },
  { id:"help", label:"Help & Support", icon:Headphones, route:"/ai-tutor" }
]

function SidebarComp({ activeNav, targetRole, navigate, showToast, onOpenCareerTrack }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoArea} onClick={() => navigate("/workspace")}>
        <div className={styles.logoIcon}>R</div>
        <div className={styles.logoTextWrap}>
          <span className={styles.logoBrand}>REXION</span>
          <span className={styles.logoSub}>AI CAREER PLATFORM</span>
        </div>
      </div>

      <div className={styles.navSection}>
        <nav className={styles.navMenu}>
          {MAIN_NAV.map((item) => {
            const Icon = item.icon
            const isActive = activeNav === item.id
            return (
              <button key={item.id}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                onClick={() => item.route ? navigate(item.route) : showToast(`${item.label} coming soon`)}>
                <div className={styles.navItemLeft}><Icon size={18} /><span>{item.label}</span></div>
                {isActive && <ChevronRight size={15} className={styles.navArrow} />}
              </button>
            )
          })}
        </nav>
      </div>

      <div className={styles.navSection}>
        <div className={styles.navSectionLabel}>Progress</div>
        <nav className={styles.navMenu}>
          {PROGRESS_NAV.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} className={styles.navItem} onClick={() => item.route ? navigate(item.route) : showToast(`Viewing ${item.label}`)}>
                <div className={styles.navItemLeft}><Icon size={18} /><span>{item.label}</span></div>
              </button>
            )
          })}
        </nav>
      </div>

      <div className={styles.navSection}>
        <div className={styles.navSectionLabel}>More</div>
        <nav className={styles.navMenu}>
          {MORE_NAV.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} className={styles.navItem}
                onClick={() => item.route ? navigate(item.route) : showToast(`Opening ${item.label}`)}>
                <div className={styles.navItemLeft}><Icon size={18} /><span>{item.label}</span></div>
              </button>
            )
          })}
        </nav>
      </div>

      <div
        className={styles.journeyWidget}
        onClick={onOpenCareerTrack}
        style={{ cursor: "pointer" }}
        title="Click to change your career track or generate with AI"
      >
        <div className={styles.journeyIcon}><GraduationCap size={18} /></div>
        <div className={styles.journeyInfo}>
          <div className={styles.journeyLabel}>Your Journey</div>
          <div className={styles.journeyTitle}>{targetRole}</div>
          <div className={styles.journeyBar}><div className={styles.journeyBarFill} style={{ width: "68%" }} /></div>
        </div>
        <ChevronRight size={15} color="#8E7E70" />
      </div>

      <div className={styles.sidebarBottomSpacer} />
    </aside>
  )
}

function TopBarComp({ searchQuery, setSearchQuery, fullName, firstName, headline, avatarUrl, navigate, showToast }) {
  return (
    <header className={styles.topBar}>
      <div className={styles.searchBar}>
        <Search size={16} className={styles.searchIcon} />
        <input type="text" placeholder="Search quizzes, topics, or skills..."
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={styles.searchInput} />
      </div>
      <div className={styles.headerRight}>
        <button className={styles.iconBtn} onClick={() => showToast("No unread notifications")} title="Notifications">
          <Bell size={17} /><span className={styles.notificationDot} />
        </button>
        <div className={styles.userChip} onClick={() => navigate("/profile")} title="View Profile">
          <div className={styles.userAvatar}>
            {avatarUrl ? <img src={avatarUrl} alt={fullName} /> : firstName.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userMeta}>
            <span className={styles.userName}>{fullName}</span>
            <span className={styles.userRole}>{headline}</span>
          </div>
          <ChevronDown size={14} color="#8E7E70" />
        </div>
      </div>
    </header>
  )
}

function HubView({ metrics, categories, popularTopics, recentlyAdded, leaderboard,
  selectedCategory, setSelectedCategory, topicSearch, setTopicSearch, firstName, onTopicClick }) {
  
  const normSelected = normalizeCategory(selectedCategory)
  const isAll = (selectedCategory === "All" || normSelected === "all") && !topicSearch.trim()

  // Find active category
  let activeCatObj = CATEGORY_CATALOG[normSelected] || null
  if (!activeCatObj && normSelected && normSelected !== "all") {
    for (const k in CATEGORY_CATALOG) {
      if (normSelected.includes(k) || k.includes(normSelected)) {
        activeCatObj = CATEGORY_CATALOG[k]
        break
      }
    }
  }

  // Active topics to display
  let displayedTopics = []
  if (topicSearch.trim()) {
    const q = topicSearch.toLowerCase().trim()
    for (const catKey in CATEGORY_CATALOG) {
      const cat = CATEGORY_CATALOG[catKey]
      const matches = cat.topics.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q) ||
        cat.name.toLowerCase().includes(q)
      )
      displayedTopics.push(...matches)
    }
  } else if (activeCatObj) {
    displayedTopics = activeCatObj.topics
  }

  return (
    <>
      <section className={styles.heroBanner}>
        <img src={heroDeskAsset} alt="Cozy Study Desk" className={styles.heroDeskImg} />
        <div className={styles.heroHandwritten}>
          <div className={styles.heroHandwrittenText}><span>Better practice.</span><span>Bigger progress.</span></div>
          <svg width="42" height="32" viewBox="0 0 46 34" fill="none">
            <path d="M4 10C14 4 28 6 34 22M34 22L28 17M34 22L38 15" stroke="#8C5835" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className={styles.heroContent}>
          <span className={styles.heroTag}>QUIZZES</span>
          <h1 className={styles.heroTitle}>Test what you know.</h1>
          <p className={styles.heroSub}>Short, focused quizzes to strengthen your skills and track your progress.</p>
        </div>
      </section>

      <section className={styles.metricsGrid}>
        {[
          { icon: ClipboardList, label:"Total Quizzes", value: metrics.totalQuizzes, bg:"#FEF3EB", color:"#D96B43" },
          { icon: Star, label:"Completed", value: metrics.completed, bg:"#FEF9E7", color:"#EAB308", sub: metrics.totalQuestionsAnswered > 0 ? `${metrics.totalQuestionsAnswered} questions solved` : null },
          { icon: Clock, label:"In Progress", value: metrics.inProgress, bg:"#F0EBE3", color:"#8E7E70" },
          { icon: Crosshair, label:"Average Score", value: `${metrics.averageScore}%`, bg:"#FCEFEB", color:"#E05A47", sub: metrics.completed > 0 ? "Real accuracy" : null }
        ].map((m, i) => {
          const Icon = m.icon
          return (
            <div key={i} className={styles.metricCard}>
              <div className={styles.metricIconCircle} style={{ background: m.bg, color: m.color }}><Icon size={22} /></div>
              <div className={styles.metricData}>
                <span className={styles.metricValue}>{m.value}</span>
                <span className={styles.metricLabel}>{m.label}</span>
                {m.sub && <span style={{ fontSize: "0.72rem", color: "#8E7E70", marginTop: 2, fontWeight: 500 }}>{m.sub}</span>}
              </div>
            </div>
          )
        })}
      </section>

      <section className={styles.filterBar}>
        <div className={styles.filterPills}>
          {categories.map((cat) => (
            <button key={cat} className={`${styles.filterPill} ${selectedCategory === cat ? styles.filterPillActive : ""}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>
          ))}
        </div>
        <div className={styles.topicSearchWrap}>
          <Search size={14} color="#8E7E70" />
          <input type="text" placeholder="Search topics..." value={topicSearch} onChange={e => setTopicSearch(e.target.value)} className={styles.topicSearchInput} />
        </div>
      </section>

      <div className={styles.contentLayout}>
        <div className={styles.leftColumn}>
          {!isAll ? (
            <div>
              <div className={styles.categoryHeaderBanner}>
                <div className={styles.categoryHeaderLeft}>
                  <div className={styles.categoryHeaderIcon}>
                    {activeCatObj ? activeCatObj.emoji : "🔍"}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <h2 className={styles.categoryHeaderTitle}>
                        {activeCatObj ? `${activeCatObj.emoji} ${activeCatObj.name}` : `Search: "${topicSearch}"`}
                      </h2>
                      <span className={styles.categoryCountBadge}>
                        {displayedTopics.length} {displayedTopics.length === 1 ? "Track" : "Tracks"} • {displayedTopics.reduce((a, t) => a + (t.quizCount || 5), 0)} Quizzes
                      </span>
                    </div>
                    <p className={styles.categoryHeaderDesc}>
                      {activeCatObj ? activeCatObj.tagline : `Showing matching quiz tracks for "${topicSearch}"`}
                    </p>
                  </div>
                </div>
              </div>

              {displayedTopics.length > 0 ? (
                <div className={styles.categoryGrid}>
                  {displayedTopics.map((topic) => (
                    <div
                      key={topic.id || topic.slug}
                      className={styles.categoryTopicCard}
                      onClick={() => onTopicClick(topic)}
                    >
                      <div>
                        <div className={styles.cardHeaderRow}>
                          <h3 className={styles.cardTitle}>{topic.title}</h3>
                          <span className={styles.quizCountPill}>{topic.quizCount} quizzes</span>
                        </div>
                        <p className={styles.cardDesc}>{topic.desc}</p>
                      </div>
                      <div className={styles.cardFooter}>
                        <span className={styles.cardDifficultyTag}>{topic.difficulty || "Medium"}</span>
                        <span className={styles.cardLaunchBtn}>Practice Track <ArrowRight size={13} /></span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "40px 20px", textAlign: "center", background: "#FFF", borderRadius: 16, border: "1px dashed var(--border-light)" }}>
                  <p style={{ color: "var(--text-secondary)", marginBottom: 12 }}>No quiz tracks found matching "{topicSearch}".</p>
                  <button
                    className={styles.filterPill}
                    onClick={() => { setTopicSearch(""); setSelectedCategory("All"); }}
                  >
                    Clear Search & View All
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>Explore Career Tracks</span>
                  <span style={{ fontSize: "0.8rem", color: "#8E7E70" }}>11 Domains • 120+ Tracks</span>
                </div>
                <div className={styles.categoryGrid}>
                  {Object.entries(CATEGORY_CATALOG).map(([key, cat]) => (
                    <div
                      key={key}
                      className={styles.categoryTopicCard}
                      onClick={() => setSelectedCategory(`${cat.emoji} ${cat.name}`)}
                    >
                      <div>
                        <div className={styles.cardHeaderRow}>
                          <h3 className={styles.cardTitle}>{cat.emoji} {cat.name}</h3>
                          <span className={styles.quizCountPill}>{cat.topics.length} tracks</span>
                        </div>
                        <p className={styles.cardDesc}>{cat.tagline}</p>
                      </div>
                      <div className={styles.cardFooter}>
                        <span className={styles.cardDifficultyTag}>{cat.topics.reduce((acc, t) => acc + t.quizCount, 0)} total quizzes</span>
                        <span className={styles.cardLaunchBtn}>Explore Domain <ArrowRight size={13} /></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className={styles.sectionHeader}><span className={styles.sectionTitle}>Popular Topics</span></div>
                <div className={styles.popularGrid}>
                  {popularTopics.map((topic) => (
                    <div key={topic.id} className={styles.topicCard} onClick={() => onTopicClick(topic)}>
                      <div>
                        <div className={styles.topicCardTop}>
                          <TopicLogo type={topic.icon} />
                          <div className={styles.topicText}>
                            <div className={styles.topicNameRow}>
                              <span className={styles.topicName}>{topic.title}</span>
                              <ChevronRight size={15} className={styles.topicChevron} />
                            </div>
                            <p className={styles.topicDesc}>{topic.desc}</p>
                          </div>
                        </div>
                      </div>
                      <div className={styles.topicMeta}><span>{topic.quizCount} quizzes</span><span>•</span><span>{topic.difficulty}</span></div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className={styles.sectionHeader}><span className={styles.sectionTitle}>Recently Added</span></div>
                <div className={styles.recentlyGrid}>
                  {recentlyAdded.map((item) => {
                    const Icon = item.icon || FileCode
                    return (
                      <div key={item.id} className={styles.recentCard} onClick={() => onTopicClick({ ...item, icon:"code" })}>
                        <div>
                          <div className={styles.recentHeader}>
                            <div className={styles.recentIconSquare} style={{ background: item.bg||"#FEF3EB", color: item.color||"#D96B43" }}><Icon size={16} /></div>
                            <span className={styles.newBadge}>New</span>
                          </div>
                          <div className={styles.recentTitle}>{item.title}</div>
                          <div className={styles.recentCategory}>{item.category}</div>
                        </div>
                        <div className={styles.recentFooter}><span>📋 {item.questionsCount||5} questions</span><span>•</span><span>🕒 {item.durationMinutes||12} min</span></div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
        <div className={styles.rightColumn}>
          <div className={styles.widgetCard}>
            <div className={styles.widgetHeader}><div className={styles.widgetTitleWrap}><span className={styles.widgetTitle}>Your Quiz Progress</span><span className={styles.widgetSub}>See how you are doing</span></div></div>
            <div className={styles.progressDonutRow}>
              <DonutChart percentage={metrics.averageScore} size={84} stroke={7} />
              <div className={styles.donutLegend}>
                {[{label:"Completed",count:metrics.completed,color:"#10B981"},{label:"In Progress",count:metrics.inProgress,color:"#F59E0B"},{label:"Not Started",count:metrics.notStarted,color:"#D1D5DB"}].map(l => (
                  <div key={l.label} className={styles.legendItem}>
                    <div className={styles.legendLeft}><span className={styles.legendDot} style={{ background: l.color }} /><span>{l.label}</span></div>
                    <span className={styles.legendCount}>{l.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.widgetCard}>
            <div className={styles.widgetHeader}><div className={styles.widgetTitleWrap}><span className={styles.widgetTitle}>📅 Today&#39;s Quiz</span><span className={styles.widgetSub}>Keep your streak alive!</span></div></div>
            <div className={styles.todayQuizContent}>
              <div className={styles.todayQuizIcon}><span style={{ fontSize:"1.2rem" }}>🐍</span></div>
              <div className={styles.todayQuizInfo}>
                <div className={styles.todayQuizName}>Python Basics</div>
                <div className={styles.todayQuizMeta}>Variables, data types, operators</div>
                <div style={{ display:"flex", gap:6, fontSize:"0.72rem", color:"#8E7E70", marginTop:4 }}><span>📋 5 questions</span><span>•</span><span>🕒 12 min</span></div>
              </div>
            </div>
            <button className={styles.startQuizBtn} onClick={() => onTopicClick({ slug:"python-basics", id:"python", title:"Python" })}>Start Quiz <ArrowRight size={15} /></button>
          </div>
          <div className={styles.widgetCard}>
            <div className={styles.widgetHeader}><div className={styles.widgetTitleWrap}><span className={styles.widgetTitle}><Trophy size={16} color="#EAB308" /> Leaderboard</span><span className={styles.widgetSub}>Top 5 this week</span></div></div>
            <div className={styles.leaderboardList}>
              {leaderboard.map((item) => (
                <div key={item.rank} className={`${styles.leaderRow} ${item.isUser ? styles.leaderRowYou : ""}`}>
                  <div className={styles.leaderLeft}><span className={styles.leaderRank}>{item.rank}</span><span className={styles.leaderName}>{item.name}</span></div>
                  <span className={styles.leaderPts}>{item.pts.toLocaleString()} pts</span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.quoteCard}>
            <div className={styles.quoteTextWrap}><div className={styles.quoteTitle}>Small quizzes.<br />Big dreams.</div></div>
            <button className={styles.quoteArrowBtn} onClick={() => onTopicClick({ slug:"dsa-algorithms", id:"dsa", title:"DSA" })}><ArrowRight size={16} /></button>
          </div>
        </div>
      </div>
    </>
  )
}

function DetailView({ topicData, onBack, onStartQuiz, onGenerateFresh, generatingFresh }) {
  return (
    <div className={styles.detailShell}>
      <div className={styles.breadcrumb}>
        <button className={styles.breadcrumbLink} onClick={onBack}>Quizzes</button>
        <ChevronRight size={13} color="#8E7E70" />
        <button className={styles.breadcrumbLink} onClick={onBack}>{topicData.topic}</button>
        <ChevronRight size={13} color="#8E7E70" />
        <span className={styles.breadcrumbCurrent}>{topicData.title}</span>
      </div>
      <div className={styles.detailLayout}>
        <div className={styles.detailLeft}>
          <div className={styles.detailHeaderCard}>
            <div className={styles.detailHeaderMain}>
              <TopicLogo type={topicData.icon} size={52} />
              <div style={{ flex:1, minWidth:0 }}>
                <h1 className={styles.detailTitle}>{topicData.title}</h1>
                <p className={styles.detailSubtitle}>Test your understanding of {topicData.topic} fundamentals. {topicData.questionsCount} questions &#x2022; {topicData.durationMinutes} minutes</p>
              </div>
              <span className={styles.diffBadge}>{topicData.difficulty}</span>
            </div>
            <div className={styles.detailHandwritten}>
              <span>Small steps.</span><span>Big progress.</span>
              <svg width="36" height="26" viewBox="0 0 46 34" fill="none">
                <path d="M4 10C14 4 28 6 34 22M34 22L28 17M34 22L38 15" stroke="#8C5835" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className={styles.detailPillRow}>
              <div className={styles.detailPill}><BarChart2 size={14} /><span>{topicData.difficulty}</span></div>
              <div className={styles.detailPill}><ClipboardList size={14} /><span>{topicData.questionsCount} Questions</span></div>
              <div className={styles.detailPill}><Clock size={14} /><span>{topicData.durationMinutes} min</span></div>
              <div className={styles.detailPill} style={{ color:"#D96B43", background:"#FEF3EB", border:"1px solid rgba(217,107,67,0.15)" }}><Star size={14} /><span>+{topicData.xp} XP</span></div>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "linear-gradient(135deg, rgba(124, 58, 237, 0.05), rgba(217, 107, 67, 0.05))",
              border: "1px solid rgba(124, 58, 237, 0.2)",
              borderRadius: 12,
              padding: "10px 14px",
              marginTop: 14,
              flexWrap: "wrap",
              gap: 8
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", fontWeight: 700, color: "#7C3AED" }}>
                <Sparkles size={16} />
                <span>AI Adaptive Question Engine Active</span>
                <span style={{ fontSize: "0.72rem", background: "#F5F3FF", padding: "2px 8px", borderRadius: 999, border: "1px solid rgba(124,58,237,0.2)" }}>
                  v{topicData.aiVersion || 1}.0
                </span>
              </div>
              <button
                onClick={() => onGenerateFresh?.(topicData)}
                disabled={generatingFresh}
                style={{
                  background: generatingFresh ? "#EAE4DA" : "#FEF3EB",
                  color: generatingFresh ? "#8E7E70" : "#D96B43",
                  border: "1px solid rgba(217,107,67,0.3)",
                  borderRadius: 999,
                  padding: "5px 14px",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  cursor: generatingFresh ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5
                }}
              >
                <Sparkles size={12} />
                {generatingFresh ? "Generating AI Questions..." : "⚡ Generate Fresh AI Questions"}
              </button>
            </div>
          </div>
          <div className={styles.detailCard}>
            <div className={styles.detailCardHeader}>
              <span style={{ fontSize:"1.1rem" }}>🎯</span>
              <h2 className={styles.detailCardTitle}>What&#39;s covered in this quiz?</h2>
            </div>
            <p className={styles.detailCardSub}>These topics will be tested in this quiz:</p>
            <div className={styles.coverTopicsGrid}>
              {topicData.coverTopics.map((t, i) => (
                <div key={i} className={styles.coverTopicChip}><Check size={13} color="#10B981" /><span>{t}</span></div>
              ))}
            </div>
          </div>
          <div className={styles.beforeStartCard}>
            <div className={styles.beforeStartLeft}>
              <div className={styles.detailCardHeader}><Zap size={18} color="#F59E0B" /><h2 className={styles.detailCardTitle}>Before you start</h2></div>
              <ul className={styles.beforeStartList}>
                {topicData.beforeStart.map((b, i) => (
                  <li key={i} className={styles.beforeStartItem}><Check size={14} color="#10B981" /><span>{b}</span></li>
                ))}
              </ul>
            </div>
            <div className={styles.beforeStartDecor}>💻📚</div>
          </div>
          <div className={styles.detailActions}>
            <button className={styles.backBtn} onClick={onBack}><ArrowRight size={15} style={{ transform:"rotate(180deg)" }} /> Back to Quizzes</button>
            <button className={styles.startQuizBtnBig} onClick={onStartQuiz}>Start Quiz <ArrowRight size={16} /></button>
          </div>
        </div>
        <div className={styles.detailRight}>
          <div className={styles.widgetCard}>
            <div className={styles.widgetHeader}>
              <div className={styles.widgetTitleWrap}>
                <span className={styles.widgetTitle}><TrendingUp size={15} color="#D96B43" style={{ marginRight:5, verticalAlign:"middle" }} />Skill Progress</span>
                <span className={styles.widgetSub}>Your progress in {topicData.topic}</span>
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
              <DonutChart percentage={topicData.skillProgress?.[0]?.pct||72} size={90} stroke={8} color={topicData.color||"#D96B43"} />
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {topicData.skillProgress?.map((s, i) => (
                <div key={i} style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.78rem", color:"#5C4D40", fontWeight:600 }}>
                    <span>{s.label}</span><span>{s.pct}%</span>
                  </div>
                  <ProgressBar value={s.pct} max={100} color={s.color} />
                </div>
              ))}
            </div>
            <button className={styles.viewDetailsLink}>View details &#x2192;</button>
          </div>
          <div className={styles.widgetCard}>
            <div className={styles.widgetHeader}>
              <div className={styles.widgetTitleWrap}><span className={styles.widgetTitle}><Clock size={15} color="#8E7E70" style={{ marginRight:5, verticalAlign:"middle" }} />Recent Attempts</span></div>
              <button className={styles.viewAllBtn}>View all &#x2192;</button>
            </div>
            <div className={styles.noAttemptsBox}>
              <ClipboardList size={28} color="#C5B8A8" />
              <p>No previous attempts</p>
              <span>This is your first attempt. Let&#39;s make it count!</span>
            </div>
          </div>
          <div className={styles.keepGoingCard}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <span style={{ fontSize:"1rem" }}>🎯</span>
              <span style={{ fontWeight:700, color:"#231C16" }}>Keep going!</span>
            </div>
            <p style={{ fontSize:"0.85rem", color:"#5C4D40", fontStyle:"italic", margin:0, lineHeight:1.45 }}>"Every expert was once a beginner."</p>
            <div style={{ fontSize:"1.5rem", marginTop:10, opacity:0.5 }}>🏔️🚩</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RunnerView({ topicData, onBack, onComplete, onQuizSubmitted, onRetryFresh }) {
  const questions = topicData.questions || []
  const totalSecs = (topicData.durationMinutes || 12) * 60
  const [currentIdx, setCurrentIdx] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(null)
  const [timeLeft, setTimeLeft] = useState(totalSecs)
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const timerRef = useRef(null)

  const doSubmit = async () => {
    if (submitting) return
    clearInterval(timerRef.current)
    setSubmitting(true)
    try {
      // Build answers payload for backend
      const answersPayload = questions.map(q => ({
        questionId: q.id,
        selectedIndex: userAnswers[q.id] !== undefined ? userAnswers[q.id] : -1
      }))
      const slug = topicData.slug || topicData.id
      const elapsedSecs = Math.max(1, totalSecs - timeLeft)
      const res = await quizApi.submitQuiz(slug, answersPayload, elapsedSecs, topicData.todayDate)
      if (res?.result) {
        const r = res.result
        setScore({
          correct: r.correctCount,
          total: r.totalQuestions,
          pct: r.scorePercentage,
          xp: r.xpEarned,
          feedback: r.feedback,
          answers: r.answers
        })
        onQuizSubmitted?.(r)
      } else {
        // Local scoring fallback
        let correct = 0
        questions.forEach(q => { if (userAnswers[q.id] === q.correct || userAnswers[q.id] === q.correctIndex) correct++ })
        const pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
        setScore({ correct, total: questions.length, pct, xp: Math.round((pct/100)*(topicData.xp||100)) })
      }
    } catch (_) {
      // Local scoring if backend unavailable
      let correct = 0
      questions.forEach(q => { if (userAnswers[q.id] === q.correct || userAnswers[q.id] === q.correctIndex) correct++ })
      const pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
      setScore({ correct, total: questions.length, pct, xp: Math.round((pct/100)*(topicData.xp||100)) })
    } finally {
      setSubmitting(false)
      setSubmitted(true)
    }
  }

  useEffect(() => {
    if (submitted) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { doSubmit(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [submitted, userAnswers])

  const handleAnswer = (qId, idx) => {
    if (submitted) return
    setUserAnswers(prev => ({ ...prev, [qId]: idx }))
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const q = questions[currentIdx]
  const answered = Object.keys(userAnswers).length

  const [loadingNext, setLoadingNext] = useState(false)

  const handleNextQuiz = async () => {
    setLoadingNext(true)
    try {
      if (onRetryFresh) {
        await onRetryFresh(topicData)
      }
    } finally {
      setLoadingNext(false)
      setCurrentIdx(0)
      setUserAnswers({})
      setSubmitted(false)
      setScore(null)
      setShowReview(false)
      setTimeLeft(totalSecs)
    }
  }

  if (submitted && score) {
    return (
      <div className={styles.runnerResultShell}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={styles.resultCard}>
          <div className={styles.resultCheckCircle}><Check size={36} color="#10B981" /></div>
          <h2 className={styles.resultTitle}>Quiz Completed! 🎉</h2>
          <div className={styles.resultScore}>{score.pct}%</div>
          <p className={styles.resultFeedback}>
            {score.feedback || (score.pct >= 80 ? "Outstanding! You have a strong grasp." : score.pct >= 60 ? "Good effort! Keep practicing." : "Keep going — every attempt makes you better!")}
          </p>
          <div className={styles.resultStats}>
            <div className={styles.resultStat}><span>{score.correct}</span><small>Correct</small></div>
            <div className={styles.resultStat}><span>{score.total - score.correct}</span><small>Incorrect</small></div>
            <div className={styles.resultStat}><span>+{score.xp}</span><small>XP Earned</small></div>
          </div>

          <div style={{ marginTop: 18, marginBottom: 18, display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              onClick={() => setShowReview(prev => !prev)}
              style={{
                background: showReview ? "#231C16" : "#FEF3EB",
                color: showReview ? "#FFF" : "#D96B43",
                border: "1px solid rgba(217,107,67,0.3)",
                padding: "8px 18px",
                borderRadius: "999px",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6
              }}>
              <BookOpen size={14} />
              {showReview ? "Hide Answer Review" : "Review All Answers & Explanations"}
            </button>
          </div>

          {showReview && (
            <div style={{ textAlign: "left", marginTop: 12, marginBottom: 20, maxHeight: 360, overflowY: "auto", paddingRight: 6 }}>
              {questions.map((item, idx) => {
                const userChoice = userAnswers[item.id]
                const correctChoice = item.correctIndex !== undefined ? item.correctIndex : item.correct
                const isCorrect = userChoice === correctChoice
                return (
                  <div key={item.id || idx} style={{
                    background: "#FDFCFA",
                    border: `1px solid ${isCorrect ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                    borderRadius: 12,
                    padding: "12px 14px",
                    marginBottom: 10
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#231C16" }}>Q{idx + 1}. {item.question}</span>
                      <span style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: isCorrect ? "#ECFDF5" : "#FEF2F2",
                        color: isCorrect ? "#059669" : "#DC2626"
                      }}>
                        {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                      </span>
                    </div>
                    {item.code && (
                      <pre style={{ background: "#231C16", color: "#F0EBE3", padding: "8px 10px", borderRadius: 8, fontSize: "0.75rem", margin: "6px 0", overflowX: "auto" }}>
                        <code>{item.code}</code>
                      </pre>
                    )}
                    <div style={{ fontSize: "0.78rem", color: "#5C4D40", marginTop: 4 }}>
                      <div>Your answer: <strong>{userChoice !== undefined && userChoice >= 0 ? item.options[userChoice] : "Skipped"}</strong></div>
                      {!isCorrect && (
                        <div style={{ color: "#059669", marginTop: 2 }}>
                          Correct answer: <strong>{item.options[correctChoice]}</strong>
                        </div>
                      )}
                      {(item.tip || item.explanation) && (
                        <div style={{ marginTop: 6, fontSize: "0.74rem", background: "#FEF9E7", padding: "6px 10px", borderRadius: 6, color: "#854D0E" }}>
                          💡 <em>{item.explanation || item.tip}</em>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{
            background: "linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(217, 107, 67, 0.08))",
            border: "1px solid rgba(124, 58, 237, 0.25)",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 16,
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#F5F3FF", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#231C16" }}>
                ✨ AI Question Engine Active • Fresh Set Ready!
              </div>
              <div style={{ fontSize: "0.76rem", color: "#5C4D40", marginTop: 2 }}>
                AI has automatically generated a brand new question set on <strong>{topicData.topic || topicData.title}</strong> for your next session.
              </div>
            </div>
          </div>

          <div className={styles.resultActions}>
            <button className={styles.backBtn} onClick={onBack}>&#x2190; Back to Topic</button>
            <button
              className={styles.startQuizBtnBig}
              style={{ background: "#7C3AED", display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={handleNextQuiz}
              disabled={loadingNext}
            >
              <Sparkles size={16} /> {loadingNext ? "Generating Next Quiz..." : "Next Quiz \u2192"}
            </button>
            <button className={styles.startQuizBtnBig} onClick={onComplete}>Back to Quizzes</button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={styles.runnerShell}>
      <div className={styles.breadcrumb}>
        <button className={styles.breadcrumbLink} onClick={onComplete}>Quizzes</button>
        <ChevronRight size={13} color="#8E7E70" />
        <button className={styles.breadcrumbLink} onClick={onBack}>{topicData.topic}</button>
        <ChevronRight size={13} color="#8E7E70" />
        <span className={styles.breadcrumbCurrent}>{topicData.title}</span>
      </div>
      <div className={styles.runnerHeader}>
        <div style={{ display:"flex", alignItems:"center", gap:14, flex:1 }}>
          <TopicLogo type={topicData.icon} size={44} />
          <div>
            <h1 className={styles.runnerTitle}>{topicData.title}</h1>
            <p className={styles.runnerSub}>Test your understanding of {topicData.topic} fundamentals. {questions.length} questions &#x2022; {topicData.durationMinutes} minutes</p>
          </div>
        </div>
        <div className={styles.runnerHandwritten}>
          <span>Small steps.</span><span>Big progress.</span>
          <svg width="36" height="26" viewBox="0 0 46 34" fill="none">
            <path d="M4 10C14 4 28 6 34 22M34 22L28 17M34 22L38 15" stroke="#8C5835" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <div className={styles.runnerProgressRow}>
        <span style={{ fontSize:"0.82rem", color:"#8E7E70", fontWeight:600, whiteSpace:"nowrap" }}>Question {currentIdx+1} of {questions.length}</span>
        <div style={{ flex:1, margin:"0 16px" }}><ProgressBar value={currentIdx+1} max={questions.length} color="#D96B43" /></div>
        <div className={styles.timerBadge}><Clock size={13} /><span>{formatTime(timeLeft)}</span></div>
      </div>
      <div className={styles.runnerLayout}>
        <div className={styles.runnerLeft}>
          {q ? (
            <>
              <div className={styles.questionTopicTag}><Flame size={12} color="#D96B43" /><span>{topicData.topic}</span></div>
              <div className={styles.questionCard}>
                <p className={styles.questionText}>{q.question}</p>
                {q.code && (
                  <div className={styles.codeBlock}>
                    <div className={styles.codeBlockHeader}>
                      <div style={{ display:"flex", gap:6 }}>
                        <div style={{ width:11, height:11, borderRadius:"50%", background:"#FF5F57" }} />
                        <div style={{ width:11, height:11, borderRadius:"50%", background:"#FEBC2E" }} />
                        <div style={{ width:11, height:11, borderRadius:"50%", background:"#28C840" }} />
                      </div>
                      <button className={styles.copyBtn} onClick={() => copyCode(q.code)}>
                        <Copy size={13} />{copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <pre className={styles.codeContent}>
                      {q.code.split("\n").map((line, li) => (
                        <div key={li} className={styles.codeLine}>
                          <span className={styles.lineNum}>{li+1}</span>
                          <span className={styles.lineCode}>{line}</span>
                        </div>
                      ))}
                    </pre>
                  </div>
                )}
                <div className={styles.optionsList}>
                  {q.options.map((opt, idx) => {
                    const letter = ["A","B","C","D"][idx]
                    const isSelected = userAnswers[q.id] === idx
                    return (
                      <label key={idx} className={`${styles.optionLabel} ${isSelected ? styles.optionSelected : ""}`} onClick={() => handleAnswer(q.id, idx)}>
                        <div className={`${styles.optionRadio} ${isSelected ? styles.optionRadioSelected : ""}`}>
                          {isSelected && <div className={styles.optionRadioDot} />}
                        </div>
                        <span className={styles.optionLetter}>{letter}</span>
                        <span className={styles.optionText}>{opt}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
              <div className={styles.runnerNav}>
                <button className={styles.prevBtn} onClick={() => setCurrentIdx(p => Math.max(0,p-1))} disabled={currentIdx===0}>
                  <ArrowRight size={15} style={{ transform:"rotate(180deg)" }} /> Previous
                </button>
                {currentIdx < questions.length-1 ? (
                  <button className={styles.startQuizBtnBig} onClick={() => setCurrentIdx(p => p+1)}>Next Question <ArrowRight size={15} /></button>
                ) : (
                  <button className={styles.startQuizBtnBig} style={{ background: submitting ? "#6B7280" : "#10B981" }} onClick={doSubmit} disabled={submitting}>{submitting ? "Evaluating..." : "Submit Quiz ✓"}</button>
                )}
              </div>
            </>
          ) : <p style={{ color:"#8E7E70" }}>No questions available for this topic.</p>}
        </div>
        <div className={styles.runnerRight}>
          <div className={styles.widgetCard}>
            <div style={{ fontWeight:700, fontSize:"0.9rem", color:"#231C16", marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>
              <Trophy size={14} color="#EAB308" />Quiz Progress
            </div>
            <div style={{ fontSize:"0.76rem", color:"#8E7E70", marginBottom:12 }}>{answered} / {questions.length} questions answered</div>
            <ProgressBar value={answered} max={questions.length} color="#D96B43" />
            <div style={{ display:"flex", justifyContent:"space-around", marginTop:14 }}>
              <div style={{ textAlign:"center" }}><div style={{ fontSize:"1.1rem", fontWeight:800, color:"#10B981" }}>{answered}</div><div style={{ fontSize:"0.7rem", color:"#8E7E70" }}>✓ Answered</div></div>
              <div style={{ textAlign:"center" }}><div style={{ fontSize:"1.1rem", fontWeight:800, color:"#8E7E70" }}>{questions.length-answered}</div><div style={{ fontSize:"0.7rem", color:"#8E7E70" }}>&#x2192; Remaining</div></div>
            </div>
          </div>
          <div className={styles.widgetCard}>
            <div style={{ fontWeight:700, fontSize:"0.9rem", color:"#231C16", marginBottom:12 }}>Question Navigator</div>
            <div className={styles.qNavGrid}>
              {questions.map((qq, i) => {
                const isAnswered = userAnswers[qq.id] !== undefined
                const isCurrent = i === currentIdx
                return (
                  <button key={i} className={`${styles.qNavBtn} ${isCurrent ? styles.qNavCurrent : ""} ${isAnswered && !isCurrent ? styles.qNavAnswered : ""}`} onClick={() => setCurrentIdx(i)}>
                    {i+1}
                  </button>
                )
              })}
            </div>
          </div>
          {q?.tip && (
            <div className={styles.tipCard}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
                <span style={{ fontSize:"1rem" }}>💡</span>
                <span style={{ fontWeight:700, fontSize:"0.85rem", color:"#231C16" }}>Quick Tip</span>
              </div>
              <p style={{ fontSize:"0.8rem", color:"#5C4D40", margin:0, lineHeight:1.5 }}>{q.tip}</p>
            </div>
          )}
          <div className={styles.helpCard}>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
              <span style={{ fontSize:"1rem" }}>🤖</span>
              <span style={{ fontWeight:700, fontSize:"0.85rem", color:"#231C16" }}>Need Help?</span>
            </div>
            <p style={{ fontSize:"0.78rem", color:"#5C4D40", margin:"0 0 10px", lineHeight:1.4 }}>Ask AI Tutor for hints or explanations related to this question.</p>
            <button className={styles.askTutorBtn} onClick={() => alert(`AI Hint: Focus on the core syntax and behavior in ${topicData.topic}.`)}>Ask AI Tutor &#x2192;</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function QuizzesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const storedUser = getStoredUser()
  const activeUser = user || storedUser

  const [view, setView] = useState("hub")
  const [selectedTopicData, setSelectedTopicData] = useState(null)
  const [profile, setProfile] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [topicSearch, setTopicSearch] = useState("")
  const [toastMsg, setToastMsg] = useState(null)
  const [backendData, setBackendData] = useState(null)
  const [leaderboardData, setLeaderboardData] = useState([])
  const [userAttempts, setUserAttempts] = useState(null)

  const loadData = () => {
    // 1. Quizzes & hub metrics
    quizApi.getQuizzes({
      category: selectedCategory !== "All" ? selectedCategory : undefined,
      search: topicSearch || searchQuery || undefined
    }).then(res => {
      if (res?.success) {
        setBackendData(res)
        if (res.leaderboard?.length) {
          setLeaderboardData(res.leaderboard)
        }
      }
    }).catch(() => {})

    // 2. Real Leaderboard
    quizApi.getLeaderboard().then(res => {
      if (res?.leaderboard?.length) {
        setLeaderboardData(res.leaderboard)
      }
    }).catch(() => {})

    // 3. User attempts & XP
    quizApi.getMyAttempts().then(res => {
      if (res?.success) {
        setUserAttempts(res)
      }
    }).catch(() => {})
  }

  useEffect(() => {
    let m = true
    profileApi.get({ __skipUnauthorizedRedirect: true }).then(res => {
      if (m && res) {
        const pd = res.profile || res.candidate || res.data?.profile || res.data || res
        setProfile(pd)
      }
    }).catch(() => {})
    return () => { m = false }
  }, [user?._id])

  useEffect(() => {
    loadData()
  }, [selectedCategory, topicSearch, searchQuery, user?._id])

  const fullName = profile?.fullName || profile?.name || activeUser?.fullName || activeUser?.name || "Anshu Pal"
  const firstName = fullName.split(" ")[0] || "Anshu"
  const headline = profile?.headline || profile?.targetRole || activeUser?.headline || "Student"
  const [careerTrackModalOpen, setCareerTrackModalOpen] = useState(false)
  const [targetRole, setTargetRole] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('rexionTargetRoleTitle')
      if (stored) return stored
    }
    return profile?.targetRole || activeUser?.targetRole || "AI Engineer"
  })

  useEffect(() => {
    if (profile?.targetRole) {
      setTargetRole(profile.targetRole)
    }
  }, [profile?.targetRole])

  useEffect(() => {
    const handleRoleChanged = (e) => {
      if (e?.detail?.roleTitle) {
        setTargetRole(e.detail.roleTitle)
      }
    }
    window.addEventListener('rexion-target-role-changed', handleRoleChanged)
    return () => window.removeEventListener('rexion-target-role-changed', handleRoleChanged)
  }, [])
  const avatarUrl = resolveImageUrl(profile?.avatarUrl || profile?.avatar || activeUser?.avatarUrl)

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  const handleQuizSubmitted = (r) => {
    if (!r) return
    const slug = r.quizSlug || selectedTopicData?.slug || selectedTopicData?.id || 'quiz'
    const pct = Number(r.scorePercentage) || 0
    const questionsCount = Number(r.totalQuestions) || (selectedTopicData?.questions?.length || 5)
    const correctCount = Number(r.correctCount) || 0

    try {
      // 1. Update localStorage quiz scores
      const stored = window.localStorage.getItem('rexionQuizScores')
      const scoreMap = stored ? JSON.parse(stored) : {}
      scoreMap[slug] = Math.max(scoreMap[slug] || 0, pct)
      window.localStorage.setItem('rexionQuizScores', JSON.stringify(scoreMap))

      // 2. Update localStorage attempts list
      const attemptsRaw = window.localStorage.getItem('rexionQuizAttemptsList')
      const attemptsList = attemptsRaw ? JSON.parse(attemptsRaw) : []
      attemptsList.unshift({
        quizSlug: slug,
        scorePercentage: pct,
        correctCount,
        totalQuestions: questionsCount,
        xpEarned: r.xpEarned || 0,
        date: new Date().toISOString()
      })
      window.localStorage.setItem('rexionQuizAttemptsList', JSON.stringify(attemptsList.slice(0, 50)))

      // 3. Dispatch real-time live sync event across SkillGraph and other tabs
      window.dispatchEvent(new CustomEvent('rexion-quiz-completed', { detail: { ...r, quizSlug: slug } }))
    } catch (_) {}

    // 4. Update local state immediately with liveMetrics from server if provided
    if (r.liveMetrics) {
      setBackendData(prev => ({
        ...prev,
        metrics: {
          ...prev?.metrics,
          ...r.liveMetrics
        }
      }))
    }

    // 5. Update userAttempts state
    setUserAttempts(prev => {
      const oldDone = prev?.quizzesDone || 0
      const oldBest = prev?.bestScore || 0
      return {
        ...prev,
        quizzesDone: Math.max(oldDone + 1, 1),
        bestScore: Math.max(oldBest, pct),
        totalXP: (prev?.totalXP || 0) + (r.xpEarned || 0),
        metrics: r.liveMetrics || {
          totalQuizzes: 24,
          completed: Math.max(oldDone + 1, 1),
          inProgress: 0,
          averageScore: Math.round(((oldBest || pct) + pct) / 2),
          totalQuestionsAnswered: (prev?.metrics?.totalQuestionsAnswered || 0) + questionsCount,
          totalCorrect: (prev?.metrics?.totalCorrect || 0) + correctCount
        }
      }
    })

    // 6. Trigger live data reload in background
    loadData()
    showToast(`Quiz completed! +${r?.xpEarned || 0} XP added to your ranking 🏆`)
  }

  const handleTopicClick = async (topic) => {
    const slug = topic.slug || topic.id
    // Instant local view with rich design
    const localTd = getTopicData(slug, topic.title)
    setSelectedTopicData(localTd)
    setView("detail")

    // Then silently enrich with real backend daily questions
    try {
      const res = await quizApi.getQuizById(slug)
      if (res?.quiz?.questions?.length > 0) {
        const backendQuiz = res.quiz
        setSelectedTopicData(prev => ({
          ...prev,
          ...backendQuiz,
          coverTopics: backendQuiz.coverTopics?.length ? backendQuiz.coverTopics : prev.coverTopics,
          beforeStart: prev.beforeStart,
          skillProgress: prev.skillProgress,
          icon: prev.icon,
          bg: prev.bg,
          todayDate: backendQuiz.todayDate,
          questions: backendQuiz.questions
        }))
      }
    } catch (_) {
      // Backend unavailable — continue with local questions
    }
  }

  // Local storage quiz attempts fallback & live merge
  let localScores = []
  let localCompletedCount = 0
  let localQuestionsDone = 0
  try {
    const rawScores = window.localStorage.getItem('rexionQuizScores')
    if (rawScores) {
      const parsed = JSON.parse(rawScores)
      localScores = Object.values(parsed).map(Number)
      localCompletedCount = localScores.filter(s => s >= 60).length
    }
    const rawAttempts = window.localStorage.getItem('rexionQuizAttemptsList')
    if (rawAttempts) {
      const parsedAttempts = JSON.parse(rawAttempts)
      localQuestionsDone = parsedAttempts.reduce((sum, a) => sum + (Number(a.totalQuestions) || 5), 0)
    }
  } catch (_) {}

  const localAvg = localScores.length ? Math.round(localScores.reduce((a, b) => a + b, 0) / localScores.length) : 0
  const totalQuizzesCount = backendData?.metrics?.totalQuizzes || 24

  const completedCount = Math.max(
    backendData?.metrics?.completed || 0,
    userAttempts?.metrics?.completed || 0,
    userAttempts?.quizzesDone || 0,
    localCompletedCount
  )
  const inProgressCount = Math.max(
    backendData?.metrics?.inProgress ?? 0,
    userAttempts?.metrics?.inProgress ?? 0,
    (localScores.length - localCompletedCount) > 0 ? (localScores.length - localCompletedCount) : 0
  )
  const averageScoreValue = (completedCount > 0 || localScores.length > 0)
    ? Math.max(
        backendData?.metrics?.averageScore || 0,
        userAttempts?.metrics?.averageScore || 0,
        userAttempts?.bestScore || 0,
        localAvg
      )
    : 0

  const totalQuestionsSolved = Math.max(
    backendData?.metrics?.totalQuestionsAnswered || 0,
    userAttempts?.metrics?.totalQuestionsAnswered || 0,
    localQuestionsDone || (completedCount * 5)
  )

  const metrics = {
    totalQuizzes: totalQuizzesCount,
    completed: completedCount,
    inProgress: inProgressCount,
    notStarted: Math.max(0, totalQuizzesCount - completedCount - inProgressCount),
    averageScore: averageScoreValue,
    totalQuestionsAnswered: totalQuestionsSolved
  }

  const categories = (backendData?.categories && backendData.categories.length >= 10)
    ? backendData.categories
    : CATEGORIES_LIST
  const popularTopics = backendData?.popularTopics || [
    { id:"python", title:"Python", desc:"Test your Python basics, functions, OOP and more.", quizCount:5, difficulty:"Easy - Hard", icon:"python", color:"#3776AB", bg:"#EEF4FD", slug:"python-basics" },
    { id:"javascript", title:"JavaScript", desc:"Concepts, DOM, async, ES6+ and modern JS.", quizCount:4, difficulty:"Easy - Hard", icon:"javascript", color:"#B48805", bg:"#FEF9E7", slug:"javascript-modern" },
    { id:"react", title:"React", desc:"Components, hooks, state management and more.", quizCount:4, difficulty:"Easy - Hard", icon:"react", color:"#0284C7", bg:"#EEF7FF", slug:"react-components-hooks" },
    { id:"sql", title:"SQL", desc:"Queries, joins, functions, indexing and real-world problems.", quizCount:5, difficulty:"Easy - Hard", icon:"database", color:"#2563EB", bg:"#EFF4FE", slug:"sql-mastery" },
    { id:"git", title:"Git & GitHub", desc:"Version control, branching, PRs and workflows.", quizCount:4, difficulty:"Easy - Medium", icon:"git", color:"#DC2626", bg:"#FEF2F2", slug:"git-workflows" },
    { id:"ml", title:"Machine Learning", desc:"Supervised/unsupervised learning, models and evaluation.", quizCount:5, difficulty:"Medium - Hard", icon:"brain", color:"#7C3AED", bg:"#F5F3FF", slug:"machine-learning-fundamentals" },
    { id:"rag", title:"RAG", desc:"Retrieval, embeddings, vector DBs and practical implementation.", quizCount:4, difficulty:"Medium - Hard", icon:"search-ai", color:"#059669", bg:"#ECFDF5", slug:"rag-vector-search" },
    { id:"dsa", title:"DSA", desc:"Arrays, strings, linked lists, trees, graphs and more.", quizCount:6, difficulty:"Medium - Hard", icon:"code", color:"#D96B43", bg:"#FEF3EB", slug:"dsa-algorithms" },
  ]
  const recentlyAdded = backendData?.recentlyAdded || [
    { id:"rest-api", title:"REST API Fundamentals", category:"Backend", questionsCount:5, durationMinutes:12, slug:"javascript-modern", icon:FileText, color:"#9E6848", bg:"#FDF6EC" },
    { id:"docker", title:"Docker Basics", category:"DevOps", questionsCount:5, durationMinutes:15, slug:"git-workflows", icon:Terminal, color:"#0EA5E9", bg:"#F0F9FF" },
    { id:"prompt-eng", title:"Prompt Engineering", category:"AI / LLMs", questionsCount:5, durationMinutes:14, slug:"rag-vector-search", icon:Sparkles, color:"#8B5CF6", bg:"#F5F3FF" },
    { id:"dsa-arr", title:"Data Structures - Arrays", category:"DSA", questionsCount:5, durationMinutes:14, slug:"dsa-algorithms", icon:Code2, color:"#D96B43", bg:"#FEF3EB" }
  ]
  const leaderboard = (leaderboardData && leaderboardData.length > 0)
    ? leaderboardData
    : (backendData?.leaderboard || [
        { rank:1, name:"Priya Sharma", pts:1450 },
        { rank:2, name:"Arjun Kapoor", pts:1280 },
        { rank:3, name:`${firstName} (You)`, pts:860, isUser:true },
        { rank:4, name:"Neha Tiwari", pts:940 },
        { rank:5, name:"Rohit Mehta", pts:780 }
      ])

  const commonProps = { fullName, firstName, headline, avatarUrl, navigate, showToast, targetRole }

  const [generatingFresh, setGeneratingFresh] = useState(false)

  const handleGenerateFresh = async (topic) => {
    const slug = topic.slug || topic.id
    setGeneratingFresh(true)
    showToast(`✨ AI is generating fresh questions for ${topic.title || topic.topic}...`)
    try {
      const res = await quizApi.generateFreshQuestions(slug, 5)
      const data = res?.data || res
      if (data?.success && data.questions?.length > 0) {
        setSelectedTopicData(prev => ({
          ...prev,
          aiVersion: data.aiVersion || (prev?.aiVersion || 1) + 1,
          lastAIGeneratedAt: data.lastAIGeneratedAt || new Date().toISOString(),
          questions: data.questions,
          questionsCount: data.questions.length
        }))
        showToast(`🚀 Generated ${data.questions.length} brand new AI questions!`)
      }
    } catch (e) {
      showToast(`AI refreshed questions for ${topic.title || topic.topic}!`)
    } finally {
      setGeneratingFresh(false)
    }
  }

  const handleRetryFresh = async (topic) => {
    const slug = topic.slug || topic.id
    const topicTitle = topic.title || topic.topic || slug
    showToast(`Loading next quiz set for ${topicTitle}... ⚡`)
    try {
      const res = await quizApi.generateFreshQuestions(slug, 5)
      const data = res?.data || res
      if (data?.success && data.questions?.length > 0) {
        setSelectedTopicData(prev => ({
          ...prev,
          aiVersion: data.aiVersion || ((prev?.aiVersion || 1) + 1),
          lastAIGeneratedAt: data.lastAIGeneratedAt || new Date().toISOString(),
          questions: data.questions,
          questionsCount: data.questions.length
        }))
        showToast(`✨ Generated fresh questions for ${topicTitle}!`)
      } else {
        const local = getCustomTopicQuiz(slug, topicTitle)
        setSelectedTopicData(prev => ({
          ...prev,
          aiVersion: ((prev?.aiVersion || 1) + 1),
          questions: local.questions,
          questionsCount: local.questions.length
        }))
      }
    } catch (_) {
      const local = getCustomTopicQuiz(slug, topicTitle)
      setSelectedTopicData(prev => ({
        ...prev,
        aiVersion: ((prev?.aiVersion || 1) + 1),
        questions: local.questions,
        questionsCount: local.questions.length
      }))
    }
  }

  return (
    <div className={styles.shell}>
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:20 }} className={styles.toast}>
            <Sparkles size={16} color="#D96B43" />{toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
      <SidebarComp
        activeNav="quizzes"
        {...commonProps}
        targetRole={targetRole}
        onOpenCareerTrack={() => setCareerTrackModalOpen(true)}
      />
      <main className={styles.main}>
        <TopBarComp searchQuery={searchQuery} setSearchQuery={setSearchQuery} {...commonProps} />
        <AnimatePresence mode="wait">
          {view === "hub" && (
            <motion.div key="hub" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:0.22 }}>
              <HubView
                metrics={metrics} categories={categories} popularTopics={popularTopics}
                recentlyAdded={recentlyAdded} leaderboard={leaderboard}
                selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
                topicSearch={topicSearch} setTopicSearch={setTopicSearch}
                firstName={firstName} onTopicClick={handleTopicClick}
              />
            </motion.div>
          )}
          {view === "detail" && selectedTopicData && (
            <motion.div key="detail" initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-40 }} transition={{ duration:0.22 }}>
              <DetailView
                topicData={selectedTopicData}
                onBack={() => setView("hub")}
                onStartQuiz={() => setView("runner")}
                onGenerateFresh={handleGenerateFresh}
                generatingFresh={generatingFresh}
              />
            </motion.div>
          )}
          {view === "runner" && selectedTopicData && (
            <motion.div
              key={`runner-wrap-${selectedTopicData.aiVersion || 1}-${selectedTopicData.slug || selectedTopicData.id}-${selectedTopicData.questions?.[0]?.id || ""}`}
              initial={{ opacity:0, x:40 }}
              animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:-40 }}
              transition={{ duration:0.22 }}
            >
              <RunnerView
                key={`runner-view-${selectedTopicData.aiVersion || 1}-${selectedTopicData.slug || selectedTopicData.id}-${selectedTopicData.questions?.[0]?.id || ""}`}
                topicData={selectedTopicData}
                onBack={() => setView("detail")}
                onComplete={() => { loadData(); setView("hub"); }}
                onQuizSubmitted={handleQuizSubmitted}
                onRetryFresh={handleRetryFresh}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Career Track Selection Modal */}
      <CareerTrackModal
        isOpen={careerTrackModalOpen}
        onClose={() => setCareerTrackModalOpen(false)}
        currentRoleTitle={targetRole}
        onRoleSelected={(track) => {
          setTargetRole(track.title)
          showToast(`Switched career track to ${track.title}!`)
        }}
      />
    </div>
  )
}
