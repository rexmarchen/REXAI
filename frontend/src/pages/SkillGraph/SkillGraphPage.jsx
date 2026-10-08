import React, { useState, useEffect, useRef } from "react"
import { useNavigate, useSearchParams, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Home, GraduationCap, BookOpen, Target, Layers, Flame, Code2, Sparkles,
  Network, Trophy, Clock, Settings, Headphones, Search, Bell,
  ChevronRight, ChevronDown, Check, Lock, Cpu, Server, Cloud,
  Terminal, Zap, Compass, RefreshCw, ZoomIn, ZoomOut, Maximize2,
  BarChart2, ArrowRight, Lightbulb, Play, Bot
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { getStoredUser } from "../../utils/authSession"
import profileApi from "../../services/profileApi"
import skillGraphApi from "../../services/skillGraphApi"
import careerMountainsAsset from "../../assets/career_hero_mountains.jpg"
import CareerTrackModal from "../../components/common/CareerTrackModal/CareerTrackModal"
import MySkillsSection from "./MySkillsSection"
import styles from "./SkillGraphPage.module.css"

const MAIN_NAV = [
  { id: "home", label: "Home", icon: Home, route: "/" },
  { id: "career", label: "Career", icon: GraduationCap, route: "/career" },
  { id: "learn", label: "Learn", icon: BookOpen, route: "/career" },
  { id: "challenges", label: "Challenges", icon: Target, route: "/challenges" },
  { id: "projects", label: "Projects", icon: Layers, route: "/workspace" },
  { id: "quizzes", label: "Quizzes", icon: Flame, route: "/quizzes" },
  { id: "code-arena", label: "Code Arena", icon: Code2, route: "/code-arena" },
  { id: "ai-tutor", label: "AI Tutor", icon: Sparkles, route: "/ai-tutor" }
]

const PROGRESS_NAV = [
  { id: "skill-graph", label: "Skill Graph", icon: Network, route: "/skill-graph" },
  { id: "my-skills", label: "My Skills", icon: Layers, route: "/my-skills" },
  { id: "achievements", label: "Achievements", icon: Trophy, route: "/career" },
  { id: "learning-history", label: "Learning History", icon: Clock, route: "/challenges" }
]

const MORE_NAV = [
  { id: "settings", label: "Settings", icon: Settings, route: "/profile" },
  { id: "help", label: "Help & Support", icon: Headphones, route: "/ai-tutor" }
]

const TARGET_ROLES = [
  { id: "ai-engineer", label: "AI Engineer", icon: Cpu },
  { id: "agentic-ai", label: "Agentic AI Engineer", icon: Zap },
  { id: "fullstack-developer", label: "Full Stack Engineer", icon: Layers },
  { id: "frontend-developer", label: "Frontend Developer", icon: Code2 },
  { id: "data-analyst", label: "Data Scientist & Analyst", icon: BarChart2 },
  { id: "cloud-devops", label: "Cloud & DevOps", icon: Cloud }
]

export const findMatchingRole = (query, allRoles = TARGET_ROLES) => {
  if (!query) return null
  const q = String(query).toLowerCase().trim()
  let found = allRoles.find(r => r.id.toLowerCase() === q || r.label.toLowerCase() === q)
  if (found) return found
  const qSlug = q.replace(/[^a-z0-9]+/g, '-')
  found = allRoles.find(r => r.id.toLowerCase() === qSlug)
  if (found) return found
  if (q.includes('agentic') || q.includes('agent')) return allRoles.find(r => r.id === 'agentic-ai') || null
  if (q.includes('full') || q.includes('fullstack') || q.includes('software')) return allRoles.find(r => r.id === 'fullstack-developer') || null
  if (q.includes('front') || q.includes('ui') || q.includes('web')) return allRoles.find(r => r.id === 'frontend-developer') || null
  if (q.includes('data') || q.includes('analyst') || q.includes('scientist')) return allRoles.find(r => r.id === 'data-analyst') || null
  if (q.includes('devops') || q.includes('cloud') || q.includes('sre') || q.includes('aws')) return allRoles.find(r => r.id === 'cloud-devops') || null
  if (q.includes('ai') || q.includes('machine learning') || q.includes('ml')) return allRoles.find(r => r.id === 'ai-engineer') || null
  return null
}

// Render skill icon based on type
// Render SVG glyph inside leaf skill nodes matching media_1790878206118.jpg
const LeafGlyph = ({ glyph, color }) => {
  switch (glyph) {
    case "check":
      return <path d="M -4.5 0 L -1.5 3.5 L 4.5 -3" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    case "lock":
      return (
        <g transform="translate(-4, -5) scale(0.65)">
          <rect x="0" y="4" width="12" height="9" rx="2" fill="none" stroke={color} strokeWidth="2" />
          <path d="M 2.5 4 V 2.5 A 3.5 3.5 0 0 1 9.5 2.5 V 4" fill="none" stroke={color} strokeWidth="2" />
        </g>
      )
    case "table": // Pandas
      return (
        <g transform="translate(-5, -5) scale(0.7)">
          <rect x="0" y="0" width="14" height="14" rx="2" fill="none" stroke={color} strokeWidth="1.8" />
          <line x1="0" y1="5" x2="14" y2="5" stroke={color} strokeWidth="1.5" />
          <line x1="7" y1="5" x2="7" y2="14" stroke={color} strokeWidth="1.5" />
        </g>
      )
    case "cube": // NumPy
      return (
        <g transform="translate(-5, -5) scale(0.7)">
          <path d="M 7 1 L 13 4.5 L 13 11 L 7 14 L 1 11 L 1 4.5 Z" fill="none" stroke={color} strokeWidth="1.6" />
          <path d="M 7 1 L 7 14 M 7 7 L 13 4.5 M 7 7 L 1 4.5" fill="none" stroke={color} strokeWidth="1.4" />
        </g>
      )
    case "sparkles": // Prompt Engineering
      return (
        <g transform="translate(-5, -5) scale(0.7)">
          <path d="M 7 0 L 8.5 5.5 L 14 7 L 8.5 8.5 L 7 14 L 5.5 8.5 L 0 7 L 5.5 5.5 Z" fill={color} />
        </g>
      )
    case "rag": // RAG
      return (
        <g transform="translate(-5, -5) scale(0.7)">
          <circle cx="6" cy="6" r="4.5" fill="none" stroke={color} strokeWidth="1.8" />
          <line x1="9.5" y1="9.5" x2="13.5" y2="13.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </g>
      )
    case "code": // OOP
      return (
        <g transform="translate(-5, -5) scale(0.7)">
          <path d="M 4 2 L 1 7 L 4 12" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 10 2 L 13 7 L 10 12" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )
    case "zap": // Async / FastAPI
      return (
        <path d="M 1 -5 L -3 1 L 0.5 1 L -1 5 L 4 -1 L 0.5 -1 Z" fill={color} />
      )
    case "network": // APIs
      return (
        <g transform="translate(-5, -5) scale(0.7)">
          <circle cx="7" cy="3" r="2" fill={color} />
          <circle cx="3" cy="11" r="2" fill={color} />
          <circle cx="11" cy="11" r="2" fill={color} />
          <line x1="7" y1="5" x2="3" y2="9" stroke={color} strokeWidth="1.5" />
          <line x1="7" y1="5" x2="11" y2="9" stroke={color} strokeWidth="1.5" />
        </g>
      )
    case "server": // Node.js
      return (
        <g transform="translate(-5, -5) scale(0.7)">
          <rect x="1" y="1" width="12" height="5" rx="1.5" fill="none" stroke={color} strokeWidth="1.6" />
          <rect x="1" y="8" width="12" height="5" rx="1.5" fill="none" stroke={color} strokeWidth="1.6" />
          <circle cx="4" cy="3.5" r="1" fill={color} />
          <circle cx="4" cy="10.5" r="1" fill={color} />
        </g>
      )
    case "docker": // Docker
      return (
        <g transform="translate(-5, -4) scale(0.7)">
          <rect x="2" y="3" width="3" height="3" fill={color} />
          <rect x="6" y="3" width="3" height="3" fill={color} />
          <rect x="6" y="-0.5" width="3" height="3" fill={color} />
          <path d="M 0 7 C 2 6 12 6 15 9 C 14 12 3 13 0 7 Z" fill="none" stroke={color} strokeWidth="1.6" />
        </g>
      )
    case "terminal": // Linux
      return (
        <g transform="translate(-5, -5) scale(0.7)">
          <path d="M 2 3 L 6 7 L 2 11" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="8" y1="11" x2="12" y2="11" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </g>
      )
    default:
      return <circle r="3.5" fill={color} />
  }
}

// Render skill icon based on type
const SkillIcon = ({ iconType, size = 16, color = "currentColor" }) => {
  switch (iconType) {
    case "python":
      return (
        <g transform="scale(0.85)">
          <path d="M -7 -4 C -7 -8 5 -8 5 -4 L 5 -2 L -3 -2 C -5 -2 -7 0 -7 2 Z" fill="#387EB8" />
          <path d="M 7 4 C 7 8 -5 8 -5 4 L -5 2 L 3 2 C 5 2 7 0 7 -2 Z" fill="#FFE052" />
          <circle cx="-2" cy="-5" r="1" fill="#FFFFFF" />
          <circle cx="2" cy="5" r="1" fill="#FFFFFF" />
        </g>
      )
    case "brain":
      return <Cpu size={size} color={color} />
    case "sparkles":
      return <Sparkles size={size} color={color} />
    case "server":
      return <Server size={size} color={color} />
    case "cloud":
      return <Cloud size={size} color={color} />
    case "terminal":
      return <Terminal size={size} color={color} />
    case "zap":
      return <Zap size={size} color={color} />
    case "code":
      return <Code2 size={size} color={color} />
    case "check":
      return <Check size={size} color={color} />
    case "lock":
      return <Lock size={size} color={color} />
    default:
      return <Layers size={size} color={color} />
  }
}

const DEFAULT_AI_ENGINEER_GRAPH = {
  roleId: 'ai-engineer',
  roleName: 'AI Engineer',
  targetLabel: 'AI Engineer',
  overallProgress: 0,
  stats: {
    skillsLearned: '0 / 16',
    projectsCompleted: '0 / 5',
    timeSpent: '0h 0m'
  },
  centerNode: {
    id: 'center-goal',
    title: 'AI Engineer',
    subtitle: '0% complete',
    progress: 0,
    icon: 'brain',
    status: 'in-progress'
  },
  clusters: [
    {
      id: 'cluster-programming',
      title: 'Python',
      categoryTag: 'Programming',
      progress: 0,
      color: '#10B981',
      theme: 'green',
      icon: 'python',
      subSkills: [
        {
          id: 'sub-ds-1',
          title: 'Data Structures',
          progress: 0,
          status: 'in-progress',
          glyph: 'code',
          category: 'Core Python',
          primaryAction: { type: 'challenge', title: 'Reverse a String', label: 'Solve Challenge', url: '/challenges/ch-1' },
          whatToDo: [
            { id: 'task-ch-1', type: 'challenge', title: 'Solve Challenge: Reverse a String', desc: 'Production UTF-8 string manipulation challenge with unit tests.', url: '/challenges/ch-1', badge: '50 XP • Easy', actionLabel: 'Solve Challenge →' },
            { id: 'task-code-arena', type: 'arena', title: 'Practice in Code Arena', desc: 'Test your algorithm speed with Two Sum & Hash Map problems.', url: '/code-arena', badge: 'Code Arena • DSA', actionLabel: 'Enter Arena →' },
            { id: 'task-tutor-ds', type: 'tutor', title: 'Practice with AI Tutor', desc: 'Ask AI Tutor to quiz you on Time Complexity (Big-O) and Data Structures.', url: '/ai-tutor?topic=Python Data Structures and Big O', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' },
            { id: 'task-quiz-python', type: 'quiz', title: 'Python Assessment Quiz', desc: 'Take the Python fundamentals & algorithms assessment.', url: '/quizzes?topic=python-basics', badge: 'Skill Quiz', actionLabel: 'Take Quiz →' }
          ]
        },
        {
          id: 'sub-oop',
          title: 'OOP',
          progress: 0,
          status: 'in-progress',
          glyph: 'code',
          category: 'Core Python',
          primaryAction: { type: 'challenge', title: 'LRU Cache Implementation', label: 'Solve Challenge', url: '/challenges/ch-3' },
          whatToDo: [
            { id: 'task-ch-3', type: 'challenge', title: 'Solve Challenge: LRU Cache Implementation', desc: 'Implement a production doubly-linked list & hash table LRU cache.', url: '/challenges/ch-3', badge: '100 XP • Hard', actionLabel: 'Solve Challenge →' },
            { id: 'task-tutor-oop', type: 'tutor', title: 'Practice with AI Tutor', desc: 'Learn OOP SOLID principles, dunder methods, and inheritance.', url: '/ai-tutor?topic=Python Object Oriented Programming and SOLID', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' },
            { id: 'task-quiz-oop', type: 'quiz', title: 'Python OOP Quiz', desc: 'Benchmark your understanding of classes and design patterns.', url: '/quizzes?topic=python-basics', badge: 'Skill Quiz', actionLabel: 'Take Quiz →' }
          ]
        },
        {
          id: 'sub-async',
          title: 'Async',
          progress: 0,
          status: 'in-progress',
          glyph: 'zap',
          category: 'Core Python',
          primaryAction: { type: 'challenge', title: 'Debounce Function', label: 'Solve Challenge', url: '/challenges/ch-2' },
          whatToDo: [
            { id: 'task-ch-2', type: 'challenge', title: 'Solve Challenge: Debounce Function', desc: 'Implement a high-frequency event debounce and rate-limiting wrapper.', url: '/challenges/ch-2', badge: '75 XP • Medium', actionLabel: 'Solve Challenge →' },
            { id: 'task-tutor-async', type: 'tutor', title: 'Practice with AI Tutor', desc: 'Learn AsyncIO event loops, tasks, gather, and concurrency pitfalls.', url: '/ai-tutor?topic=Asyncio and Concurrency in Python', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-ds-2',
          title: 'Data Structures',
          progress: 0,
          status: 'in-progress',
          glyph: 'code',
          category: 'Core Python',
          primaryAction: { type: 'challenge', title: 'BST Validator', label: 'Solve Challenge', url: '/challenges/ch-9' },
          whatToDo: [
            { id: 'task-ch-9', type: 'challenge', title: 'Solve Challenge: Binary Search Tree Validator', desc: 'Write an O(N) recursive validator ensuring strict binary search tree invariants.', url: '/challenges/ch-9', badge: '80 XP • Medium', actionLabel: 'Solve Challenge →' },
            { id: 'task-arena-trees', type: 'arena', title: 'Code Arena Trees & Graphs', desc: 'Solve LeetCode-style tree traversal and DFS problems.', url: '/code-arena', badge: 'Code Arena', actionLabel: 'Enter Arena →' }
          ]
        }
      ]
    },
    {
      id: 'cluster-ml',
      title: 'Machine Learning',
      categoryTag: null,
      progress: 0,
      color: '#10B981',
      theme: 'green',
      icon: 'brain',
      subSkills: [
        {
          id: 'sub-pandas',
          title: 'Pandas',
          progress: 0,
          status: 'in-progress',
          glyph: 'table',
          category: 'Data Science',
          primaryAction: { type: 'challenge', title: 'Sales Analytics Aggregation', label: 'Solve Challenge', url: '/challenges/ch-7' },
          whatToDo: [
            { id: 'task-ch-7', type: 'challenge', title: 'Solve Challenge: Sales Analytics Aggregation', desc: 'Compute monthly growth, moving averages, and top customer cohorts.', url: '/challenges/ch-7', badge: '100 XP • Medium', actionLabel: 'Solve Challenge →' },
            { id: 'task-tutor-pandas', type: 'tutor', title: 'Practice with AI Tutor', desc: 'Ask AI Tutor how to optimize Pandas with vectorization and parquet.', url: '/ai-tutor?topic=Pandas DataFrames and Performance', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' },
            { id: 'task-quiz-ml', type: 'quiz', title: 'Machine Learning Fundamentals Quiz', desc: 'Test your understanding of data preprocessing and feature scaling.', url: '/quizzes?topic=machine-learning', badge: 'Skill Quiz', actionLabel: 'Take Quiz →' }
          ]
        },
        {
          id: 'sub-deep-learning',
          title: 'Deep Learning',
          progress: 0,
          status: 'locked',
          glyph: 'lock',
          category: 'Deep Learning',
          primaryAction: { type: 'tutor', title: 'Neural Networks & Backprop', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Neural Networks and Backpropagation' },
          whatToDo: [
            { id: 'task-tutor-dl', type: 'tutor', title: 'Practice with AI Tutor: Neural Networks', desc: 'Understand activation functions, gradients, loss surfaces, and PyTorch.', url: '/ai-tutor?topic=Neural Networks and Backpropagation', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' },
            { id: 'task-quiz-dl', type: 'quiz', title: 'Deep Learning Concepts Quiz', desc: 'Evaluate your knowledge of CNNs, Transformers, and optimization.', url: '/quizzes?topic=machine-learning', badge: 'Skill Quiz', actionLabel: 'Take Quiz →' }
          ]
        },
        {
          id: 'sub-numpy',
          title: 'NumPy',
          progress: 0,
          status: 'in-progress',
          glyph: 'cube',
          category: 'Data Science',
          primaryAction: { type: 'tutor', title: 'NumPy Vectorized Operations', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=NumPy Array Vectorization and Broadcasting' },
          whatToDo: [
            { id: 'task-tutor-numpy', type: 'tutor', title: 'Practice with AI Tutor: NumPy Vectorization', desc: 'Master broadcasting rules, array slicing, and memory views.', url: '/ai-tutor?topic=NumPy Array Vectorization and Broadcasting', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' },
            { id: 'task-quiz-numpy', type: 'quiz', title: 'Scientific Computing Assessment', desc: 'Benchmark your linear algebra and numerical array speed.', url: '/quizzes?topic=machine-learning', badge: 'Skill Quiz', actionLabel: 'Take Quiz →' }
          ]
        }
      ]
    },
    {
      id: 'cluster-llm',
      title: 'LLMs',
      categoryTag: 'AI & LLMs',
      progress: 0,
      color: '#E27D60',
      theme: 'orange',
      icon: 'sparkles',
      subSkills: [
        {
          id: 'sub-prompt-eng',
          title: 'Prompt Engineering',
          progress: 0,
          status: 'in-progress',
          glyph: 'sparkles',
          category: 'Generative AI',
          primaryAction: { type: 'challenge', title: 'Semantic Prompt Compressor', label: 'Solve Challenge', url: '/challenges/ch-12' },
          whatToDo: [
            { id: 'task-ch-12', type: 'challenge', title: 'Solve Challenge: Semantic Prompt Compressor', desc: 'Compress instructions and context windows while preserving semantic accuracy.', url: '/challenges/ch-12', badge: '100 XP • Medium', actionLabel: 'Solve Challenge →' },
            { id: 'task-tutor-prompt', type: 'tutor', title: 'Practice with AI Tutor', desc: 'Learn Chain-of-Thought, ReAct prompting, and few-shot formatting.', url: '/ai-tutor?topic=Prompt Engineering and Few-Shot Techniques', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' },
            { id: 'task-quiz-llm', type: 'quiz', title: 'Generative AI & LLMs Quiz', desc: 'Test your understanding of temperature, top-p, tokens, and safety.', url: '/quizzes?topic=ai-llms', badge: 'Skill Quiz', actionLabel: 'Take Quiz →' }
          ]
        },
        {
          id: 'sub-rag',
          title: 'RAG',
          progress: 0,
          status: 'locked',
          glyph: 'lock',
          category: 'Generative AI',
          primaryAction: { type: 'challenge', title: 'RAG Pipeline Embeddings', label: 'Solve Challenge', url: '/challenges/ch-5' },
          whatToDo: [
            { id: 'task-ch-5', type: 'challenge', title: 'Solve Challenge: RAG Pipeline Embeddings', desc: 'Build cosine similarity search, chunking, and context ranking in Python.', url: '/challenges/ch-5', badge: '100 XP • Hard', actionLabel: 'Solve Challenge →' },
            { id: 'task-tutor-rag', type: 'tutor', title: 'Practice with AI Tutor: RAG Architecture', desc: 'Ask AI Tutor how to reduce hallucinations, rerank results, and index vectors.', url: '/ai-tutor?topic=Retrieval Augmented Generation RAG Pipeline', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' },
            { id: 'task-quiz-rag', type: 'quiz', title: 'RAG & Vector Databases Quiz', desc: 'Evaluate knowledge on HNSW indexing, chunk sizes, and hybrid search.', url: '/quizzes?topic=ai-llms', badge: 'Skill Quiz', actionLabel: 'Take Quiz →' }
          ]
        },
        {
          id: 'sub-agents',
          title: 'Agents',
          progress: 0,
          status: 'locked',
          glyph: 'lock',
          category: 'Generative AI',
          primaryAction: { type: 'tutor', title: 'Autonomous AI Agents', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Autonomous AI Agents and Tool Calling' },
          whatToDo: [
            { id: 'task-tutor-agents', type: 'tutor', title: 'Practice with AI Tutor: Autonomous Agents', desc: 'Understand function calling, state management, and multi-agent coordination.', url: '/ai-tutor?topic=Autonomous AI Agents and Tool Calling', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' },
            { id: 'task-quiz-agents', type: 'quiz', title: 'AI Agents Architecture Quiz', desc: 'Benchmark your grasp of LangChain, AutoGen, and tool routing.', url: '/quizzes?topic=ai-llms', badge: 'Skill Quiz', actionLabel: 'Take Quiz →' }
          ]
        }
      ]
    },
    {
      id: 'cluster-backend',
      title: 'Backend',
      categoryTag: 'Backend',
      progress: 0,
      color: '#F59E0B',
      theme: 'amber',
      icon: 'server',
      subSkills: [
        {
          id: 'sub-fastapi',
          title: 'FastAPI',
          progress: 0,
          status: 'locked',
          glyph: 'lock',
          category: 'Backend Architecture',
          primaryAction: { type: 'challenge', title: 'API Rate Limiting Shield', label: 'Solve Challenge', url: '/challenges/ch-10' },
          whatToDo: [
            { id: 'task-ch-10', type: 'challenge', title: 'Solve Challenge: API Rate Limiting Shield', desc: 'Implement a token-bucket rate limiter for high-traffic FastAPI endpoints.', url: '/challenges/ch-10', badge: '100 XP • Hard', actionLabel: 'Solve Challenge →' },
            { id: 'task-tutor-fastapi', type: 'tutor', title: 'Practice with AI Tutor', desc: 'Ask AI Tutor about async route handlers, dependency injection, and Pydantic.', url: '/ai-tutor?topic=FastAPI Async Architecture and Dependency Injection', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' },
            { id: 'task-quiz-fastapi', type: 'quiz', title: 'FastAPI & Microservices Quiz', desc: 'Evaluate your mastery of HTTP status codes, OpenAPI, and middleware.', url: '/quizzes?topic=backend-apis', badge: 'Skill Quiz', actionLabel: 'Take Quiz →' }
          ]
        },
        {
          id: 'sub-node',
          title: 'Node.js',
          progress: 0,
          status: 'in-progress',
          glyph: 'server',
          category: 'Backend Architecture',
          primaryAction: { type: 'challenge', title: 'Microservice Event Bus', label: 'Solve Challenge', url: '/challenges/ch-6' },
          whatToDo: [
            { id: 'task-ch-6', type: 'challenge', title: 'Solve Challenge: Microservice Event Bus', desc: 'Build an in-memory pub/sub broker handling dead-letter queues.', url: '/challenges/ch-6', badge: '125 XP • Hard', actionLabel: 'Solve Challenge →' },
            { id: 'task-tutor-node', type: 'tutor', title: 'Practice with AI Tutor', desc: 'Explore the Node.js libuv event loop, streams, and cluster module.', url: '/ai-tutor?topic=Node.js Event Loop Streams and Performance', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-apis',
          title: 'APIs',
          progress: 0,
          status: 'in-progress',
          glyph: 'network',
          category: 'Backend Architecture',
          primaryAction: { type: 'challenge', title: 'API Rate Limiting Shield', label: 'Solve Challenge', url: '/challenges/ch-10' },
          whatToDo: [
            { id: 'task-ch-10-api', type: 'challenge', title: 'Solve Challenge: API Rate Limiting Shield', desc: 'Master rate limiting, CORS headers, and secure request verification.', url: '/challenges/ch-10', badge: '100 XP • Production', actionLabel: 'Solve Challenge →' },
            { id: 'task-tutor-api', type: 'tutor', title: 'Practice with AI Tutor', desc: 'Learn RESTful API best practices, idempotent methods, and JWT security.', url: '/ai-tutor?topic=REST API Design and Security Best Practices', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' },
            { id: 'task-quiz-apis', type: 'quiz', title: 'Web APIs Assessment Quiz', desc: 'Benchmark your understanding of status codes, OAuth, and webhooks.', url: '/quizzes?topic=backend-apis', badge: 'Skill Quiz', actionLabel: 'Take Quiz →' }
          ]
        }
      ]
    },
    {
      id: 'cluster-devops',
      title: 'DevOps',
      categoryTag: 'DevOps & Tools',
      progress: 0,
      color: '#64748B',
      theme: 'slate',
      icon: 'cloud',
      subSkills: [
        {
          id: 'sub-docker',
          title: 'Docker',
          progress: 0,
          status: 'locked',
          glyph: 'lock',
          category: 'DevOps & Deployment',
          primaryAction: { type: 'challenge', title: 'Dockerfile Optimization', label: 'Solve Challenge', url: '/challenges/ch-8' },
          whatToDo: [
            { id: 'task-ch-8', type: 'challenge', title: 'Solve Challenge: Dockerfile Optimization', desc: 'Reduce container image size from 1.2GB to under 150MB with multi-stage builds.', url: '/challenges/ch-8', badge: '75 XP • Medium', actionLabel: 'Solve Challenge →' },
            { id: 'task-tutor-docker', type: 'tutor', title: 'Practice with AI Tutor', desc: 'Ask AI Tutor about Docker networking, bind mounts, and docker-compose orchestration.', url: '/ai-tutor?topic=Docker Multi-Stage Builds and Container Optimization', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' },
            { id: 'task-quiz-docker', type: 'quiz', title: 'Docker & Containers Quiz', desc: 'Evaluate your knowledge of image layers, caching, and daemon flags.', url: '/quizzes?topic=git', badge: 'Skill Quiz', actionLabel: 'Take Quiz →' }
          ]
        },
        {
          id: 'sub-aws',
          title: 'AWS',
          progress: 0,
          status: 'locked',
          glyph: 'lock',
          category: 'Cloud Infrastructure',
          primaryAction: { type: 'tutor', title: 'AWS Cloud Architecture', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=AWS Serverless Architecture S3 Lambda and ECS' },
          whatToDo: [
            { id: 'task-tutor-aws', type: 'tutor', title: 'Practice with AI Tutor: AWS Serverless', desc: 'Understand S3, Lambda, API Gateway, IAM policies, and CloudWatch.', url: '/ai-tutor?topic=AWS Serverless Architecture S3 Lambda and ECS', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' },
            { id: 'task-quiz-aws', type: 'quiz', title: 'AWS Cloud Practitioner Quiz', desc: 'Benchmark your cloud architecture knowledge.', url: '/quizzes?topic=cloud-aws', badge: 'Skill Quiz', actionLabel: 'Take Quiz →' }
          ]
        },
        {
          id: 'sub-linux',
          title: 'Linux',
          progress: 0,
          status: 'in-progress',
          glyph: 'terminal',
          category: 'Systems & Shell',
          primaryAction: { type: 'tutor', title: 'Linux CLI & Scripting', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Linux Command Line Bash Scripting and Permissions' },
          whatToDo: [
            { id: 'task-tutor-linux', type: 'tutor', title: 'Practice with AI Tutor: Linux CLI', desc: 'Master pipes, grep, sed, awk, systemd, and cron jobs.', url: '/ai-tutor?topic=Linux Command Line Bash Scripting and Permissions', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' },
            { id: 'task-quiz-linux', type: 'quiz', title: 'Linux Administration Quiz', desc: 'Test your understanding of file permissions, processes, and sockets.', url: '/quizzes?topic=git', badge: 'Skill Quiz', actionLabel: 'Take Quiz →' }
          ]
        }
      ]
    }
  ],
  skillProgress: [
    { name: 'Python', progress: 0, color: '#10B981', icon: 'python' },
    { name: 'Machine Learning', progress: 0, color: '#10B981', icon: 'brain' },
    { name: 'RAG', progress: 0, color: '#E27D60', icon: 'sparkles' },
    { name: 'FastAPI', progress: 0, color: '#F59E0B', icon: 'zap' },
    { name: 'Docker', progress: 0, color: '#64748B', icon: 'layers' }
  ],
  recommendedSkills: [
    {
      rank: 1,
      name: 'FastAPI',
      reason: 'Based on your AI Engineer goal',
      actionType: 'challenge',
      actionUrl: '/challenges/ch-10',
      actionLabel: 'Solve Challenge',
      taskTitle: 'API Rate Limiting Shield',
      category: 'Backend',
      xp: 100
    },
    {
      rank: 2,
      name: 'Docker',
      reason: 'In demand for current jobs',
      actionType: 'challenge',
      actionUrl: '/challenges/ch-8',
      actionLabel: 'Solve Challenge',
      taskTitle: 'Dockerfile Optimization',
      category: 'DevOps',
      xp: 75
    },
    {
      rank: 3,
      name: 'AWS',
      reason: 'Completes your DevOps skills',
      actionType: 'tutor',
      actionUrl: '/ai-tutor?topic=AWS Serverless Architecture S3 Lambda and ECS',
      actionLabel: 'Learn with AI',
      taskTitle: 'AWS Serverless Mastery',
      category: 'Cloud',
      xp: 60
    },
    {
      rank: 4,
      name: 'System Design',
      reason: 'Next step for advanced roles',
      actionType: 'challenge',
      actionUrl: '/challenges/ch-6',
      actionLabel: 'Solve Challenge',
      taskTitle: 'Microservice Event Bus',
      category: 'Architecture',
      xp: 125
    }
  ],
  quote: {
    text: 'Small steps every day lead to big results.',
    author: 'REXION'
  }
}

const DEFAULT_AGENTIC_AI_GRAPH = {
  roleId: 'agentic-ai',
  roleName: 'Agentic AI Engineer',
  targetLabel: 'Agentic AI Engineer',
  overallProgress: 0,
  stats: {
    skillsLearned: '0 / 15',
    projectsCompleted: '0 / 5',
    timeSpent: '0h 0m'
  },
  centerNode: {
    id: 'center-goal',
    title: 'Agentic AI Engineer',
    subtitle: '0% complete',
    progress: 0,
    icon: 'zap',
    status: 'in-progress'
  },
  clusters: [
    {
      id: 'cluster-agent-core',
      title: 'Agent Core',
      categoryTag: 'Architecture',
      progress: 0,
      color: '#10B981',
      theme: 'green',
      icon: 'brain',
      subSkills: [
        {
          id: 'sub-autonomous-agents',
          title: 'Autonomous Agents',
          progress: 0,
          status: 'in-progress',
          glyph: 'sparkles',
          category: 'Architecture',
          primaryAction: { type: 'tutor', title: 'Autonomous Agent Loops & ReAct', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Autonomous AI Agents ReAct Loops and Task Decomposition' },
          whatToDo: [
            { id: 'task-tutor-agents', type: 'tutor', title: 'Practice with AI Tutor: Agent Loops', desc: 'Explore ReAct, Plan-and-Solve, and dynamic tool selection architectures.', url: '/ai-tutor?topic=Autonomous AI Agents ReAct Loops and Task Decomposition', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' },
            { id: 'task-quiz-agents', type: 'quiz', title: 'AI & Agentic Systems Quiz', desc: 'Assess your understanding of agentic decision loops, memory, and reflection.', url: '/quizzes?topic=ai-llms', badge: 'Skill Quiz', actionLabel: 'Take Quiz →' }
          ]
        },
        {
          id: 'sub-tool-calling',
          title: 'Tool Calling & APIs',
          progress: 0,
          status: 'in-progress',
          glyph: 'code',
          category: 'Architecture',
          primaryAction: { type: 'challenge', title: 'API Rate Limiting Shield', label: 'Solve Challenge', url: '/challenges/ch-10' },
          whatToDo: [
            { id: 'task-ch-10-agent', type: 'challenge', title: 'Solve Challenge: API Rate Limiting Shield', desc: 'Ensure agents handle API throttles, exponential backoff, and retry budgets.', url: '/challenges/ch-10', badge: '100 XP • Production', actionLabel: 'Solve Challenge →' },
            { id: 'task-tutor-tools', type: 'tutor', title: 'Practice with AI Tutor: Function Calling', desc: 'Learn JSON Schema tool declarations, parallel tool calls, and error recovery.', url: '/ai-tutor?topic=LLM Function Calling and JSON Schema Tool Validation', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-prompt-eng-agent',
          title: 'System Prompts',
          progress: 0,
          status: 'in-progress',
          glyph: 'sparkles',
          category: 'Architecture',
          primaryAction: { type: 'challenge', title: 'Semantic Prompt Compressor', label: 'Solve Challenge', url: '/challenges/ch-12' },
          whatToDo: [
            { id: 'task-ch-12-agent', type: 'challenge', title: 'Solve Challenge: Semantic Prompt Compressor', desc: 'Optimize agent instructions and context windows while preserving intent.', url: '/challenges/ch-12', badge: '100 XP • Medium', actionLabel: 'Solve Challenge →' }
          ]
        }
      ]
    },
    {
      id: 'cluster-orchestration',
      title: 'Orchestration',
      categoryTag: 'Frameworks',
      progress: 0,
      color: '#0EA5E9',
      theme: 'blue',
      icon: 'code',
      subSkills: [
        {
          id: 'sub-langgraph',
          title: 'LangGraph & Workflows',
          progress: 0,
          status: 'in-progress',
          glyph: 'zap',
          category: 'Frameworks',
          primaryAction: { type: 'tutor', title: 'LangGraph State Graphs & Cycles', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=LangGraph StateGraphs Cycles Human in the Loop' },
          whatToDo: [
            { id: 'task-tutor-langgraph', type: 'tutor', title: 'Practice with AI Tutor: LangGraph', desc: 'Learn cyclic graph state persistence, checkpointers, and conditional edges.', url: '/ai-tutor?topic=LangGraph StateGraphs Cycles Human in the Loop', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-multi-agent',
          title: 'Multi-Agent Teams',
          progress: 0,
          status: 'in-progress',
          glyph: 'network',
          category: 'Frameworks',
          primaryAction: { type: 'tutor', title: 'Multi-Agent Collaboration', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Multi-Agent Collaboration Routing Hierarchical Supervisors' },
          whatToDo: [
            { id: 'task-tutor-multiagent', type: 'tutor', title: 'Practice with AI Tutor: Multi-Agent Teams', desc: 'Build hierarchical supervisor and router networks for team execution.', url: '/ai-tutor?topic=Multi-Agent Collaboration Routing Hierarchical Supervisors', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-human-in-loop',
          title: 'Human-in-the-Loop',
          progress: 0,
          status: 'in-progress',
          glyph: 'check',
          category: 'Frameworks',
          primaryAction: { type: 'tutor', title: 'Human in the Loop Approval Gates', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Human in the Loop Approval Gates for Agent Systems' },
          whatToDo: [
            { id: 'task-tutor-hitl', type: 'tutor', title: 'Practice with AI Tutor: HITL', desc: 'Design critical action interrupts, approval gates, and time travel debugging.', url: '/ai-tutor?topic=Human in the Loop Approval Gates for Agent Systems', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        }
      ]
    },
    {
      id: 'cluster-mcp',
      title: 'MCP & Protocols',
      categoryTag: 'Integrations',
      progress: 0,
      color: '#D96B43',
      theme: 'orange',
      icon: 'zap',
      subSkills: [
        {
          id: 'sub-mcp-protocol',
          title: 'Model Context Protocol',
          progress: 0,
          status: 'in-progress',
          glyph: 'sparkles',
          category: 'Integrations',
          primaryAction: { type: 'tutor', title: 'Model Context Protocol (MCP) Standards', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Model Context Protocol MCP Servers Clients Tools Resources' },
          whatToDo: [
            { id: 'task-tutor-mcp', type: 'tutor', title: 'Practice with AI Tutor: MCP', desc: 'Master client/server JSON-RPC architecture, tools, resources, and prompts.', url: '/ai-tutor?topic=Model Context Protocol MCP Servers Clients Tools Resources', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-custom-tools',
          title: 'MCP Server Dev',
          progress: 0,
          status: 'in-progress',
          glyph: 'server',
          category: 'Integrations',
          primaryAction: { type: 'challenge', title: 'API Rate Limiting Shield', label: 'Solve Challenge', url: '/challenges/ch-10' },
          whatToDo: [
            { id: 'task-ch-10-mcp', type: 'challenge', title: 'Solve Challenge: MCP Server Resiliency', desc: 'Build fault-tolerant rate-limited MCP endpoints for LLM consumers.', url: '/challenges/ch-10', badge: '100 XP • Production', actionLabel: 'Solve Challenge →' }
          ]
        },
        {
          id: 'sub-secure-sandboxes',
          title: 'Tool Sandboxing',
          progress: 0,
          status: 'in-progress',
          glyph: 'lock',
          category: 'Integrations',
          primaryAction: { type: 'tutor', title: 'Sandboxing Untrusted Agent Code Execution', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Sandboxing Untrusted Agent Code Execution Docker gVisor' },
          whatToDo: [
            { id: 'task-tutor-sandbox', type: 'tutor', title: 'Practice with AI Tutor: Sandboxing', desc: 'Safely execute arbitrary Python code and bash commands in isolated environments.', url: '/ai-tutor?topic=Sandboxing Untrusted Agent Code Execution Docker gVisor', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        }
      ]
    },
    {
      id: 'cluster-infrastructure',
      title: 'Infrastructure',
      categoryTag: 'Systems',
      progress: 0,
      color: '#F59E0B',
      theme: 'amber',
      icon: 'server',
      subSkills: [
        {
          id: 'sub-memory-rag',
          title: 'Vector Memory & RAG',
          progress: 0,
          status: 'in-progress',
          glyph: 'rag',
          category: 'Systems',
          primaryAction: { type: 'challenge', title: 'Semantic Prompt Compressor', label: 'Solve Challenge', url: '/challenges/ch-12' },
          whatToDo: [
            { id: 'task-ch-12-rag', type: 'challenge', title: 'Solve Challenge: Semantic Compression', desc: 'Compress vector memories and agent scratchpads to save token limits.', url: '/challenges/ch-12', badge: '100 XP • Medium', actionLabel: 'Solve Challenge →' }
          ]
        },
        {
          id: 'sub-streaming-sse',
          title: 'Token Streaming & SSE',
          progress: 0,
          status: 'in-progress',
          glyph: 'zap',
          category: 'Systems',
          primaryAction: { type: 'challenge', title: 'Async Job Queue Engine', label: 'Solve Challenge', url: '/challenges/ch-11' },
          whatToDo: [
            { id: 'task-ch-11-stream', type: 'challenge', title: 'Solve Challenge: Async Job Queue', desc: 'Stream live execution chunks, agent thoughts, and tool states to users.', url: '/challenges/ch-11', badge: '100 XP • Hard', actionLabel: 'Solve Challenge →' }
          ]
        },
        {
          id: 'sub-async-orchestration',
          title: 'Celery / Inngest / Queues',
          progress: 0,
          status: 'in-progress',
          glyph: 'terminal',
          category: 'Systems',
          primaryAction: { type: 'challenge', title: 'Async Job Queue Engine', label: 'Solve Challenge', url: '/challenges/ch-11' },
          whatToDo: [
            { id: 'task-ch-11-queue', type: 'challenge', title: 'Solve Challenge: Async Job Queue Engine', desc: 'Handle long-running agent background workflows with idempotency and retries.', url: '/challenges/ch-11', badge: '100 XP • Hard', actionLabel: 'Solve Challenge →' }
          ]
        }
      ]
    },
    {
      id: 'cluster-evals-safety',
      title: 'Evals & Safety',
      categoryTag: 'Reliability',
      progress: 0,
      color: '#64748B',
      theme: 'slate',
      icon: 'lock',
      subSkills: [
        {
          id: 'sub-agent-evals',
          title: 'Agent Benchmarking',
          progress: 0,
          status: 'in-progress',
          glyph: 'check',
          category: 'Reliability',
          primaryAction: { type: 'tutor', title: 'Agent Evaluation Frameworks', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Agent Evaluation Frameworks Trajectory Benchmarking LangSmith' },
          whatToDo: [
            { id: 'task-tutor-evals', type: 'tutor', title: 'Practice with AI Tutor: Evals', desc: 'Evaluate multi-step agent trajectories with Langfuse, Ragas, and LLM-as-a-judge.', url: '/ai-tutor?topic=Agent Evaluation Frameworks Trajectory Benchmarking LangSmith', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-guardrails',
          title: 'Guardrails & Defense',
          progress: 0,
          status: 'in-progress',
          glyph: 'lock',
          category: 'Reliability',
          primaryAction: { type: 'challenge', title: 'API Rate Limiting Shield', label: 'Solve Challenge', url: '/challenges/ch-10' },
          whatToDo: [
            { id: 'task-ch-10-guard', type: 'challenge', title: 'Solve Challenge: Production Defense Shield', desc: 'Prevent prompt injection, infinite execution loops, and financial drain.', url: '/challenges/ch-10', badge: '100 XP • Production', actionLabel: 'Solve Challenge →' }
          ]
        },
        {
          id: 'sub-cost-latency',
          title: 'Cost & Latency Optimization',
          progress: 0,
          status: 'in-progress',
          glyph: 'zap',
          category: 'Reliability',
          primaryAction: { type: 'challenge', title: 'Semantic Prompt Compressor', label: 'Solve Challenge', url: '/challenges/ch-12' },
          whatToDo: [
            { id: 'task-ch-12-cost', type: 'challenge', title: 'Solve Challenge: Token Compression', desc: 'Minimize API costs and cut LLM latency in production agent systems.', url: '/challenges/ch-12', badge: '100 XP • Medium', actionLabel: 'Solve Challenge →' }
          ]
        }
      ]
    }
  ],
  skillProgress: [
    { name: 'Autonomous Agents', progress: 0, color: '#10B981', icon: 'sparkles' },
    { name: 'Tool Calling & APIs', progress: 0, color: '#10B981', icon: 'code' },
    { name: 'LangGraph', progress: 0, color: '#0EA5E9', icon: 'zap' },
    { name: 'MCP Protocols', progress: 0, color: '#D96B43', icon: 'sparkles' },
    { name: 'Agent Evals', progress: 0, color: '#64748B', icon: 'check' }
  ],
  recommendedSkills: [
    {
      rank: 1,
      name: 'Tool Calling & APIs',
      reason: 'Essential foundation for autonomous agents',
      actionType: 'challenge',
      actionUrl: '/challenges/ch-10',
      actionLabel: 'Solve Challenge',
      taskTitle: 'API Rate Limiting Shield',
      category: 'Architecture',
      xp: 100
    },
    {
      rank: 2,
      name: 'System Prompts',
      reason: 'Context window & instruction optimization',
      actionType: 'challenge',
      actionUrl: '/challenges/ch-12',
      actionLabel: 'Solve Challenge',
      taskTitle: 'Semantic Prompt Compressor',
      category: 'Architecture',
      xp: 100
    },
    {
      rank: 3,
      name: 'LangGraph & Workflows',
      reason: 'Cyclic state machines and multi-agent coordination',
      actionType: 'tutor',
      actionUrl: '/ai-tutor?topic=LangGraph StateGraphs Cycles Human in the Loop',
      actionLabel: 'Practice with AI Tutor',
      taskTitle: 'LangGraph State Graphs',
      category: 'Frameworks',
      xp: 80
    },
    {
      rank: 4,
      name: 'Model Context Protocol',
      reason: 'Connect agents securely to tools and data sources',
      actionType: 'tutor',
      actionUrl: '/ai-tutor?topic=Model Context Protocol MCP Servers Clients Tools Resources',
      actionLabel: 'Practice with AI Tutor',
      taskTitle: 'MCP Server Standards',
      category: 'Integrations',
      xp: 90
    }
  ],
  quote: {
    text: 'The future belongs to agents that act, adapt, and build alongside humans.',
    author: 'REXION AI'
  }
}

const DEFAULT_DATA_ANALYST_GRAPH = {
  roleId: 'data-analyst',
  roleName: 'Data Scientist & Analyst',
  targetLabel: 'Data Scientist & Analyst',
  overallProgress: 0,
  stats: {
    skillsLearned: '0 / 15',
    projectsCompleted: '0 / 5',
    timeSpent: '0h 0m'
  },
  centerNode: {
    id: 'center-goal',
    title: 'Data Scientist & Analyst',
    subtitle: '0% complete',
    progress: 0,
    icon: 'table',
    status: 'in-progress'
  },
  clusters: [
    {
      id: 'cluster-stats',
      title: 'Statistics',
      categoryTag: 'Math & Stats',
      progress: 0,
      color: '#10B981',
      theme: 'green',
      icon: 'network',
      subSkills: [
        {
          id: 'sub-prob',
          title: 'Probability',
          progress: 0,
          status: 'in-progress',
          glyph: 'code',
          category: 'Math & Stats',
          primaryAction: { type: 'tutor', title: 'Probability Distributions', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Probability Distributions Bayes Theorem and Normal Distributions' },
          whatToDo: [
            { id: 'task-tutor-prob', type: 'tutor', title: 'Practice with AI Tutor: Probability', desc: 'Master conditional probability, binomial & Poisson distributions, and Bayes Theorem.', url: '/ai-tutor?topic=Probability Distributions Bayes Theorem and Normal Distributions', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' },
            { id: 'task-quiz-stats', type: 'quiz', title: 'Statistics & Probability Assessment', desc: 'Test your understanding of variance, standard deviation, and p-values.', url: '/quizzes?topic=data-analysis', badge: 'Skill Quiz', actionLabel: 'Take Quiz →' }
          ]
        },
        {
          id: 'sub-hypo',
          title: 'Hypothesis Testing',
          progress: 0,
          status: 'in-progress',
          glyph: 'check',
          category: 'Math & Stats',
          primaryAction: { type: 'tutor', title: 'A/B Testing & Hypothesis Testing', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Hypothesis Testing AB Testing T-tests and ANOVA' },
          whatToDo: [
            { id: 'task-tutor-hypo', type: 'tutor', title: 'Practice with AI Tutor: A/B Testing', desc: 'Learn Z-tests, Student T-tests, Type I/II errors, and sample sizing.', url: '/ai-tutor?topic=Hypothesis Testing AB Testing T-tests and ANOVA', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-lin-alg',
          title: 'Linear Algebra',
          progress: 0,
          status: 'in-progress',
          glyph: 'cube',
          category: 'Math & Stats',
          primaryAction: { type: 'tutor', title: 'Matrices & Eigenvalues', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Linear Algebra Matrix Multiplication Eigenvalues PCA' },
          whatToDo: [
            { id: 'task-tutor-linalg', type: 'tutor', title: 'Practice with AI Tutor: Linear Algebra', desc: 'Understand matrix transformations, rank, dot products, and PCA.', url: '/ai-tutor?topic=Linear Algebra Matrix Multiplication Eigenvalues PCA', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        }
      ]
    },
    {
      id: 'cluster-wrangling',
      title: 'Data Analysis',
      categoryTag: 'Wrangling & SQL',
      progress: 0,
      color: '#0284C7',
      theme: 'blue',
      icon: 'table',
      subSkills: [
        {
          id: 'sub-pandas',
          title: 'Pandas',
          progress: 0,
          status: 'in-progress',
          glyph: 'table',
          category: 'Data Wrangling',
          primaryAction: { type: 'challenge', title: 'Sales Analytics Aggregation', label: 'Solve Challenge', url: '/challenges/ch-7' },
          whatToDo: [
            { id: 'task-ch-7-ds', type: 'challenge', title: 'Solve Challenge: Sales Analytics Aggregation', desc: 'Compute monthly growth, cohort retention, and top customer groups with Pandas.', url: '/challenges/ch-7', badge: '100 XP • Production', actionLabel: 'Solve Challenge →' },
            { id: 'task-quiz-pandas', type: 'quiz', title: 'Pandas & Data Wrangling Quiz', desc: 'Benchmark your indexing, groupby, merge, and pivot_table skills.', url: '/quizzes?topic=data-analysis', badge: 'Skill Quiz', actionLabel: 'Take Quiz →' }
          ]
        },
        {
          id: 'sub-sql-ds',
          title: 'SQL & Queries',
          progress: 0,
          status: 'in-progress',
          glyph: 'check',
          category: 'Data Wrangling',
          primaryAction: { type: 'challenge', title: 'SQL Query Aggregator', label: 'Solve Challenge', url: '/challenges/ch-4' },
          whatToDo: [
            { id: 'task-ch-4-ds', type: 'challenge', title: 'Solve Challenge: SQL Query Aggregator', desc: 'Write high-performance window functions, subqueries, and grouping sets.', url: '/challenges/ch-4', badge: '80 XP • Medium', actionLabel: 'Solve Challenge →' },
            { id: 'task-arena-sql', type: 'arena', title: 'Practice SQL in Code Arena', desc: 'Solve database query challenges and query optimization katas.', url: '/code-arena', badge: 'Code Arena', actionLabel: 'Enter Arena →' }
          ]
        },
        {
          id: 'sub-numpy-ds',
          title: 'NumPy',
          progress: 0,
          status: 'in-progress',
          glyph: 'cube',
          category: 'Data Wrangling',
          primaryAction: { type: 'tutor', title: 'NumPy Vectorized Arrays', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=NumPy Array Broadcasting and Vectorized Operations' },
          whatToDo: [
            { id: 'task-tutor-numpy-ds', type: 'tutor', title: 'Practice with AI Tutor: NumPy', desc: 'Master broadcasting, strides, views, and numerical performance.', url: '/ai-tutor?topic=NumPy Array Broadcasting and Vectorized Operations', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        }
      ]
    },
    {
      id: 'cluster-ml-ds',
      title: 'Machine Learning',
      categoryTag: 'Modeling',
      progress: 0,
      color: '#F59E0B',
      theme: 'amber',
      icon: 'brain',
      subSkills: [
        {
          id: 'sub-sklearn',
          title: 'Scikit-Learn',
          progress: 0,
          status: 'in-progress',
          glyph: 'code',
          category: 'Machine Learning',
          primaryAction: { type: 'tutor', title: 'Regression & Classification Models', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Scikit-Learn Regression Classification and Pipelines' },
          whatToDo: [
            { id: 'task-tutor-sklearn', type: 'tutor', title: 'Practice with AI Tutor: Scikit-Learn', desc: 'Implement Random Forests, Logistic Regression, cross-validation, and pipelines.', url: '/ai-tutor?topic=Scikit-Learn Regression Classification and Pipelines', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' },
            { id: 'task-quiz-ml-ds', type: 'quiz', title: 'Machine Learning Concepts Quiz', desc: 'Test your understanding of bias-variance tradeoff, ROC-AUC, and precision-recall.', url: '/quizzes?topic=machine-learning', badge: 'Skill Quiz', actionLabel: 'Take Quiz →' }
          ]
        },
        {
          id: 'sub-feature-eng',
          title: 'Feature Eng',
          progress: 0,
          status: 'in-progress',
          glyph: 'sparkles',
          category: 'Machine Learning',
          primaryAction: { type: 'tutor', title: 'Feature Engineering & Scaling', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Feature Engineering One-Hot Encoding and Outlier Handling' },
          whatToDo: [
            { id: 'task-tutor-fe', type: 'tutor', title: 'Practice with AI Tutor: Feature Engineering', desc: 'Master target encoding, scaling, imputing missing values, and outlier handling.', url: '/ai-tutor?topic=Feature Engineering One-Hot Encoding and Outlier Handling', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-deep-learning-ds',
          title: 'Deep Learning',
          progress: 0,
          status: 'locked',
          glyph: 'lock',
          category: 'Machine Learning',
          primaryAction: { type: 'tutor', title: 'Neural Networks & PyTorch', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=PyTorch Neural Networks and Backpropagation' },
          whatToDo: [
            { id: 'task-tutor-dl-ds', type: 'tutor', title: 'Practice with AI Tutor: Neural Networks', desc: 'Explore forward/backward propagation, activation functions, and training loops.', url: '/ai-tutor?topic=PyTorch Neural Networks and Backpropagation', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        }
      ]
    },
    {
      id: 'cluster-viz',
      title: 'Visualization',
      categoryTag: 'BI & Storytelling',
      progress: 0,
      color: '#EC4899',
      theme: 'pink',
      icon: 'sparkles',
      subSkills: [
        {
          id: 'sub-powerbi',
          title: 'Power BI',
          progress: 0,
          status: 'in-progress',
          glyph: 'table',
          category: 'Visualization',
          primaryAction: { type: 'tutor', title: 'DAX & Dashboard Design', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Power BI DAX Measures Data Modeling and Dashboards' },
          whatToDo: [
            { id: 'task-tutor-pbi', type: 'tutor', title: 'Practice with AI Tutor: Power BI & DAX', desc: 'Build automated interactive dashboards, star schemas, and calculate DAX measures.', url: '/ai-tutor?topic=Power BI DAX Measures Data Modeling and Dashboards', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-tableau',
          title: 'Tableau',
          progress: 0,
          status: 'in-progress',
          glyph: 'sparkles',
          category: 'Visualization',
          primaryAction: { type: 'tutor', title: 'Tableau Visual Analytics', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Tableau Visual Analytics LOD Expressions and Storyboards' },
          whatToDo: [
            { id: 'task-tutor-tab', type: 'tutor', title: 'Practice with AI Tutor: Tableau', desc: 'Design executive storyboards, Level of Detail (LOD) calculations, and visual charts.', url: '/ai-tutor?topic=Tableau Visual Analytics LOD Expressions and Storyboards', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-matplotlib',
          title: 'Matplotlib',
          progress: 0,
          status: 'in-progress',
          glyph: 'code',
          category: 'Visualization',
          primaryAction: { type: 'tutor', title: 'Seaborn & Matplotlib Customization', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Matplotlib and Seaborn Statistical Plots' },
          whatToDo: [
            { id: 'task-tutor-sns', type: 'tutor', title: 'Practice with AI Tutor: Statistical Plots', desc: 'Create publication-ready heatmaps, distribution plots, and subplots.', url: '/ai-tutor?topic=Matplotlib and Seaborn Statistical Plots', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        }
      ]
    },
    {
      id: 'cluster-bigdata',
      title: 'Big Data',
      categoryTag: 'Pipelines & Cloud',
      progress: 0,
      color: '#8B5CF6',
      theme: 'purple',
      icon: 'cloud',
      subSkills: [
        {
          id: 'sub-etl',
          title: 'ETL Pipelines',
          progress: 0,
          status: 'in-progress',
          glyph: 'layers',
          category: 'Data Engineering',
          primaryAction: { type: 'tutor', title: 'Airflow & Automated Pipelines', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Apache Airflow DAGs and ETL Pipelines' },
          whatToDo: [
            { id: 'task-tutor-etl', type: 'tutor', title: 'Practice with AI Tutor: ETL Pipelines', desc: 'Design fault-tolerant DAGs, schedule ingestion jobs, and handle data validation.', url: '/ai-tutor?topic=Apache Airflow DAGs and ETL Pipelines', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-spark',
          title: 'Apache Spark',
          progress: 0,
          status: 'in-progress',
          glyph: 'zap',
          category: 'Data Engineering',
          primaryAction: { type: 'tutor', title: 'PySpark & Distributed Compute', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=PySpark Distributed DataFrames and Spark SQL' },
          whatToDo: [
            { id: 'task-tutor-spark', type: 'tutor', title: 'Practice with AI Tutor: PySpark', desc: 'Process terabyte-scale datasets with distributed partitions and Spark SQL.', url: '/ai-tutor?topic=PySpark Distributed DataFrames and Spark SQL', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-warehouse',
          title: 'Data Warehouses',
          progress: 0,
          status: 'locked',
          glyph: 'lock',
          category: 'Data Engineering',
          primaryAction: { type: 'tutor', title: 'Snowflake & BigQuery Optimization', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Snowflake BigQuery Partitioning and Columnar Storage' },
          whatToDo: [
            { id: 'task-tutor-wh', type: 'tutor', title: 'Practice with AI Tutor: Data Warehousing', desc: 'Master columnar storage, micro-partitioning, and analytical clustering keys.', url: '/ai-tutor?topic=Snowflake BigQuery Partitioning and Columnar Storage', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        }
      ]
    }
  ],
  skillProgress: [
    { name: 'Statistics', progress: 0, color: '#10B981', icon: 'network' },
    { name: 'Data Analysis', progress: 0, color: '#0284C7', icon: 'table' },
    { name: 'Machine Learning', progress: 0, color: '#F59E0B', icon: 'brain' },
    { name: 'Visualization', progress: 0, color: '#EC4899', icon: 'sparkles' },
    { name: 'Big Data', progress: 0, color: '#8B5CF6', icon: 'cloud' }
  ],
  recommendedSkills: [
    {
      rank: 1,
      name: 'Pandas',
      reason: 'Core foundation for data wrangling',
      actionType: 'challenge',
      actionUrl: '/challenges/ch-7',
      actionLabel: 'Solve Challenge',
      taskTitle: 'Sales Analytics Aggregation',
      category: 'Analysis',
      xp: 100
    },
    {
      rank: 2,
      name: 'SQL',
      reason: 'Most demanded skill for data roles',
      actionType: 'challenge',
      actionUrl: '/challenges/ch-4',
      actionLabel: 'Solve Challenge',
      taskTitle: 'SQL Query Aggregator',
      category: 'Database',
      xp: 80
    },
    {
      rank: 3,
      name: 'Scikit-Learn',
      reason: 'Essential for machine learning models',
      actionType: 'quiz',
      actionUrl: '/quizzes?topic=machine-learning',
      actionLabel: 'Take Quiz',
      taskTitle: 'Machine Learning Concepts Quiz',
      category: 'Modeling',
      xp: 75
    },
    {
      rank: 4,
      name: 'Power BI',
      reason: 'Required for executive reporting',
      actionType: 'tutor',
      actionUrl: '/ai-tutor?topic=Power BI DAX Measures Data Modeling and Dashboards',
      actionLabel: 'Learn with AI',
      taskTitle: 'Power BI & DAX Mastery',
      category: 'Visualization',
      xp: 60
    }
  ],
  quote: {
    text: 'Without data, you are just another person with an opinion.',
    author: 'W. Edwards Deming'
  }
}

const DEFAULT_FULLSTACK_GRAPH = {
  roleId: 'fullstack-developer',
  roleName: 'Full Stack Engineer',
  targetLabel: 'Full Stack Engineer',
  overallProgress: 0,
  stats: {
    skillsLearned: '0 / 15',
    projectsCompleted: '0 / 5',
    timeSpent: '0h 0m'
  },
  centerNode: {
    id: 'center-goal',
    title: 'Full Stack Engineer',
    subtitle: '0% complete',
    progress: 0,
    icon: 'layers',
    status: 'in-progress'
  },
  clusters: [
    {
      id: 'cluster-fe',
      title: 'React',
      categoryTag: 'Frontend UI',
      progress: 0,
      color: '#0284C7',
      theme: 'blue',
      icon: 'code',
      subSkills: [
        {
          id: 'sub-hooks',
          title: 'React Hooks',
          progress: 0,
          status: 'in-progress',
          glyph: 'code',
          category: 'Frontend UI',
          primaryAction: { type: 'challenge', title: 'Debounce Function', label: 'Solve Challenge', url: '/challenges/ch-2' },
          whatToDo: [
            { id: 'task-ch-2-fs', type: 'challenge', title: 'Debounce Function', desc: 'Implement high-frequency event debounce wrapper.', url: '/challenges/ch-2', badge: '75 XP • Medium', actionLabel: 'Solve Challenge →' },
            { id: 'task-quiz-react', type: 'quiz', title: 'React Hooks Quiz', desc: 'Assess knowledge of useEffect, useMemo, and custom hooks.', url: '/quizzes?topic=react-components-hooks', badge: 'Skill Quiz', actionLabel: 'Take Quiz →' }
          ]
        },
        {
          id: 'sub-state',
          title: 'State Mgmt',
          progress: 0,
          status: 'in-progress',
          glyph: 'check',
          category: 'Frontend UI',
          primaryAction: { type: 'challenge', title: 'Deep Object Clone', label: 'Solve Challenge', url: '/challenges/ch-11' },
          whatToDo: [
            { id: 'task-ch-11-fs', type: 'challenge', title: 'Deep Object Clone', desc: 'Implement deep cloning utility handling circular references.', url: '/challenges/ch-11', badge: '75 XP • Medium', actionLabel: 'Solve Challenge →' }
          ]
        },
        {
          id: 'sub-nextjs',
          title: 'Next.js',
          progress: 0,
          status: 'in-progress',
          glyph: 'zap',
          category: 'Frontend UI',
          primaryAction: { type: 'tutor', title: 'Next.js App Router', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Next.js App Router Server Components and SSR' },
          whatToDo: [
            { id: 'task-tutor-nextjs', type: 'tutor', title: 'Next.js App Router', desc: 'Server Components, SSR, and API route handlers.', url: '/ai-tutor?topic=Next.js App Router Server Components and SSR', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        }
      ]
    },
    {
      id: 'cluster-be',
      title: 'Node.js',
      categoryTag: 'Backend Server',
      progress: 0,
      color: '#10B981',
      theme: 'green',
      icon: 'server',
      subSkills: [
        {
          id: 'sub-express',
          title: 'Express.js',
          progress: 0,
          status: 'in-progress',
          glyph: 'server',
          category: 'Backend Server',
          primaryAction: { type: 'challenge', title: 'Microservice Event Bus', label: 'Solve Challenge', url: '/challenges/ch-6' },
          whatToDo: [
            { id: 'task-ch-6-fs', type: 'challenge', title: 'Microservice Event Bus', desc: 'Build an event bus with retry logic and error queues.', url: '/challenges/ch-6', badge: '125 XP • Hard', actionLabel: 'Solve Challenge →' }
          ]
        },
        {
          id: 'sub-rest',
          title: 'REST APIs',
          progress: 0,
          status: 'in-progress',
          glyph: 'network',
          category: 'Backend Server',
          primaryAction: { type: 'challenge', title: 'API Rate Limiting Shield', label: 'Solve Challenge', url: '/challenges/ch-10' },
          whatToDo: [
            { id: 'task-ch-10-rest', type: 'challenge', title: 'API Rate Limiting Shield', desc: 'Master rate limiting, token buckets, and API security.', url: '/challenges/ch-10', badge: '100 XP • Production', actionLabel: 'Solve Challenge →' }
          ]
        },
        {
          id: 'sub-auth',
          title: 'Auth & JWT',
          progress: 0,
          status: 'in-progress',
          glyph: 'lock',
          category: 'Backend Server',
          primaryAction: { type: 'tutor', title: 'JWT Authentication', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=JWT Authentication Refresh Tokens and Cookie Security' },
          whatToDo: [
            { id: 'task-tutor-jwt', type: 'tutor', title: 'JWT Authentication & Cookies', desc: 'Implement HttpOnly cookies, token rotation, and RBAC.', url: '/ai-tutor?topic=JWT Authentication Refresh Tokens and Cookie Security', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        }
      ]
    },
    {
      id: 'cluster-db',
      title: 'Databases',
      categoryTag: 'Data Storage',
      progress: 0,
      color: '#F59E0B',
      theme: 'amber',
      icon: 'table',
      subSkills: [
        {
          id: 'sub-postgres',
          title: 'PostgreSQL',
          progress: 0,
          status: 'in-progress',
          glyph: 'table',
          category: 'Databases',
          primaryAction: { type: 'challenge', title: 'SQL Query Aggregator', label: 'Solve Challenge', url: '/challenges/ch-4' },
          whatToDo: [
            { id: 'task-ch-4-fs', type: 'challenge', title: 'SQL Query Aggregator', desc: 'Window functions, joins, indexes, and migrations.', url: '/challenges/ch-4', badge: '80 XP • Medium', actionLabel: 'Solve Challenge →' }
          ]
        },
        {
          id: 'sub-mongo',
          title: 'MongoDB',
          progress: 0,
          status: 'in-progress',
          glyph: 'check',
          category: 'Databases',
          primaryAction: { type: 'tutor', title: 'MongoDB Aggregations', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=MongoDB Aggregation Pipeline and Indexing' },
          whatToDo: [
            { id: 'task-tutor-mongo', type: 'tutor', title: 'MongoDB Pipelines', desc: 'Design document schemas and high-throughput aggregation stages.', url: '/ai-tutor?topic=MongoDB Aggregation Pipeline and Indexing', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-redis',
          title: 'Redis Cache',
          progress: 0,
          status: 'in-progress',
          glyph: 'zap',
          category: 'Databases',
          primaryAction: { type: 'challenge', title: 'LRU Cache Implementation', label: 'Solve Challenge', url: '/challenges/ch-3' },
          whatToDo: [
            { id: 'task-ch-3-redis', type: 'challenge', title: 'LRU Cache Implementation', desc: 'In-memory key-value eviction and cache strategies.', url: '/challenges/ch-3', badge: '100 XP • Hard', actionLabel: 'Solve Challenge →' }
          ]
        }
      ]
    },
    {
      id: 'cluster-devops-fs',
      title: 'DevOps',
      categoryTag: 'Cloud Deploy',
      progress: 0,
      color: '#64748B',
      theme: 'slate',
      icon: 'cloud',
      subSkills: [
        {
          id: 'sub-docker-fs',
          title: 'Docker',
          progress: 0,
          status: 'in-progress',
          glyph: 'docker',
          category: 'DevOps',
          primaryAction: { type: 'challenge', title: 'Dockerfile Optimization', label: 'Solve Challenge', url: '/challenges/ch-8' },
          whatToDo: [
            { id: 'task-ch-8-fs', type: 'challenge', title: 'Dockerfile Optimization', desc: 'Multi-stage builds and container size reduction.', url: '/challenges/ch-8', badge: '75 XP • Medium', actionLabel: 'Solve Challenge →' }
          ]
        },
        {
          id: 'sub-cicd-fs',
          title: 'GitHub Actions',
          progress: 0,
          status: 'in-progress',
          glyph: 'zap',
          category: 'DevOps',
          primaryAction: { type: 'tutor', title: 'GitHub Actions CI/CD', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=GitHub Actions CI CD Automated Testing and Deployment' },
          whatToDo: [
            { id: 'task-tutor-actions', type: 'tutor', title: 'Automated CI/CD Workflows', desc: 'Build automated test runners and deployment pipelines.', url: '/ai-tutor?topic=GitHub Actions CI CD Automated Testing and Deployment', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-cloud-fs',
          title: 'Cloud Deploy',
          progress: 0,
          status: 'locked',
          glyph: 'lock',
          category: 'DevOps',
          primaryAction: { type: 'tutor', title: 'Cloud Deploy & Monitoring', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Cloud Deployment on Render AWS and Vercel' },
          whatToDo: [
            { id: 'task-tutor-cloud-fs', type: 'tutor', title: 'Cloud Deployments', desc: 'Production DNS, environment secrets, and zero-downtime rollouts.', url: '/ai-tutor?topic=Cloud Deployment on Render AWS and Vercel', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        }
      ]
    },
    {
      id: 'cluster-ts',
      title: 'TypeScript',
      categoryTag: 'Core Language',
      progress: 0,
      color: '#3B82F6',
      theme: 'blue',
      icon: 'code',
      subSkills: [
        {
          id: 'sub-ts-generics',
          title: 'Generics',
          progress: 0,
          status: 'in-progress',
          glyph: 'code',
          category: 'TypeScript',
          primaryAction: { type: 'tutor', title: 'TypeScript Generics & Types', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=TypeScript Generics Conditional Types and Utility Types' },
          whatToDo: [
            { id: 'task-tutor-ts-gen', type: 'tutor', title: 'TypeScript Generics', desc: 'Generic constraints, keyof, Record, and conditional inference.', url: '/ai-tutor?topic=TypeScript Generics Conditional Types and Utility Types', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-ts-strict',
          title: 'Strict Typing',
          progress: 0,
          status: 'in-progress',
          glyph: 'check',
          category: 'TypeScript',
          primaryAction: { type: 'tutor', title: 'Type Guards & Discriminated Unions', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=TypeScript Type Narrowing Discriminated Unions and Type Guards' },
          whatToDo: [
            { id: 'task-tutor-narrow', type: 'tutor', title: 'Type Narrowing', desc: 'Exhaustive pattern checks and discriminated unions.', url: '/ai-tutor?topic=TypeScript Type Narrowing Discriminated Unions and Type Guards', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-unit-tests',
          title: 'Unit Testing',
          progress: 0,
          status: 'in-progress',
          glyph: 'lock',
          category: 'Quality',
          primaryAction: { type: 'tutor', title: 'Vitest & Jest Unit Testing', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Vitest Jest Unit Testing and Mocking' },
          whatToDo: [
            { id: 'task-tutor-unit', type: 'tutor', title: 'Vitest Unit Testing', desc: 'Write assertions, spies, mocks, and test coverage.', url: '/ai-tutor?topic=Vitest Jest Unit Testing and Mocking', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        }
      ]
    }
  ],
  skillProgress: [
    { name: 'React', progress: 0, color: '#0284C7', icon: 'code' },
    { name: 'Node.js', progress: 0, color: '#10B981', icon: 'server' },
    { name: 'Databases', progress: 0, color: '#F59E0B', icon: 'table' },
    { name: 'DevOps', progress: 0, color: '#64748B', icon: 'cloud' },
    { name: 'TypeScript', progress: 0, color: '#3B82F6', icon: 'code' }
  ],
  recommendedSkills: [
    {
      rank: 1,
      name: 'Next.js App Router',
      reason: 'Standard for modern full-stack web applications',
      actionType: 'tutor',
      actionUrl: '/ai-tutor?topic=Next.js App Router Server Components and SSR',
      actionLabel: 'Learn with AI',
      taskTitle: 'Next.js App Router Mastery',
      category: 'Frontend',
      xp: 80
    },
    {
      rank: 2,
      name: 'SQL Aggregations',
      reason: 'Essential relational database skills',
      actionType: 'challenge',
      actionUrl: '/challenges/ch-4',
      actionLabel: 'Solve Challenge',
      taskTitle: 'SQL Query Aggregator',
      category: 'Database',
      xp: 80
    },
    {
      rank: 3,
      name: 'API Rate Limiting',
      reason: 'Critical defense for production APIs',
      actionType: 'challenge',
      actionUrl: '/challenges/ch-10',
      actionLabel: 'Solve Challenge',
      taskTitle: 'API Rate Limiting Shield',
      category: 'Backend',
      xp: 100
    }
  ],
  quote: {
    text: 'Code is like humor. When you have to explain it, it’s bad.',
    author: 'Cory House'
  }
}

const DEFAULT_FRONTEND_GRAPH = {
  roleId: 'frontend-developer',
  roleName: 'Frontend Web Engineer',
  targetLabel: 'Frontend Web Engineer',
  overallProgress: 0,
  stats: {
    skillsLearned: '0 / 15',
    projectsCompleted: '0 / 5',
    timeSpent: '0h 0m'
  },
  centerNode: {
    id: 'center-goal',
    title: 'Frontend Web Engineer',
    subtitle: '0% complete',
    progress: 0,
    icon: 'code',
    status: 'in-progress'
  },
  clusters: [
    {
      id: 'cluster-fe-core',
      title: 'JavaScript',
      categoryTag: 'Core Language',
      progress: 0,
      color: '#F59E0B',
      theme: 'amber',
      icon: 'code',
      subSkills: [
        {
          id: 'sub-fe-es6',
          title: 'ES6+ & Async',
          progress: 0,
          status: 'in-progress',
          glyph: 'zap',
          category: 'Core Language',
          primaryAction: { type: 'challenge', title: 'Debounce Function', label: 'Solve Challenge', url: '/challenges/ch-2' },
          whatToDo: [
            { id: 'task-ch-2-fe', type: 'challenge', title: 'Debounce Function', desc: 'Implement event debouncing and rate-limiting wrapper.', url: '/challenges/ch-2', badge: '75 XP • Medium', actionLabel: 'Solve Challenge →' },
            { id: 'task-quiz-js', type: 'quiz', title: 'Modern JavaScript Quiz', desc: 'Test closures, promises, event loop microtasks, and prototypes.', url: '/quizzes?topic=javascript-basics', badge: 'Skill Quiz', actionLabel: 'Take Quiz →' }
          ]
        },
        {
          id: 'sub-fe-ts',
          title: 'TypeScript',
          progress: 0,
          status: 'in-progress',
          glyph: 'check',
          category: 'Core Language',
          primaryAction: { type: 'tutor', title: 'TypeScript Generics & Types', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=TypeScript Generics Conditional Types and Utility Types' },
          whatToDo: [
            { id: 'task-tutor-ts-fe', type: 'tutor', title: 'TypeScript Generics', desc: 'Master generic constraints, discriminated unions, and strict typing.', url: '/ai-tutor?topic=TypeScript Generics Conditional Types and Utility Types', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-fe-dom',
          title: 'DOM & Events',
          progress: 0,
          status: 'in-progress',
          glyph: 'code',
          category: 'Core Language',
          primaryAction: { type: 'tutor', title: 'DOM Performance & Events', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=DOM Manipulation Event Delegation and Virtual DOM' },
          whatToDo: [
            { id: 'task-tutor-dom', type: 'tutor', title: 'DOM Manipulation', desc: 'Event bubbling, delegation, passive listeners, and virtual DOM.', url: '/ai-tutor?topic=DOM Manipulation Event Delegation and Virtual DOM', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        }
      ]
    },
    {
      id: 'cluster-fe-react',
      title: 'React Ecosystem',
      categoryTag: 'UI Framework',
      progress: 0,
      color: '#0284C7',
      theme: 'blue',
      icon: 'code',
      subSkills: [
        {
          id: 'sub-fe-comps',
          title: 'React Components',
          progress: 0,
          status: 'in-progress',
          glyph: 'code',
          category: 'UI Framework',
          primaryAction: { type: 'quiz', title: 'React Assessment', label: 'Take Quiz', url: '/quizzes?topic=react-components-hooks' },
          whatToDo: [
            { id: 'task-quiz-react-fe', type: 'quiz', title: 'React Components Quiz', desc: 'Test re-render cycles, memoization, and props validation.', url: '/quizzes?topic=react-components-hooks', badge: 'Skill Quiz', actionLabel: 'Take Quiz →' }
          ]
        },
        {
          id: 'sub-fe-state',
          title: 'State & Custom Hooks',
          progress: 0,
          status: 'in-progress',
          glyph: 'check',
          category: 'UI Framework',
          primaryAction: { type: 'challenge', title: 'Deep Object Clone', label: 'Solve Challenge', url: '/challenges/ch-11' },
          whatToDo: [
            { id: 'task-ch-11-fe', type: 'challenge', title: 'Deep Object Clone', desc: 'Implement deep cloning for immutable state management.', url: '/challenges/ch-11', badge: '75 XP • Medium', actionLabel: 'Solve Challenge →' }
          ]
        },
        {
          id: 'sub-fe-next',
          title: 'Next.js App Router',
          progress: 0,
          status: 'in-progress',
          glyph: 'zap',
          category: 'UI Framework',
          primaryAction: { type: 'tutor', title: 'Next.js App Router & SSR', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Next.js App Router Server Components and SSR' },
          whatToDo: [
            { id: 'task-tutor-next-fe', type: 'tutor', title: 'Next.js App Router', desc: 'Streaming SSR, Server Components, and route loaders.', url: '/ai-tutor?topic=Next.js App Router Server Components and SSR', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        }
      ]
    },
    {
      id: 'cluster-fe-css',
      title: 'Styling & UI',
      categoryTag: 'Design Systems',
      progress: 0,
      color: '#10B981',
      theme: 'green',
      icon: 'sparkles',
      subSkills: [
        {
          id: 'sub-fe-tailwind',
          title: 'Tailwind CSS',
          progress: 0,
          status: 'in-progress',
          glyph: 'sparkles',
          category: 'Styling',
          primaryAction: { type: 'tutor', title: 'Tailwind CSS & Design Tokens', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Tailwind CSS Responsive Design and Design Tokens' },
          whatToDo: [
            { id: 'task-tutor-tailwind', type: 'tutor', title: 'Tailwind CSS Mastery', desc: 'Utility-first styling, responsive containers, and dark mode.', url: '/ai-tutor?topic=Tailwind CSS Responsive Design and Design Tokens', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-fe-anim',
          title: 'CSS Animations',
          progress: 0,
          status: 'in-progress',
          glyph: 'zap',
          category: 'Styling',
          primaryAction: { type: 'tutor', title: 'Framer Motion & CSS Animations', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Framer Motion Animations and Layout Transitions' },
          whatToDo: [
            { id: 'task-tutor-anim', type: 'tutor', title: 'Micro-Interactions & Transitions', desc: 'Layout springs, enter/exit animations, and 60fps GPU acceleration.', url: '/ai-tutor?topic=Framer Motion Animations and Layout Transitions', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-fe-resp',
          title: 'Responsive Design',
          progress: 0,
          status: 'in-progress',
          glyph: 'check',
          category: 'Styling',
          primaryAction: { type: 'tutor', title: 'Mobile-First Layouts', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=CSS Grid Flexbox and Mobile First Layouts' },
          whatToDo: [
            { id: 'task-tutor-resp', type: 'tutor', title: 'Mobile-First CSS Grid', desc: 'CSS Grid areas, auto-fit repeaters, and fluid typography.', url: '/ai-tutor?topic=CSS Grid Flexbox and Mobile First Layouts', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        }
      ]
    },
    {
      id: 'cluster-fe-perf',
      title: 'Performance',
      categoryTag: 'Optimization',
      progress: 0,
      color: '#EC4899',
      theme: 'pink',
      icon: 'zap',
      subSkills: [
        {
          id: 'sub-fe-vitals',
          title: 'Web Vitals',
          progress: 0,
          status: 'in-progress',
          glyph: 'zap',
          category: 'Performance',
          primaryAction: { type: 'tutor', title: 'Core Web Vitals LCP & CLS', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Core Web Vitals LCP FID CLS and Performance Optimization' },
          whatToDo: [
            { id: 'task-tutor-vitals', type: 'tutor', title: 'Core Web Vitals Optimization', desc: 'Improve Largest Contentful Paint, Cumulative Layout Shift, and INP.', url: '/ai-tutor?topic=Core Web Vitals LCP FID CLS and Performance Optimization', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-fe-split',
          title: 'Bundle Splitting',
          progress: 0,
          status: 'in-progress',
          glyph: 'layers',
          category: 'Performance',
          primaryAction: { type: 'tutor', title: 'Vite & Dynamic Code Splitting', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Code Splitting Lazy Loading and Dynamic Imports' },
          whatToDo: [
            { id: 'task-tutor-split', type: 'tutor', title: 'Code Splitting & Lazy Loading', desc: 'Tree-shaking, vendor chunks, and dynamic React.lazy imports.', url: '/ai-tutor?topic=Code Splitting Lazy Loading and Dynamic Imports', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-fe-a11y',
          title: 'Accessibility (a11y)',
          progress: 0,
          status: 'in-progress',
          glyph: 'check',
          category: 'Performance',
          primaryAction: { type: 'tutor', title: 'Web Accessibility & ARIA', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Web Accessibility WCAG ARIA Roles and Keyboard Navigation' },
          whatToDo: [
            { id: 'task-tutor-a11y', type: 'tutor', title: 'WCAG & ARIA Roles', desc: 'Keyboard trap prevention, screen-reader landmarks, and contrast ratios.', url: '/ai-tutor?topic=Web Accessibility WCAG ARIA Roles and Keyboard Navigation', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        }
      ]
    },
    {
      id: 'cluster-fe-test',
      title: 'Testing & CI',
      categoryTag: 'Quality',
      progress: 0,
      color: '#8B5CF6',
      theme: 'purple',
      icon: 'lock',
      subSkills: [
        {
          id: 'sub-fe-vitest',
          title: 'Vitest / Jest',
          progress: 0,
          status: 'in-progress',
          glyph: 'check',
          category: 'Testing',
          primaryAction: { type: 'tutor', title: 'Component Unit Testing', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=React Testing Library and Vitest Component Testing' },
          whatToDo: [
            { id: 'task-tutor-vitest', type: 'tutor', title: 'React Testing Library', desc: 'User event simulations, mocking APIs, and assertion patterns.', url: '/ai-tutor?topic=React Testing Library and Vitest Component Testing', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-fe-e2e',
          title: 'Playwright E2E',
          progress: 0,
          status: 'in-progress',
          glyph: 'lock',
          category: 'Testing',
          primaryAction: { type: 'tutor', title: 'Playwright End-to-End Testing', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Playwright End to End Automated Browser Testing' },
          whatToDo: [
            { id: 'task-tutor-e2e', type: 'tutor', title: 'E2E User Journeys', desc: 'Cross-browser automated regression suites and visual diffs.', url: '/ai-tutor?topic=Playwright End to End Automated Browser Testing', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-fe-cicd',
          title: 'CI/CD Workflows',
          progress: 0,
          status: 'locked',
          glyph: 'lock',
          category: 'Testing',
          primaryAction: { type: 'challenge', title: 'Dockerfile Optimization', label: 'Solve Challenge', url: '/challenges/ch-8' },
          whatToDo: [
            { id: 'task-ch-8-fe', type: 'challenge', title: 'Dockerfile Optimization', desc: 'Build lightweight production frontend static containers.', url: '/challenges/ch-8', badge: '75 XP • Medium', actionLabel: 'Solve Challenge →' }
          ]
        }
      ]
    }
  ],
  skillProgress: [
    { name: 'JavaScript', progress: 0, color: '#F59E0B', icon: 'code' },
    { name: 'React Ecosystem', progress: 0, color: '#0284C7', icon: 'code' },
    { name: 'Styling & UI', progress: 0, color: '#10B981', icon: 'sparkles' },
    { name: 'Performance', progress: 0, color: '#EC4899', icon: 'zap' },
    { name: 'Testing & CI', progress: 0, color: '#8B5CF6', icon: 'lock' }
  ],
  recommendedSkills: [
    {
      rank: 1,
      name: 'React Components',
      reason: 'Core requirement for modern web interfaces',
      actionType: 'quiz',
      actionUrl: '/quizzes?topic=react-components-hooks',
      actionLabel: 'Take Quiz',
      taskTitle: 'React Components & Hooks Assessment',
      category: 'Frameworks',
      xp: 80
    },
    {
      rank: 2,
      name: 'Debounce Function',
      reason: 'Essential event optimization algorithm',
      actionType: 'challenge',
      actionUrl: '/challenges/ch-2',
      actionLabel: 'Solve Challenge',
      taskTitle: 'Debounce Function Utility',
      category: 'Core JavaScript',
      xp: 75
    }
  ],
  quote: {
    text: 'Simplicity is the soul of efficiency.',
    author: 'Austin Freeman'
  }
}

const DEFAULT_DEVOPS_GRAPH = {
  roleId: 'cloud-devops',
  roleName: 'Cloud & DevOps Engineer',
  targetLabel: 'Cloud & DevOps Engineer',
  overallProgress: 0,
  stats: {
    skillsLearned: '0 / 15',
    projectsCompleted: '0 / 5',
    timeSpent: '0h 0m'
  },
  centerNode: {
    id: 'center-goal',
    title: 'Cloud & DevOps Engineer',
    subtitle: '0% complete',
    progress: 0,
    icon: 'cloud',
    status: 'in-progress'
  },
  clusters: [
    {
      id: 'cluster-containers',
      title: 'Containers',
      categoryTag: 'Virtualization',
      progress: 0,
      color: '#0284C7',
      theme: 'blue',
      icon: 'cloud',
      subSkills: [
        {
          id: 'sub-docker-dev',
          title: 'Docker',
          progress: 0,
          status: 'in-progress',
          glyph: 'docker',
          category: 'Virtualization',
          primaryAction: { type: 'challenge', title: 'Dockerfile Optimization', label: 'Solve Challenge', url: '/challenges/ch-8' },
          whatToDo: [
            { id: 'task-ch-8-dev', type: 'challenge', title: 'Dockerfile Optimization', desc: 'Reduce container image size from 1.2GB to under 150MB with multi-stage builds.', url: '/challenges/ch-8', badge: '75 XP • Medium', actionLabel: 'Solve Challenge →' },
            { id: 'task-quiz-docker', type: 'quiz', title: 'Docker & Containers Quiz', desc: 'Evaluate knowledge of layers, caching, and multi-stage builds.', url: '/quizzes?topic=git', badge: 'Skill Quiz', actionLabel: 'Take Quiz →' }
          ]
        },
        {
          id: 'sub-k8s',
          title: 'Kubernetes',
          progress: 0,
          status: 'in-progress',
          glyph: 'check',
          category: 'Virtualization',
          primaryAction: { type: 'tutor', title: 'Kubernetes Deployments & Services', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Kubernetes Deployments Pods Services Ingress and ConfigMaps' },
          whatToDo: [
            { id: 'task-tutor-k8s', type: 'tutor', title: 'Kubernetes Cluster Architecture', desc: 'Deploy Pods, ReplicaSets, ClusterIP Services, and Ingress controllers.', url: '/ai-tutor?topic=Kubernetes Deployments Pods Services Ingress and ConfigMaps', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-helm',
          title: 'Helm Charts',
          progress: 0,
          status: 'in-progress',
          glyph: 'layers',
          category: 'Virtualization',
          primaryAction: { type: 'tutor', title: 'Helm Package Management', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Helm Charts Kubernetes Package Management and Templates' },
          whatToDo: [
            { id: 'task-tutor-helm', type: 'tutor', title: 'Helm Chart Templating', desc: 'Parameterize Kubernetes manifests with values files and release rollbacks.', url: '/ai-tutor?topic=Helm Charts Kubernetes Package Management and Templates', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        }
      ]
    },
    {
      id: 'cluster-cloud',
      title: 'Cloud Platforms',
      categoryTag: 'Infrastructure',
      progress: 0,
      color: '#F59E0B',
      theme: 'amber',
      icon: 'cloud',
      subSkills: [
        {
          id: 'sub-aws-vpc',
          title: 'AWS Core & VPC',
          progress: 0,
          status: 'in-progress',
          glyph: 'cloud',
          category: 'Infrastructure',
          primaryAction: { type: 'tutor', title: 'AWS Networking & VPC', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=AWS VPC Subnets Internet Gateways and Route Tables' },
          whatToDo: [
            { id: 'task-tutor-vpc', type: 'tutor', title: 'AWS VPC Networking', desc: 'Public/private subnets, NAT gateways, security groups, and routing tables.', url: '/ai-tutor?topic=AWS VPC Subnets Internet Gateways and Route Tables', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' },
            { id: 'task-quiz-aws-dev', type: 'quiz', title: 'AWS Cloud Architecture Quiz', desc: 'Benchmark your cloud infrastructure knowledge.', url: '/quizzes?topic=cloud-aws', badge: 'Skill Quiz', actionLabel: 'Take Quiz →' }
          ]
        },
        {
          id: 'sub-aws-serverless',
          title: 'Serverless Lambda',
          progress: 0,
          status: 'in-progress',
          glyph: 'zap',
          category: 'Infrastructure',
          primaryAction: { type: 'tutor', title: 'AWS Serverless Architecture', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=AWS Serverless Architecture S3 Lambda and ECS' },
          whatToDo: [
            { id: 'task-tutor-lambda', type: 'tutor', title: 'AWS Serverless Lambda', desc: 'Event-driven compute with API Gateway, S3 triggers, and DynamoDB.', url: '/ai-tutor?topic=AWS Serverless Architecture S3 Lambda and ECS', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-cloud-iam',
          title: 'Cloud Security & IAM',
          progress: 0,
          status: 'in-progress',
          glyph: 'lock',
          category: 'Infrastructure',
          primaryAction: { type: 'tutor', title: 'IAM Least Privilege Policies', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=AWS IAM Roles Policies and Least Privilege Security' },
          whatToDo: [
            { id: 'task-tutor-iam', type: 'tutor', title: 'AWS IAM Roles & Policies', desc: 'Enforce principle of least privilege, assume-role STS tokens, and KMS encryption.', url: '/ai-tutor?topic=AWS IAM Roles Policies and Least Privilege Security', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        }
      ]
    },
    {
      id: 'cluster-cicd',
      title: 'CI / CD Pipelines',
      categoryTag: 'Automation',
      progress: 0,
      color: '#10B981',
      theme: 'green',
      icon: 'zap',
      subSkills: [
        {
          id: 'sub-gh-actions',
          title: 'GitHub Actions',
          progress: 0,
          status: 'in-progress',
          glyph: 'zap',
          category: 'Automation',
          primaryAction: { type: 'tutor', title: 'GitHub Actions Automation', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=GitHub Actions CI CD Automated Testing and Deployment' },
          whatToDo: [
            { id: 'task-tutor-actions-dev', type: 'tutor', title: 'GitHub Actions Pipelines', desc: 'Build automated test matrices, semantic releases, and container deployments.', url: '/ai-tutor?topic=GitHub Actions CI CD Automated Testing and Deployment', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-gitops',
          title: 'GitOps & ArgoCD',
          progress: 0,
          status: 'in-progress',
          glyph: 'check',
          category: 'Automation',
          primaryAction: { type: 'tutor', title: 'GitOps Declarative Deployment', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=GitOps ArgoCD Declarative Kubernetes Deployment' },
          whatToDo: [
            { id: 'task-tutor-argo', type: 'tutor', title: 'GitOps with ArgoCD', desc: 'Sync declarative Git repository state directly into live Kubernetes clusters.', url: '/ai-tutor?topic=GitOps ArgoCD Declarative Kubernetes Deployment', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-releases',
          title: 'Blue/Green Rollouts',
          progress: 0,
          status: 'in-progress',
          glyph: 'lock',
          category: 'Automation',
          primaryAction: { type: 'tutor', title: 'Canary & Blue-Green Deployments', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Canary Deployments Blue Green Deployments and Zero Downtime' },
          whatToDo: [
            { id: 'task-tutor-bluegreen', type: 'tutor', title: 'Zero Downtime Deployments', desc: 'Traffic shifting, automated health checks, and instantaneous rollback triggers.', url: '/ai-tutor?topic=Canary Deployments Blue Green Deployments and Zero Downtime', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        }
      ]
    },
    {
      id: 'cluster-iac',
      title: 'Infra as Code',
      categoryTag: 'Provisioning',
      progress: 0,
      color: '#8B5CF6',
      theme: 'purple',
      icon: 'server',
      subSkills: [
        {
          id: 'sub-terraform',
          title: 'Terraform',
          progress: 0,
          status: 'in-progress',
          glyph: 'code',
          category: 'Provisioning',
          primaryAction: { type: 'tutor', title: 'Terraform Modules & State', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Terraform Modules State Locking and Infrastructure as Code' },
          whatToDo: [
            { id: 'task-tutor-tf', type: 'tutor', title: 'Terraform HCL Mastery', desc: 'Create reusable cloud modules, S3 remote backends, and DynamoDB state locks.', url: '/ai-tutor?topic=Terraform Modules State Locking and Infrastructure as Code', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-ansible',
          title: 'Ansible',
          progress: 0,
          status: 'in-progress',
          glyph: 'terminal',
          category: 'Provisioning',
          primaryAction: { type: 'tutor', title: 'Ansible Playbooks & Configuration', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Ansible Playbooks Configuration Management and Idempotency' },
          whatToDo: [
            { id: 'task-tutor-ansible', type: 'tutor', title: 'Ansible Automation', desc: 'Idempotent server provisioning, roles, and automated configuration management.', url: '/ai-tutor?topic=Ansible Playbooks Configuration Management and Idempotency', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-linux-dev',
          title: 'Linux CLI & Scripting',
          progress: 0,
          status: 'in-progress',
          glyph: 'terminal',
          category: 'Provisioning',
          primaryAction: { type: 'tutor', title: 'Linux CLI & Scripting', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Linux Command Line Bash Scripting and Permissions' },
          whatToDo: [
            { id: 'task-tutor-linux-dev', type: 'tutor', title: 'Linux Bash Scripting', desc: 'Master bash pipes, systemd units, network interfaces, and cron jobs.', url: '/ai-tutor?topic=Linux Command Line Bash Scripting and Permissions', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        }
      ]
    },
    {
      id: 'cluster-observability',
      title: 'Observability',
      categoryTag: 'SRE & Monitoring',
      progress: 0,
      color: '#64748B',
      theme: 'slate',
      icon: 'terminal',
      subSkills: [
        {
          id: 'sub-prometheus',
          title: 'Prometheus & Grafana',
          progress: 0,
          status: 'in-progress',
          glyph: 'zap',
          category: 'Observability',
          primaryAction: { type: 'tutor', title: 'Prometheus Metrics & Grafana Dashboards', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Prometheus Metrics PromQL and Grafana Dashboards' },
          whatToDo: [
            { id: 'task-tutor-prom', type: 'tutor', title: 'PromQL & Dashboard Design', desc: 'Query time-series counters, gauge metrics, and build SRE alert dashboards.', url: '/ai-tutor?topic=Prometheus Metrics PromQL and Grafana Dashboards', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-logs',
          title: 'Log Aggregation',
          progress: 0,
          status: 'in-progress',
          glyph: 'terminal',
          category: 'Observability',
          primaryAction: { type: 'tutor', title: 'ELK Stack & OpenSearch', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Log Aggregation ELK Stack FluentBit and OpenSearch' },
          whatToDo: [
            { id: 'task-tutor-logs', type: 'tutor', title: 'Centralized Logging', desc: 'Collect distributed container logs with FluentBit into OpenSearch.', url: '/ai-tutor?topic=Log Aggregation ELK Stack FluentBit and OpenSearch', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        },
        {
          id: 'sub-incidents',
          title: 'Incident Response & SLOs',
          progress: 0,
          status: 'locked',
          glyph: 'lock',
          category: 'Observability',
          primaryAction: { type: 'tutor', title: 'SLAs, SLOs, and Error Budgets', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Site Reliability Engineering SLAs SLOs and Error Budgets' },
          whatToDo: [
            { id: 'task-tutor-slo', type: 'tutor', title: 'SRE Error Budgets', desc: 'Define four golden signals, error budgets, and on-call escalation policies.', url: '/ai-tutor?topic=Site Reliability Engineering SLAs SLOs and Error Budgets', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
          ]
        }
      ]
    }
  ],
  skillProgress: [
    { name: 'Containers', progress: 0, color: '#0284C7', icon: 'cloud' },
    { name: 'Cloud Platforms', progress: 0, color: '#F59E0B', icon: 'cloud' },
    { name: 'CI/CD Pipelines', progress: 0, color: '#10B981', icon: 'zap' },
    { name: 'Infra as Code', progress: 0, color: '#8B5CF6', icon: 'server' },
    { name: 'Observability', progress: 0, color: '#64748B', icon: 'terminal' }
  ],
  recommendedSkills: [
    {
      rank: 1,
      name: 'Dockerfile Optimization',
      reason: 'Essential skill for container efficiency',
      actionType: 'challenge',
      actionUrl: '/challenges/ch-8',
      actionLabel: 'Solve Challenge',
      taskTitle: 'Dockerfile Optimization',
      category: 'Containers',
      xp: 75
    },
    {
      rank: 2,
      name: 'AWS Cloud Architecture',
      reason: 'Standard cloud computing benchmark',
      actionType: 'quiz',
      actionUrl: '/quizzes?topic=cloud-aws',
      actionLabel: 'Take Quiz',
      taskTitle: 'AWS Cloud Architecture Quiz',
      category: 'Cloud',
      xp: 60
    }
  ],
  quote: {
    text: 'If you think good architecture is expensive, try bad architecture.',
    author: 'Brian Foote'
  }
}

export const generateProceduralGraph = (roleId, customTitle = null) => {
  const title = customTitle || roleId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return {
    roleId,
    roleName: title,
    targetLabel: title,
    overallProgress: 0,
    stats: {
      skillsLearned: '0 / 15',
      projectsCompleted: '0 / 5',
      timeSpent: '0h 0m'
    },
    centerNode: {
      id: 'center-goal',
      title,
      subtitle: '0% complete',
      progress: 0,
      icon: 'sparkles',
      status: 'in-progress'
    },
    clusters: [
      {
        id: 'cluster-core',
        title: 'Core Fundamentals',
        categoryTag: 'Foundations',
        progress: 0,
        color: '#10B981',
        theme: 'green',
        icon: 'code',
        subSkills: [
          {
            id: 'sub-core-syntax',
            title: 'Syntax & Concepts',
            progress: 0,
            status: 'in-progress',
            glyph: 'code',
            category: 'Foundations',
            primaryAction: { type: 'tutor', title: `${title} Fundamentals`, label: 'Practice with AI Tutor', url: `/ai-tutor?topic=${encodeURIComponent(title + ' Fundamentals')}` },
            whatToDo: [
              { id: 'task-tut-c1', type: 'tutor', title: `Practice with AI Tutor: ${title}`, desc: `Master the foundational concepts and paradigm of ${title}.`, url: `/ai-tutor?topic=${encodeURIComponent(title + ' Fundamentals')}`, badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' },
              { id: 'task-ch-1-dyn', type: 'challenge', title: 'Solve Coding Challenge', desc: 'Strengthen problem solving fundamentals.', url: '/challenges/ch-1', badge: '50 XP • Easy', actionLabel: 'Solve Challenge →' }
            ]
          },
          {
            id: 'sub-core-ds',
            title: 'Data Structures',
            progress: 0,
            status: 'in-progress',
            glyph: 'check',
            category: 'Foundations',
            primaryAction: { type: 'challenge', title: 'Data Structures Challenge', label: 'Solve Challenge', url: '/challenges/ch-1' },
            whatToDo: [
              { id: 'task-ch-ds-dyn', type: 'challenge', title: 'Reverse a String', desc: 'Manipulate strings and data arrays.', url: '/challenges/ch-1', badge: '50 XP • Easy', actionLabel: 'Solve Challenge →' },
              { id: 'task-arena-dyn', type: 'arena', title: 'Code Arena Practice', desc: 'Solve algorithm katas in the Code Arena.', url: '/code-arena', badge: 'Code Arena', actionLabel: 'Enter Arena →' }
            ]
          },
          {
            id: 'sub-core-patterns',
            title: 'Design Patterns',
            progress: 0,
            status: 'in-progress',
            glyph: 'cube',
            category: 'Foundations',
            primaryAction: { type: 'tutor', title: 'Design Patterns Mastery', label: 'Practice with AI Tutor', url: `/ai-tutor?topic=${encodeURIComponent(title + ' Design Patterns')}` },
            whatToDo: [
              { id: 'task-tut-c3', type: 'tutor', title: 'Design Patterns Coaching', desc: 'Learn scalable modular software patterns.', url: `/ai-tutor?topic=${encodeURIComponent(title + ' Design Patterns')}`, badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
            ]
          }
        ]
      },
      {
        id: 'cluster-frameworks',
        title: 'Frameworks & Tools',
        categoryTag: 'Ecosystem',
        progress: 0,
        color: '#0284C7',
        theme: 'blue',
        icon: 'layers',
        subSkills: [
          {
            id: 'sub-fw-core',
            title: 'Modern Frameworks',
            progress: 0,
            status: 'in-progress',
            glyph: 'sparkles',
            category: 'Ecosystem',
            primaryAction: { type: 'tutor', title: `${title} Frameworks`, label: 'Practice with AI Tutor', url: `/ai-tutor?topic=${encodeURIComponent(title + ' Frameworks')}` },
            whatToDo: [
              { id: 'task-tut-f1', type: 'tutor', title: `${title} Frameworks Guide`, desc: 'Explore standard industry tools and production libraries.', url: `/ai-tutor?topic=${encodeURIComponent(title + ' Frameworks')}`, badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
            ]
          },
          {
            id: 'sub-fw-state',
            title: 'State & Lifecycle',
            progress: 0,
            status: 'in-progress',
            glyph: 'zap',
            category: 'Ecosystem',
            primaryAction: { type: 'challenge', title: 'LRU Cache State', label: 'Solve Challenge', url: '/challenges/ch-3' },
            whatToDo: [
              { id: 'task-ch-3-dyn', type: 'challenge', title: 'LRU Cache State Challenge', desc: 'Implement caching and state management.', url: '/challenges/ch-3', badge: '100 XP • Hard', actionLabel: 'Solve Challenge →' }
            ]
          },
          {
            id: 'sub-fw-api',
            title: 'APIs & Data Flow',
            progress: 0,
            status: 'in-progress',
            glyph: 'network',
            category: 'Ecosystem',
            primaryAction: { type: 'challenge', title: 'API Rate Limiting', label: 'Solve Challenge', url: '/challenges/ch-10' },
            whatToDo: [
              { id: 'task-ch-10-dyn', type: 'challenge', title: 'API Defense Challenge', desc: 'Implement robust API handling and rate limiting.', url: '/challenges/ch-10', badge: '100 XP • Hard', actionLabel: 'Solve Challenge →' }
            ]
          }
        ]
      },
      {
        id: 'cluster-workflows',
        title: 'Workflows & Data',
        categoryTag: 'Production Workflows',
        progress: 0,
        color: '#F59E0B',
        theme: 'amber',
        icon: 'table',
        subSkills: [
          {
            id: 'sub-wf-sql',
            title: 'Storage & Queries',
            progress: 0,
            status: 'in-progress',
            glyph: 'table',
            category: 'Data',
            primaryAction: { type: 'challenge', title: 'SQL Query Aggregator', label: 'Solve Challenge', url: '/challenges/ch-4' },
            whatToDo: [
              { id: 'task-ch-4-dyn', type: 'challenge', title: 'SQL Query Aggregator', desc: 'Run aggregate queries and data manipulation.', url: '/challenges/ch-4', badge: '80 XP • Medium', actionLabel: 'Solve Challenge →' }
            ]
          },
          {
            id: 'sub-wf-async',
            title: 'Async Architecture',
            progress: 0,
            status: 'in-progress',
            glyph: 'zap',
            category: 'Data',
            primaryAction: { type: 'challenge', title: 'Debounce & Concurrency', label: 'Solve Challenge', url: '/challenges/ch-2' },
            whatToDo: [
              { id: 'task-ch-2-dyn', type: 'challenge', title: 'Debounce Wrapper', desc: 'Control async call frequency and rate limit events.', url: '/challenges/ch-2', badge: '75 XP • Medium', actionLabel: 'Solve Challenge →' }
            ]
          },
          {
            id: 'sub-wf-streaming',
            title: 'Event Handling',
            progress: 0,
            status: 'in-progress',
            glyph: 'server',
            category: 'Data',
            primaryAction: { type: 'challenge', title: 'Microservice Event Bus', label: 'Solve Challenge', url: '/challenges/ch-6' },
            whatToDo: [
              { id: 'task-ch-6-dyn', type: 'challenge', title: 'Microservice Event Bus', desc: 'Build pub/sub event routing for production workloads.', url: '/challenges/ch-6', badge: '125 XP • Hard', actionLabel: 'Solve Challenge →' }
            ]
          }
        ]
      },
      {
        id: 'cluster-quality',
        title: 'Security & Quality',
        categoryTag: 'Reliability',
        progress: 0,
        color: '#EC4899',
        theme: 'pink',
        icon: 'lock',
        subSkills: [
          {
            id: 'sub-sec-guard',
            title: 'Security Standards',
            progress: 0,
            status: 'in-progress',
            glyph: 'lock',
            category: 'Reliability',
            primaryAction: { type: 'tutor', title: `${title} Security`, label: 'Practice with AI Tutor', url: `/ai-tutor?topic=${encodeURIComponent(title + ' Security and Best Practices')}` },
            whatToDo: [
              { id: 'task-tut-sec', type: 'tutor', title: 'Security & Defense Coaching', desc: 'Prevent vulnerabilities, secure inputs, and adhere to OWASP standards.', url: `/ai-tutor?topic=${encodeURIComponent(title + ' Security and Best Practices')}`, badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
            ]
          },
          {
            id: 'sub-sec-testing',
            title: 'Automated Testing',
            progress: 0,
            status: 'in-progress',
            glyph: 'check',
            category: 'Reliability',
            primaryAction: { type: 'tutor', title: 'Unit & Integration Testing', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=Unit Testing Integration Testing and Mocking' },
            whatToDo: [
              { id: 'task-tut-test', type: 'tutor', title: 'Testing Best Practices', desc: 'Write assertions, mocks, and regression test suites.', url: '/ai-tutor?topic=Unit Testing Integration Testing and Mocking', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
            ]
          },
          {
            id: 'sub-sec-perf',
            title: 'Performance & Scale',
            progress: 0,
            status: 'in-progress',
            glyph: 'zap',
            category: 'Reliability',
            primaryAction: { type: 'challenge', title: 'Prompt & Memory Compression', label: 'Solve Challenge', url: '/challenges/ch-12' },
            whatToDo: [
              { id: 'task-ch-12-dyn', type: 'challenge', title: 'Semantic Compression', desc: 'Optimize payloads and memory usage.', url: '/challenges/ch-12', badge: '100 XP • Medium', actionLabel: 'Solve Challenge →' }
            ]
          }
        ]
      },
      {
        id: 'cluster-deployment',
        title: 'Cloud & Deployment',
        categoryTag: 'Infrastructure',
        progress: 0,
        color: '#64748B',
        theme: 'slate',
        icon: 'cloud',
        subSkills: [
          {
            id: 'sub-dep-docker',
            title: 'Containerization',
            progress: 0,
            status: 'in-progress',
            glyph: 'docker',
            category: 'Infrastructure',
            primaryAction: { type: 'challenge', title: 'Dockerfile Optimization', label: 'Solve Challenge', url: '/challenges/ch-8' },
            whatToDo: [
              { id: 'task-ch-8-dyn', type: 'challenge', title: 'Dockerfile Optimization', desc: 'Multi-stage builds and minimal image sizes.', url: '/challenges/ch-8', badge: '75 XP • Medium', actionLabel: 'Solve Challenge →' }
            ]
          },
          {
            id: 'sub-dep-cicd',
            title: 'CI / CD & Releases',
            progress: 0,
            status: 'in-progress',
            glyph: 'zap',
            category: 'Infrastructure',
            primaryAction: { type: 'tutor', title: 'CI/CD Pipelines', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=GitHub Actions CI CD Automated Testing and Deployment' },
            whatToDo: [
              { id: 'task-tut-cicd', type: 'tutor', title: 'Automated CI/CD Pipelines', desc: 'Deploy with automated testing gates and zero-downtime rollouts.', url: '/ai-tutor?topic=GitHub Actions CI CD Automated Testing and Deployment', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
            ]
          },
          {
            id: 'sub-dep-cloud',
            title: 'Cloud Platforms',
            progress: 0,
            status: 'locked',
            glyph: 'lock',
            category: 'Infrastructure',
            primaryAction: { type: 'tutor', title: 'Cloud Infrastructure', label: 'Practice with AI Tutor', url: '/ai-tutor?topic=AWS Serverless Architecture S3 Lambda and ECS' },
            whatToDo: [
              { id: 'task-tut-cloud', type: 'tutor', title: 'Cloud Mastery', desc: 'Provision cloud resources, compute, and serverless backends.', url: '/ai-tutor?topic=AWS Serverless Architecture S3 Lambda and ECS', badge: 'AI Coaching', actionLabel: 'Ask AI Tutor →' }
            ]
          }
        ]
      }
    ],
    skillProgress: [
      { name: 'Core Fundamentals', progress: 0, color: '#10B981', icon: 'code' },
      { name: 'Frameworks & Tools', progress: 0, color: '#0284C7', icon: 'layers' },
      { name: 'Workflows & Data', progress: 0, color: '#F59E0B', icon: 'table' },
      { name: 'Security & Quality', progress: 0, color: '#EC4899', icon: 'lock' },
      { name: 'Cloud & Deployment', progress: 0, color: '#64748B', icon: 'cloud' }
    ],
    recommendedSkills: [
      {
        rank: 1,
        name: 'Core Concepts',
        reason: `Fundamental for ${title}`,
        actionType: 'tutor',
        actionUrl: `/ai-tutor?topic=${encodeURIComponent(title + ' Fundamentals')}`,
        actionLabel: 'Learn with AI',
        taskTitle: `${title} Foundations`,
        category: 'Foundations',
        xp: 80
      },
      {
        rank: 2,
        name: 'Containerization',
        reason: 'Essential for modern production deployment',
        actionType: 'challenge',
        actionUrl: '/challenges/ch-8',
        actionLabel: 'Solve Challenge',
        taskTitle: 'Dockerfile Optimization',
        category: 'DevOps',
        xp: 75
      }
    ],
    quote: {
      text: `Every expert in ${title} was once a beginner who refused to quit.`,
      author: 'REXION AI'
    }
  }
}

export const getFallbackGraphForRole = (roleId, customTitle = null) => {
  if (!roleId) return DEFAULT_AI_ENGINEER_GRAPH
  const norm = String(roleId).toLowerCase().trim()
  if (norm === 'agentic-ai' || norm.includes('agent')) return DEFAULT_AGENTIC_AI_GRAPH
  if (norm === 'data-analyst' || norm.includes('data') || norm.includes('analyst') || norm.includes('scientist')) return DEFAULT_DATA_ANALYST_GRAPH
  if (norm === 'fullstack-developer' || norm.includes('fullstack') || (norm.includes('software') && !norm.includes('engineer'))) return DEFAULT_FULLSTACK_GRAPH
  if (norm === 'frontend-developer' || norm.includes('front') || norm.includes('ui') || norm.includes('web')) return DEFAULT_FRONTEND_GRAPH
  if (norm === 'cloud-devops' || norm.includes('devops') || norm.includes('cloud') || norm.includes('sre')) return DEFAULT_DEVOPS_GRAPH
  if (norm === 'ai-engineer' || norm.includes('ai') || norm.includes('ml')) return DEFAULT_AI_ENGINEER_GRAPH
  return generateProceduralGraph(norm, customTitle)
}

export default function SkillGraphPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const roleFromUrl = searchParams.get('role')
  const { user } = useAuth()
  const sessionUser = getStoredUser()

  const isMySkillsRoute = location.pathname === '/my-skills' || location.pathname === '/skills' || searchParams.get('view') === 'skills' || searchParams.get('tab') === 'my-skills'
  const [activeView, setActiveView] = useState(() => isMySkillsRoute ? 'my-skills' : 'skill-graph')

  useEffect(() => {
    if (location.pathname === '/my-skills' || location.pathname === '/skills' || searchParams.get('view') === 'skills' || searchParams.get('tab') === 'my-skills') {
      setActiveView('my-skills')
    } else if (location.pathname === '/skill-graph' || location.pathname === '/skill_graph') {
      if (searchParams.get('view') !== 'skills') {
        setActiveView('skill-graph')
      }
    }
  }, [location.pathname, searchParams])

  const [profile, setProfile] = useState(null)
  const [journeyModalOpen, setJourneyModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParam = new URLSearchParams(window.location.search).get('role')
      if (urlParam) return urlParam
      const stored = window.localStorage.getItem('rexionTargetRole')
      if (stored) return stored
    }
    return "ai-engineer"
  })
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)
  const [activeFilterTab, setActiveFilterTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")

  const [graphData, setGraphData] = useState(() => {
    const initialRole = typeof window !== 'undefined'
      ? (new URLSearchParams(window.location.search).get('role') || window.localStorage.getItem('rexionTargetRole') || 'ai-engineer')
      : 'ai-engineer'
    const storedTitle = typeof window !== 'undefined' ? window.localStorage.getItem('rexionTargetRoleTitle') : null
    return getFallbackGraphForRole(initialRole, storedTitle)
  })
  const [loading, setLoading] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)

  // Interactive Canvas State
  const [zoom, setZoom] = useState(100)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedNode, setSelectedNode] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [toast, setToast] = useState(null)

  const [customRoles, setCustomRoles] = useState([])
  const [customPathInput, setCustomPathInput] = useState("")
  const [isGeneratingCustomPath, setIsGeneratingCustomPath] = useState(false)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Unified Role Selection Handler that synchronizes URL, localStorage, Profile, and broadcasts
  const handleSelectRole = (newRoleId, newRoleTitle = null, providedGraph = null) => {
    if (!newRoleId) return
    setSelectedRole(newRoleId)
    setSearchParams({ role: newRoleId }, { replace: true })
    setRoleDropdownOpen(false)

    const allRoles = [...TARGET_ROLES, ...customRoles]
    const matched = allRoles.find(r => r.id === newRoleId)
    const titleToSave = newRoleTitle || matched?.label || newRoleId

    // Immediately morph the graph canvas with 0ms delay!
    const immediateGraph = providedGraph || getFallbackGraphForRole(newRoleId, titleToSave)
    setGraphData(immediateGraph)
    setAnimationKey(prev => prev + 1)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('rexionTargetRole', newRoleId)
      window.localStorage.setItem('rexionTargetRoleTitle', titleToSave)

      try {
        const uStr = window.localStorage.getItem('rexionUser')
        if (uStr) {
          const u = JSON.parse(uStr)
          u.targetRole = titleToSave
          window.localStorage.setItem('rexionUser', JSON.stringify(u))
        }
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('rexion-target-role-changed', {
        detail: { roleId: newRoleId, roleTitle: titleToSave, customData: providedGraph }
      }))
    }

    profileApi.update({ targetRole: titleToSave }).catch(() => {})
    showToast(`Switched career track to ${titleToSave}`)

    // Background server refresh
    skillGraphApi.getSkillGraph(newRoleId)
      .then((data) => {
        if (data && (data.clusters?.length || data.roleName)) {
          setGraphData(data)
          setAnimationKey(prev => prev + 1)
        }
      })
      .catch(() => {})
  }

  // Synchronize state when URL query parameter changes
  useEffect(() => {
    if (roleFromUrl && roleFromUrl !== selectedRole) {
      setSelectedRole(roleFromUrl)
      setGraphData(getFallbackGraphForRole(roleFromUrl))
      setAnimationKey(prev => prev + 1)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('rexionTargetRole', roleFromUrl)
      }
    }
  }, [roleFromUrl, selectedRole])

  const handleGenerateCustomPath = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    const title = customPathInput.trim()
    if (!title) return

    setIsGeneratingCustomPath(true)
    showToast(`Synthesizing custom AI skill tree for "${title}"...`)

    try {
      const res = await skillGraphApi.generateCustomPath(title)
      const roleId = res?.roleId || title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const roleName = res?.roleName || title
      const newRole = {
        id: roleId,
        label: roleName,
        icon: Sparkles
      }
      setCustomRoles(prev => {
        if (prev.some(r => r.id === newRole.id)) return prev
        return [...prev, newRole]
      })
      handleSelectRole(roleId, roleName, res?.data)
      setCustomPathInput("")
      showToast(`✨ Generated AI Skill Graph for ${roleName}!`)
    } catch (err) {
      console.error("Failed to generate custom path:", err)
      showToast("Could not generate custom path. Please try again.")
    } finally {
      setIsGeneratingCustomPath(false)
    }
  }

  // Load User Profile without stomping active URL or session role
  useEffect(() => {
    let isMounted = true
    const token = typeof window !== 'undefined'
      ? (window.localStorage.getItem('rexionAuthToken') || window.sessionStorage.getItem('rexionAuthToken'))
      : null
    if (!token) return

    profileApi.get({ __skipUnauthorizedRedirect: true })
      .then((res) => {
        if (!isMounted) return
        const p = res?.data?.candidate || res?.data?.profile || res?.data || res || {}
        setProfile(p)

        // Only adopt p.targetRole if there is NO explicit role in URL and NO targetRole in localStorage
        const activeUrlRole = new URLSearchParams(window.location.search).get('role')
        const activeStoredRole = typeof window !== 'undefined' ? window.localStorage.getItem('rexionTargetRole') : null
        if (!activeUrlRole && !activeStoredRole && p.targetRole) {
          const match = findMatchingRole(p.targetRole, [...TARGET_ROLES, ...customRoles])
          if (match) {
            setSelectedRole(match.id)
            setSearchParams({ role: match.id }, { replace: true })
            setGraphData(getFallbackGraphForRole(match.id, match.label))
          }
        }
      })
      .catch(() => {})
    return () => { isMounted = false }
  }, [])

  // Load Graph Data & listen for real-time quiz updates
  useEffect(() => {
    let isMounted = true
    const fetchGraph = () => {
      setLoading(true)
      skillGraphApi.getSkillGraph(selectedRole)
        .then((data) => {
          if (!isMounted) return
          if (data && (data.clusters?.length || data.roleName)) {
            setGraphData(data)
            setAnimationKey(prev => prev + 1)
          }
          setLoading(false)
        })
        .catch((err) => {
          console.error("Failed to load skill graph:", err)
          if (isMounted) setLoading(false)
        })
    }

    fetchGraph()

    // Real-time synchronization whenever user solves a quiz or challenge
    const handleQuizCompleted = () => {
      fetchGraph()
    }
    const handleRoleChanged = (e) => {
      if (e?.detail?.roleId) {
        setSelectedRole(e.detail.roleId)
        setSearchParams({ role: e.detail.roleId }, { replace: true })
        if (e.detail.customData) {
          setGraphData(e.detail.customData)
        } else {
          setGraphData(getFallbackGraphForRole(e.detail.roleId, e.detail.roleTitle))
        }
        setAnimationKey(prev => prev + 1)
      }
    }
    window.addEventListener('rexion-quiz-completed', handleQuizCompleted)
    window.addEventListener('rexion-target-role-changed', handleRoleChanged)
    window.addEventListener('storage', handleQuizCompleted)

    return () => {
      isMounted = false
      window.removeEventListener('rexion-quiz-completed', handleQuizCompleted)
      window.removeEventListener('rexion-target-role-changed', handleRoleChanged)
      window.removeEventListener('storage', handleQuizCompleted)
    }
  }, [selectedRole])

  // Canvas Pan handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoomIn = () => setZoom(prev => Math.min(160, prev + 15))
  const handleZoomOut = () => setZoom(prev => Math.max(60, prev - 15))
  const handleResetView = () => {
    setZoom(100)
    setPan({ x: 0, y: 0 })
    setAnimationKey(prev => prev + 1)
    showToast("Graph view reset")
  }

  // Layout Node Coordinates Calculation (Matching media_1790878206118.jpg)
  const width = 960
  const height = 580
  const centerPos = { x: 470, y: 275 }

  // 5 Cluster Hub locations, background pods, and their leaf orientations
  const clusterLayouts = [
    // 0: Python / Programming (Left)
    {
      cx: 265, cy: 195,
      pod: { x: 205, y: 155, width: 120, height: 138, rx: 34 },
      tagY: 275,
      tagBg: "#E8F5E9",
      tagColor: "#2E7D32",
      leaves: [
        { dx: -120, dy: -80, tagPos: "left", glyph: "check" }, // Data Structures 100%
        { dx: -135, dy: -12, tagPos: "left", glyph: "code" },  // OOP 65%
        { dx: -130, dy: 58, tagPos: "left", glyph: "zap" },    // Async 42%
        { dx: -110, dy: 128, tagPos: "left", glyph: "check" }  // Data Structures 58%
      ]
    },
    // 1: Machine Learning (Top)
    {
      cx: 470, cy: 110,
      pod: { x: 405, y: 72, width: 130, height: 100, rx: 34 },
      tagY: null, // No redundant pill for ML matching reference
      tagBg: null,
      tagColor: null,
      leaves: [
        { dx: -105, dy: -42, tagPos: "top", glyph: "table" }, // Pandas 88%
        { dx: -5, dy: -75, tagPos: "top", glyph: "lock" },    // Deep Learning 45%
        { dx: 110, dy: -38, tagPos: "top", glyph: "cube" }    // NumPy 76%
      ]
    },
    // 2: AI & LLMs (Right)
    {
      cx: 680, cy: 215,
      pod: { x: 620, y: 175, width: 120, height: 138, rx: 34 },
      tagY: 285,
      tagBg: "#FFF3E0",
      tagColor: "#E65100",
      leaves: [
        { dx: 125, dy: -70, tagPos: "right", glyph: "sparkles" }, // Prompt Eng 80%
        { dx: 140, dy: 5, tagPos: "right", glyph: "rag" },        // RAG 41%
        { dx: 125, dy: 72, tagPos: "right", glyph: "lock" }       // Agents 28%
      ]
    },
    // 3: Backend (Bottom-Left)
    {
      cx: 295, cy: 395,
      pod: { x: 235, y: 355, width: 120, height: 138, rx: 34 },
      tagY: 460,
      tagBg: "#FFF8E1",
      tagColor: "#D97706",
      leaves: [
        { dx: -112, dy: -10, tagPos: "bottom", glyph: "zap" },    // FastAPI 32%
        { dx: -75, dy: 55, tagPos: "bottom", glyph: "server" },   // Node.js 68%
        { dx: 72, dy: 52, tagPos: "bottom", glyph: "network" }    // APIs 54%
      ]
    },
    // 4: DevOps & Tools (Bottom-Right)
    {
      cx: 635, cy: 395,
      pod: { x: 570, y: 355, width: 130, height: 138, rx: 34 },
      tagY: 460,
      tagBg: "#F1F5F9",
      tagColor: "#475569",
      leaves: [
        { dx: 105, dy: -25, tagPos: "right", glyph: "docker" },  // Docker 22%
        { dx: 115, dy: 45, tagPos: "right", glyph: "lock" },     // AWS 15%
        { dx: 90, dy: 115, tagPos: "bottom", glyph: "terminal" } // Linux 47%
      ]
    }
  ]

  // Construct coordinates for all nodes and paths
  const renderedClusters = (graphData?.clusters || []).map((cluster, cIdx) => {
    const layout = clusterLayouts[cIdx % clusterLayouts.length]
    const subNodes = (cluster.subSkills || []).map((sub, sIdx) => {
      const leafPos = layout.leaves[sIdx % layout.leaves.length]
      const sx = layout.cx + leafPos.dx
      const sy = layout.cy + leafPos.dy

      // Calculate connection joint point on cluster hub circumference (radius ~26)
      const angle = Math.atan2(sy - layout.cy, sx - layout.cx)
      const jx = layout.cx + Math.cos(angle) * 26
      const jy = layout.cy + Math.sin(angle) * 26

      return {
        ...sub,
        x: sx,
        y: sy,
        jx,
        jy,
        glyph: sub.glyph || (sub.status === "locked" ? "lock" : leafPos.glyph),
        clusterId: cluster.id,
        category: cluster.categoryTag,
        themeColor: cluster.color
      }
    })
    return {
      ...cluster,
      x: layout.cx,
      y: layout.cy,
      pod: layout.pod,
      tagY: layout.tagY,
      tagBg: layout.tagBg,
      tagColor: layout.tagColor,
      subNodes
    }
  })

  const currentUser = {
    name: profile?.fullName || sessionUser?.name || "Anshu Pal",
    role: profile?.education?.[0]?.degree || "Student",
    avatar: profile?.profilePhoto || null,
    targetRoleName: graphData?.roleName || "AI Engineer",
    overallProgress: graphData?.overallProgress || 68
  }

  return (
    <div className={styles.shell}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: "fixed",
              top: 24,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#231C16",
              color: "#FFFFFF",
              padding: "10px 20px",
              borderRadius: 999,
              fontSize: "0.85rem",
              fontWeight: 600,
              zIndex: 9999,
              boxShadow: "0 8px 24px rgba(0,0,0,0.18)"
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═════════════════════════════════════════════════════════
          LEFT SIDEBAR
          ═════════════════════════════════════════════════════════ */}
      <aside className={styles.sidebar}>
        {/* Logo */}
        <div className={styles.brand} onClick={() => navigate("/workspace")}>
          <div className={styles.brandMark}>R</div>
          <div>
            <div className={styles.brandName}>REXION</div>
            <div className={styles.brandSub}>AI CAREER PLATFORM</div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className={styles.navSection}>
          <nav className={styles.navMenu}>
            {MAIN_NAV.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  className={styles.navItem}
                  onClick={() => item.route ? navigate(item.route) : showToast(`${item.label} coming soon`)}
                >
                  <div className={styles.navItemLeft}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Progress Navigation */}
        <div className={styles.navSection}>
          <div className={styles.navSectionLabel}>Progress</div>
          <nav className={styles.navMenu}>
            {PROGRESS_NAV.map((item) => {
              const Icon = item.icon
              const isActive = (item.id === "my-skills" && activeView === "my-skills") || (item.id === "skill-graph" && activeView === "skill-graph")
              return (
                <button
                  key={item.id}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                  onClick={() => {
                    if (item.id === "my-skills") {
                      setActiveView("my-skills")
                      navigate("/my-skills")
                    } else if (item.id === "skill-graph") {
                      setActiveView("skill-graph")
                      navigate("/skill-graph")
                    } else if (item.route) {
                      navigate(item.route)
                    } else {
                      showToast(`Viewing ${item.label}`)
                    }
                  }}
                >
                  <div className={styles.navItemLeft}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={15} className={styles.navArrow} />}
                </button>
              )
            })}
          </nav>
        </div>

        {/* More Navigation */}
        <div className={styles.navSection}>
          <div className={styles.navSectionLabel}>More</div>
          <nav className={styles.navMenu}>
            {MORE_NAV.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  className={styles.navItem}
                  onClick={() => item.route ? navigate(item.route) : showToast(`Opening ${item.label}`)}
                >
                  <div className={styles.navItemLeft}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Floating Path Card matching screenshot */}
        <div
          className={styles.journeyWidget}
          onClick={() => setJourneyModalOpen(true)}
          style={{
            cursor: "pointer",
            backgroundImage: `linear-gradient(rgba(18, 20, 24, 0.88), rgba(12, 14, 18, 0.95)), url(${careerMountainsAsset})`,
            backgroundSize: "cover",
            backgroundPosition: "center bottom",
            color: "#FFFFFF",
            borderRadius: "14px",
            padding: "16px 14px",
            border: "1px solid rgba(255, 255, 255, 0.08)"
          }}
          title="Click to select another career track or generate with AI"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                background: "rgba(217, 107, 67, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Sparkles size={11} color="#D96B43" />
              </div>
              <span style={{ fontSize: "0.72rem", color: "#94A3B8", fontWeight: 600 }}>Your Current Path</span>
            </div>
            <ChevronRight size={13} color="#94A3B8" />
          </div>

          <div style={{ fontSize: "1.02rem", fontWeight: 800, color: "#FFFFFF", margin: "2px 0 10px" }}>
            {currentUser.targetRoleName}
          </div>

          <div className={styles.journeyBar}>
            <div className={styles.journeyBarFill} style={{ width: `${currentUser.overallProgress}%` }} />
          </div>

          <div style={{ fontSize: "0.74rem", color: "#94A3B8", fontWeight: 600, marginTop: 4, marginBottom: 12 }}>
            {currentUser.overallProgress}% complete
          </div>

          <button
            className={styles.journeySwitchBtn}
            onClick={(e) => {
              e.stopPropagation()
              setJourneyModalOpen(true)
            }}
          >
            <span>Switch Path</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Bottom spacer for clean scrolling breathing room */}
        <div className={styles.sidebarBottomSpacer} />
      </aside>

      {/* ═════════════════════════════════════════════════════════
          MAIN PAGE AREA
          ═════════════════════════════════════════════════════════ */}
      <main className={styles.main}>
        {/* Top Header Bar */}
        <header className={styles.topBar}>
          <div className={styles.searchWrap}>
            <Search size={17} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search skills, topics, or anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className={styles.searchKbd}>Ctrl + K</span>
          </div>

          <div className={styles.topActions}>
            <button className={styles.bellBtn} onClick={() => showToast("No new notifications")}>
              <Bell size={18} />
              <span className={styles.bellDot} />
            </button>

            <div className={styles.userChip} onClick={() => navigate("/profile")}>
              <div className={styles.userAvatar}>
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt="Profile" className={styles.userAvatarImg} />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{currentUser.name}</span>
                <span className={styles.userRole}>{currentUser.role}</span>
              </div>
              <ChevronDown size={14} color="#8E7E70" />
            </div>
          </div>
        </header>

        {/* Page Content Area */}
        <div className={styles.contentArea} style={{ padding: activeView === 'my-skills' ? '24px 32px 60px' : undefined }}>
          {activeView === 'my-skills' ? (
            <MySkillsSection
              profile={profile}
              graphData={graphData}
              targetRoleTitle={currentUser.targetRoleName}
              onViewFullGraph={() => {
                setActiveView('skill-graph')
                navigate('/skill-graph')
              }}
              onOpenTrackModal={() => setJourneyModalOpen(true)}
              showToast={showToast}
            />
          ) : (
            <>
              {/* Header & Subtitle */}
          <div className={styles.headerSection}>
            <div className={styles.breadcrumb}>PROGRESS / SKILL GRAPH</div>
            <h1 className={styles.pageTitle}>
              Your Skill Graph
              <Sparkles size={24} className={styles.titleSparkle} />
            </h1>
            <p className={styles.pageSubtitle}>
              Visualize your learning journey. Build skills. Unlock opportunities.
            </p>
          </div>

          {/* Filter Tabs & Target Goal Dropdown */}
          <div className={styles.filterRow}>
            <div className={styles.filterTabs}>
              {[
                { id: "overview", label: "Overview" },
                { id: "all-skills", label: "All Skills" },
                { id: "learning-paths", label: "Learning Paths" },
                { id: "career-focus", label: "Career Focus" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.filterPill} ${activeFilterTab === tab.id ? styles.filterPillActive : ""}`}
                  onClick={() => setActiveFilterTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Target Role Selector */}
            <div style={{ position: "relative" }}>
              {(() => {
                const allRoles = [...TARGET_ROLES, ...customRoles]
                const curObj = allRoles.find(r => r.id === selectedRole)
                const CurrentIcon = curObj?.icon || Cpu

                return (
                  <>
                    <button
                      className={styles.roleSelectBtn}
                      onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                    >
                      <div className={styles.roleIconBadge}>
                        <CurrentIcon size={14} />
                      </div>
                      <span>{curObj?.label || graphData?.roleName || "AI Engineer"}</span>
                      <ChevronDown size={15} color="#8E7E70" />
                    </button>

                    <AnimatePresence>
                      {roleDropdownOpen && (
                        <motion.div
                          className={styles.roleDropdownMenu}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                        >
                          <div className={styles.roleDropdownHeader}>Choose Career Track</div>
                          {allRoles.map((r) => {
                            const Icon = r.icon
                            const isSel = r.id === selectedRole
                            return (
                              <button
                                key={r.id}
                                className={`${styles.roleDropdownItem} ${isSel ? styles.roleDropdownItemActive : ""}`}
                                onClick={() => handleSelectRole(r.id, r.label)}
                              >
                                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <Icon size={14} />
                                  {r.label}
                                </span>
                                {isSel && <Check size={14} />}
                              </button>
                            )
                          })}

                          <div className={styles.roleDropdownDivider} />

                          <form className={styles.customPathForm} onSubmit={handleGenerateCustomPath}>
                            <div className={styles.customPathLabel}>
                              <Sparkles size={13} color="#D96B43" />
                              <span>Generate Custom AI Path</span>
                            </div>
                            <div className={styles.customPathInputGroup}>
                              <input
                                type="text"
                                className={styles.customPathInput}
                                placeholder="e.g. Cybersecurity, Web3, iOS..."
                                value={customPathInput}
                                onChange={(e) => setCustomPathInput(e.target.value)}
                                disabled={isGeneratingCustomPath}
                              />
                              <button
                                type="submit"
                                className={styles.customPathSubmitBtn}
                                disabled={!customPathInput.trim() || isGeneratingCustomPath}
                              >
                                {isGeneratingCustomPath ? (
                                  <RefreshCw size={12} className={styles.spinIcon} />
                                ) : (
                                  "AI Build →"
                                )}
                              </button>
                            </div>
                          </form>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )
              })()}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════
              DASHBOARD GRID: LEFT GRAPH + RIGHT RAIL
              ═══════════════════════════════════════════════════════ */}
          <div className={styles.dashboardGrid}>
            {/* Left Graph Container */}
            <div className={styles.graphContainer}>
              {activeFilterTab === "overview" && (
                <div className={styles.graphCard}>
                {/* Graph Toolbar */}
                <div className={styles.graphToolbar}>
                  <div className={styles.graphLegend}>
                    <div className={styles.legendItem}>
                      <span className={`${styles.legendDot} ${styles.legendCompleted}`} />
                      <span>Completed</span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={`${styles.legendDot} ${styles.legendInProgress}`} />
                      <span>In Progress</span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={`${styles.legendDot} ${styles.legendLocked}`} />
                      <Lock size={12} color="#94A3B8" />
                      <span>Locked</span>
                    </div>
                  </div>

                  <div className={styles.graphControls}>
                    <button className={styles.graphCtrlBtn} onClick={handleZoomOut} title="Zoom Out">−</button>
                    <span className={styles.zoomLabel}>{zoom}%</span>
                    <button className={styles.graphCtrlBtn} onClick={handleZoomIn} title="Zoom In">+</button>
                    <button className={styles.graphCtrlBtn} onClick={handleResetView} title="Reset View">
                      <Maximize2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Interactive SVG Mindmap Canvas */}
                <div
                  className={styles.graphViewport}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <svg
                    key={animationKey}
                    viewBox={`0 0 ${width} ${height}`}
                    className={styles.graphSvg}
                    style={{
                      transform: `scale(${zoom / 100}) translate(${pan.x}px, ${pan.y}px)`,
                      transformOrigin: "center center",
                      transition: isDragging ? "none" : "transform 0.25s ease"
                    }}
                  >
                    <defs>
                      {/* Ambient Glow Filter */}
                      <filter id="haloGlow" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                      {/* Gradient for Center Node Ring */}
                      <linearGradient id="centerRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0EA5E9" />
                        <stop offset="50%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#F97316" />
                      </linearGradient>
                      {/* Shadow */}
                      <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity="0.08" floodColor="#231C16" />
                      </filter>
                    </defs>

                    {/* ── CLUSTER BACKGROUND PODS (Matching media_1790878206118.jpg) ── */}
                    {renderedClusters.map((cluster) => cluster.pod && (
                      <rect
                        key={`pod-${cluster.id}`}
                        x={cluster.pod.x}
                        y={cluster.pod.y}
                        width={cluster.pod.width}
                        height={cluster.pod.height}
                        rx={cluster.pod.rx}
                        fill="rgba(255, 255, 255, 0.72)"
                        stroke="#ECE5DC"
                        strokeWidth="1"
                        filter="url(#nodeShadow)"
                      />
                    ))}

                    {/* ── CONNECTION LINES: ROOT TO CLUSTERS ── */}
                    {renderedClusters.map((cluster, idx) => {
                      const mx = (centerPos.x + cluster.x) / 2
                      const my = (centerPos.y + cluster.y) / 2
                      const pathStr = `M ${centerPos.x} ${centerPos.y} Q ${mx} ${my} ${cluster.x} ${cluster.y}`
                      return (
                        <g key={`edge-root-${cluster.id}`}>
                          <motion.path
                            d={pathStr}
                            fill="none"
                            stroke={cluster.color}
                            strokeWidth="2.4"
                            strokeOpacity={hoveredNode?.clusterId === cluster.id ? 1 : 0.65}
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.85 }}
                            transition={{ duration: 0.7, delay: 0.15 + idx * 0.08, ease: "easeOut" }}
                          />
                        </g>
                      )
                    })}

                    {/* ── CONNECTION LINES: CLUSTERS TO SUB-SKILLS WITH JOINT BEADS ── */}
                    {renderedClusters.map((cluster, cIdx) => (
                      <g key={`sub-edges-${cluster.id}`}>
                        {cluster.subNodes.map((sub, sIdx) => {
                          const c1x = sub.jx + (sub.x - sub.jx) * 0.45
                          const c1y = sub.jy
                          const c2x = sub.x - (sub.x - sub.jx) * 0.3
                          const c2y = sub.y
                          const pathStr = `M ${sub.jx} ${sub.jy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${sub.x} ${sub.y}`

                          return (
                            <g key={`edge-group-${sub.id}`}>
                              {/* Animated curved branch */}
                              <motion.path
                                d={pathStr}
                                fill="none"
                                stroke={cluster.color}
                                strokeWidth="1.8"
                                strokeDasharray={sub.status === "locked" ? "3 3" : "none"}
                                strokeOpacity={sub.status === "locked" ? 0.35 : 0.65}
                                strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: sub.status === "locked" ? 0.35 : 0.65 }}
                                transition={{ duration: 0.5, delay: 0.4 + cIdx * 0.05 + sIdx * 0.03, ease: "easeOut" }}
                              />
                              {/* Small joint bead on cluster ring */}
                              <circle cx={sub.jx} cy={sub.jy} r="3" fill={cluster.color} />
                            </g>
                          )
                        })}
                      </g>
                    ))}

                    {/* ── SUB-SKILL LEAF NODES ── */}
                    {renderedClusters.map((cluster, cIdx) => (
                      <g key={`sub-nodes-${cluster.id}`}>
                        {cluster.subNodes.map((sub, sIdx) => {
                          const isCompleted = sub.status === "completed"
                          const isLocked = sub.status === "locked"
                          const dotColor = isCompleted ? "#10B981" : isLocked ? "#94A3B8" : "#E27D60"
                          const haloColor = isCompleted ? "#E8F8EE" : isLocked ? "#F1F5F9" : "#FEF3EB"
                          const isHovered = hoveredNode?.id === sub.id

                          return (
                            <g key={sub.id} transform={`translate(${sub.x}, ${sub.y})`}>
                              <motion.g
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: isHovered ? 1.18 : 1, opacity: 1 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 280,
                                  damping: 18,
                                  delay: 0.45 + cIdx * 0.05 + sIdx * 0.03
                                }}
                                style={{ cursor: "pointer" }}
                                onClick={() => setSelectedNode(sub)}
                                onMouseEnter={() => setHoveredNode(sub)}
                                onMouseLeave={() => setHoveredNode(null)}
                              >
                                {/* Outer soft halo */}
                                <circle
                                  r="17"
                                  fill={haloColor}
                                  opacity={isHovered ? 0.95 : 0.65}
                                />

                                {/* Inner White Node Circle */}
                                <circle
                                  r="13"
                                  fill="#FFFFFF"
                                  stroke={dotColor}
                                  strokeWidth="2.2"
                                  filter="url(#nodeShadow)"
                                />

                                {/* Leaf Glyph Icon */}
                                <LeafGlyph glyph={sub.glyph} color={dotColor} />

                                {/* Skill Title & Percent Label */}
                                <text
                                  x="22"
                                  y="0"
                                  dominantBaseline="middle"
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                    fill: isLocked ? "#94A3B8" : "#231C16"
                                  }}
                                >
                                  {sub.title}
                                </text>
                                <text
                                  x="22"
                                  y="13"
                                  dominantBaseline="middle"
                                  style={{
                                    fontSize: "9.5px",
                                    fontWeight: 600,
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                    fill: isLocked ? "#94A3B8" : "#8E7E70"
                                  }}
                                >
                                  {sub.progress}%
                                </text>
                              </motion.g>
                            </g>
                          )
                        })}
                      </g>
                    ))}

                    {/* ── CLUSTER HUB NODES ── */}
                    {renderedClusters.map((cluster, cIdx) => {
                      const isHovered = hoveredNode?.id === cluster.id
                      return (
                        <g key={cluster.id} transform={`translate(${cluster.x}, ${cluster.y})`}>
                          <motion.g
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: isHovered ? 1.12 : 1, opacity: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 260,
                              damping: 20,
                              delay: 0.28 + cIdx * 0.06
                            }}
                            style={{ cursor: "pointer" }}
                            onClick={() => setSelectedNode(cluster)}
                            onMouseEnter={() => setHoveredNode(cluster)}
                            onMouseLeave={() => setHoveredNode(null)}
                          >
                            {/* Pulsing ring on hover */}
                            {isHovered && (
                              <circle r="34" fill={cluster.color} opacity="0.2" filter="url(#haloGlow)" />
                            )}

                            {/* Outer Node Circle */}
                            <circle
                              r="26"
                              fill="#FFFFFF"
                              stroke={cluster.color}
                              strokeWidth="2.8"
                              filter="url(#nodeShadow)"
                            />

                            {/* Inner Icon Background */}
                            <circle
                              r="19"
                              fill={cluster.color === "#10B981" ? "#ECFDF5" : cluster.color === "#E27D60" ? "#FEF3EB" : "#F8FAFC"}
                            />

                            {/* Icon placement */}
                            <g transform="translate(-8, -8)">
                              <SkillIcon iconType={cluster.icon} size={16} color={cluster.color} />
                            </g>

                            {/* Category Tag pill underneath (for clusters with category tag) */}
                            {cluster.categoryTag && (() => {
                              const pillW = cluster.categoryTag.length > 10 ? 104 : 78
                              return (
                                <g transform="translate(0, 74)">
                                  <rect
                                    x={-pillW / 2}
                                    y="-10"
                                    width={pillW}
                                    height="20"
                                    rx="10"
                                    fill={cluster.tagBg || "#FFFFFF"}
                                    stroke="#ECE5DC"
                                    strokeWidth="1"
                                    filter="url(#nodeShadow)"
                                  />
                                  <text
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    style={{
                                      fontSize: "9px",
                                      fontWeight: 700,
                                      fontFamily: "Plus Jakarta Sans, sans-serif",
                                      fill: cluster.tagColor || "#5C4D40"
                                    }}
                                  >
                                    {cluster.categoryTag}
                                  </text>
                                </g>
                              )
                            })()}

                            {/* Label under hub circle */}
                            <text
                              y="38"
                              textAnchor="middle"
                              style={{
                                fontSize: "12px",
                                fontWeight: 800,
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                                fill: "#231C16"
                              }}
                            >
                              {cluster.title}
                            </text>
                            {/* Percentage under title */}
                            <text
                              y="52"
                              textAnchor="middle"
                              style={{
                                fontSize: "10.5px",
                                fontWeight: 600,
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                                fill: "#8E7E70"
                              }}
                            >
                              {cluster.progress}%
                            </text>
                          </motion.g>
                        </g>
                      )
                    })}

                    {/* ── CENTER ROOT NODE (TARGET GOAL) ── */}
                    <g transform={`translate(${centerPos.x}, ${centerPos.y})`}>
                      <motion.g
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 220,
                          damping: 18,
                          delay: 0.1
                        }}
                        style={{ cursor: "pointer" }}
                        onClick={() => showToast(`Target Career: ${currentUser.targetRoleName}`)}
                      >
                        {/* Radiant animated pulse aura */}
                        <motion.circle
                          r="52"
                          fill="none"
                          stroke="url(#centerRingGrad)"
                          strokeWidth="3.2"
                          strokeDasharray="6 4"
                          animate={{ rotate: 360, scale: [1, 1.06, 1], opacity: [0.65, 0.95, 0.65] }}
                          transition={{
                            rotate: { repeat: Infinity, duration: 24, ease: "linear" },
                            scale: { repeat: Infinity, duration: 4, ease: "easeInOut" },
                            opacity: { repeat: Infinity, duration: 4, ease: "easeInOut" }
                          }}
                        />

                        {/* Dark Badge Circle */}
                        <circle
                          r="43"
                          fill="#181B20"
                          stroke="#2D333B"
                          strokeWidth="2"
                          filter="url(#nodeShadow)"
                        />

                        {/* Brain Icon in glowing cyan */}
                        <g transform="translate(-11, -26)">
                          <Cpu size={22} color="#38BDF8" />
                        </g>

                        {/* Title: Role Name */}
                        <text
                          y="4"
                          textAnchor="middle"
                          style={{
                            fontSize: "11.5px",
                            fontWeight: 800,
                            fontFamily: "Plus Jakarta Sans, sans-serif",
                            fill: "#FFFFFF"
                          }}
                        >
                          {currentUser.targetRoleName}
                        </text>

                        {/* Subtitle: Progress */}
                        <text
                          y="19"
                          textAnchor="middle"
                          style={{
                            fontSize: "9px",
                            fontWeight: 600,
                            fontFamily: "Plus Jakarta Sans, sans-serif",
                            fill: "#94A3B8"
                          }}
                        >
                          {currentUser.overallProgress}% complete
                        </text>
                      </motion.g>
                    </g>
                  </svg>
                </div>
              </div>
            )}

            {/* ── ALL SKILLS TAB VIEW ── */}
            {activeFilterTab === "all-skills" && (
              <div className={styles.tabViewCard}>
                <div className={styles.tabViewHeader}>
                  <div>
                    <div className={styles.tabViewTitle}>
                      <Layers size={20} color="#D96B43" />
                      <span>All Target Skills & Action Items</span>
                    </div>
                    <div className={styles.tabViewSubtitle}>
                      Complete challenges, code arena problems, or tutor sessions to achieve 100% mastery.
                    </div>
                  </div>
                  <span className={styles.whatToDoBadgeTop}>
                    {graphData?.stats?.skillsLearned || "5 / 16"} Completed
                  </span>
                </div>

                <div className={styles.allSkillsGrid}>
                  {(graphData?.clusters || []).flatMap(c => c.subSkills.map(sub => ({ ...sub, clusterTitle: c.title, color: c.color }))).map(skill => (
                    <div
                      key={skill.id}
                      className={styles.skillItemCard}
                      onClick={() => setSelectedNode(skill)}
                    >
                      <div className={styles.skillCardTop}>
                        <div className={styles.skillCardTitleWrap}>
                          <div className={styles.skillCardIcon} style={{ background: `${skill.color}18`, color: skill.color }}>
                            <SkillIcon iconType={skill.glyph || "code"} size={16} color={skill.color} />
                          </div>
                          <div>
                            <div className={styles.skillCardTitle}>{skill.title}</div>
                            <div className={styles.skillCardCategory}>{skill.category || skill.clusterTitle}</div>
                          </div>
                        </div>
                        <span className={`${styles.skillStatusPill} ${
                          skill.status === "completed" ? styles.statusCompleted : skill.status === "locked" ? styles.statusLocked : styles.statusInProgress
                        }`}>
                          {skill.status}
                        </span>
                      </div>

                      <div className={styles.skillItemBarBg}>
                        <div
                          className={styles.skillItemBarFill}
                          style={{ width: `${skill.progress}%`, background: skill.color || "#10B981" }}
                        />
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#8E7E70" }}>{skill.progress}% Mastery</span>
                        <button
                          className={styles.whatToDoActionBtn}
                          style={{ padding: "5px 10px", fontSize: "0.75rem" }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedNode(skill)
                          }}
                        >
                          What To Do →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── LEARNING PATHS TAB VIEW ── */}
            {activeFilterTab === "learning-paths" && (
              <div className={styles.tabViewCard}>
                <div className={styles.tabViewHeader}>
                  <div>
                    <div className={styles.tabViewTitle}>
                      <Compass size={20} color="#3B82F6" />
                      <span>Curated {currentUser.targetRoleName} Pathway</span>
                    </div>
                    <div className={styles.tabViewSubtitle}>
                      Follow this {graphData?.clusters?.length || 5}-phase sequential roadmap to qualify for top engineering roles.
                    </div>
                  </div>
                </div>

                <div className={styles.pathwayContainer}>
                  {(graphData?.clusters && graphData.clusters.length > 0
                    ? graphData.clusters
                    : DEFAULT_AI_ENGINEER_GRAPH.clusters
                  ).map((cluster, idx) => {
                    const phaseNum = idx + 1
                    const subTitles = (cluster.subSkills || []).map(s => s.title)
                    const desc = `Master ${cluster.title} ${cluster.categoryTag ? `(${cluster.categoryTag})` : ''} and build proficiency in ${subTitles.join(', ')}.`

                    return (
                      <div key={cluster.id || phaseNum} className={styles.pathwayStageCard}>
                        <div className={styles.stageHeader}>
                          <div className={styles.stageNumberBadge}>{phaseNum}</div>
                          <div>
                            <div className={styles.stageTitle}>
                              Phase {phaseNum}: {cluster.title} {cluster.categoryTag ? `• ${cluster.categoryTag}` : ''}
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "#5C4D40", marginTop: 2 }}>{desc}</div>
                          </div>
                        </div>
                        <div className={styles.stageSkillsRow}>
                          {(cluster.subSkills || []).map(sub => (
                            <button
                              key={sub.id || sub.title}
                              className={styles.stageSkillChip}
                              onClick={() => {
                                setSelectedNode(sub)
                              }}
                            >
                              <span>{sub.title}</span>
                              <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 600 }}>
                                {sub.progress || 0}%
                              </span>
                              <ArrowRight size={12} color="#D96B43" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── CAREER FOCUS TAB VIEW ── */}
            {activeFilterTab === "career-focus" && (
              <div className={styles.tabViewCard}>
                <div className={styles.tabViewHeader}>
                  <div>
                    <div className={styles.tabViewTitle}>
                      <Target size={20} color="#10B981" />
                      <span>{currentUser.targetRoleName} Career Readiness</span>
                    </div>
                    <div className={styles.tabViewSubtitle}>
                      Industry benchmarks based on active tech job openings.
                    </div>
                  </div>
                  <span className={styles.whatToDoBadgeTop} style={{ background: "#E8F8EE", color: "#10B981" }}>
                    {currentUser.overallProgress}% Ready
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <p style={{ fontSize: "0.88rem", color: "#475569", lineHeight: 1.5, margin: 0 }}>
                    To qualify for tier-1 <strong>{currentUser.targetRoleName}</strong> positions, candidates must demonstrate production proficiency in both <strong>AI/LLM pipelines (RAG, Prompt Engineering)</strong> and <strong>production infrastructure (FastAPI, Docker, Microservices)</strong>.
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div style={{ padding: 16, background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0" }}>
                      <div style={{ fontSize: "0.84rem", fontWeight: 800, color: "#1E293B", marginBottom: 8 }}>✅ Strengths Acquired</div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.82rem", color: "#475569", lineHeight: 1.6 }}>
                        <li>Python Core & Data Structures (93% Mastery)</li>
                        <li>Pandas & Analytics Aggregations (88% Mastery)</li>
                        <li>Prompt Engineering & Compression (80% Mastery)</li>
                      </ul>
                    </div>

                    <div style={{ padding: 16, background: "#FFF7ED", borderRadius: 12, border: "1px solid #FFEDD5" }}>
                      <div style={{ fontSize: "0.84rem", fontWeight: 800, color: "#9A3412", marginBottom: 8 }}>⚡ High-Priority Gaps To Close</div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.82rem", color: "#7C2D12", lineHeight: 1.6 }}>
                        <li>FastAPI Rate Limiting (32% - Challenge ch-10 available)</li>
                        <li>Docker Image Optimization (22% - Challenge ch-8 available)</li>
                        <li>RAG Pipeline Vector Embeddings (41% - Challenge ch-5 available)</li>
                      </ul>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                    <button
                      className={styles.whatToDoActionBtn}
                      style={{ padding: "10px 18px", fontSize: "0.86rem" }}
                      onClick={() => {
                        showToast("Opening FastAPI Challenge: ch-10")
                        navigate("/challenges/ch-10")
                      }}
                    >
                      <span>Start Closing Gaps Now (FastAPI Challenge)</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

              {/* Bottom Milestone Banner */}
              <div className={styles.milestoneBanner}>
                <div className={styles.milestoneLeft}>
                  <div className={styles.milestoneIconWrap}>
                    <Cpu size={22} />
                  </div>
                  <div>
                    <div className={styles.milestoneTextTitle}>
                      Keep going, {currentUser.name.split(" ")[0]}!
                    </div>
                    <div className={styles.milestoneTextSub}>
                      You're <span className={styles.milestoneHighlight}>{currentUser.overallProgress}%</span> towards becoming an {currentUser.targetRoleName}. Complete more skills to unlock new opportunities.
                    </div>
                  </div>
                </div>

                <button
                  className={styles.learningPathBtn}
                  onClick={() => navigate("/career")}
                >
                  <span>View Learning Path</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════
                RIGHT RAIL CARDS
                ═══════════════════════════════════════════════════════ */}
            <div className={styles.rightRail}>
              {/* Card 1: Goal Hero Card */}
              <div
                className={styles.goalHeroCard}
                style={{
                  background: `linear-gradient(135deg, rgba(28, 31, 36, 0.94) 0%, rgba(18, 20, 23, 0.98) 100%), url(${careerMountainsAsset}) right bottom / cover no-repeat`
                }}
              >
                <div className={styles.goalHeroHeader}>
                  <div className={styles.goalHeroIcon}>
                    <Cpu size={20} />
                  </div>
                  <div>
                    <div className={styles.goalHeroTitle}>{currentUser.targetRoleName}</div>
                    <div className={styles.goalHeroSubtitle}>Current Goal 🎯</div>
                  </div>
                </div>

                <div className={styles.goalHeroBody}>
                  {/* Circular Donut Gauge */}
                  <div className={styles.goalDonutWrap}>
                    <svg className={styles.goalDonutSvg}>
                      <circle
                        cx="39"
                        cy="39"
                        r="32"
                        stroke="rgba(255,255,255,0.12)"
                        strokeWidth="5"
                        fill="transparent"
                      />
                      <circle
                        cx="39"
                        cy="39"
                        r="32"
                        stroke="#F97316"
                        strokeWidth="5"
                        strokeDasharray={2 * Math.PI * 32}
                        strokeDashoffset={2 * Math.PI * 32 * (1 - currentUser.overallProgress / 100)}
                        strokeLinecap="round"
                        fill="transparent"
                        style={{ transition: "stroke-dashoffset 1s ease" }}
                      />
                    </svg>
                    <div className={styles.goalDonutText}>{currentUser.overallProgress}%</div>
                  </div>

                  {/* Goal Metrics */}
                  <div className={styles.goalMetrics}>
                    <div className={styles.goalMetricRow}>
                      <span className={styles.goalMetricLabel}>Skills Learned</span>
                      <span className={styles.goalMetricVal}>
                        {graphData?.stats?.skillsLearned || "12 / 18"}
                      </span>
                    </div>
                    <div className={styles.goalMetricRow}>
                      <span className={styles.goalMetricLabel}>Projects Completed</span>
                      <span className={styles.goalMetricVal}>
                        {graphData?.stats?.projectsCompleted || "2 / 5"}
                      </span>
                    </div>
                    <div className={styles.goalMetricRow}>
                      <span className={styles.goalMetricLabel}>Time Spent</span>
                      <span className={styles.goalMetricVal}>
                        {graphData?.stats?.timeSpent || "42h 30m"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Skill Progress */}
              <div className={styles.railCard}>
                <div className={styles.railCardHeader}>
                  <div className={styles.railCardTitle}>
                    <BarChart2 size={18} color="#D96B43" />
                    <span>Skill Progress</span>
                  </div>
                  <span className={styles.railCardLink} onClick={() => navigate("/career")}>
                    View All →
                  </span>
                </div>

                <div className={styles.skillProgressList}>
                  {(graphData?.skillProgress || []).map((sk) => (
                    <div
                      key={sk.name}
                      className={styles.skillProgressItem}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        const foundSub = graphData?.clusters?.flatMap(c => c.subSkills).find(s => s.title.toLowerCase() === sk.name.toLowerCase())
                        const foundCluster = graphData?.clusters?.find(c => c.title.toLowerCase() === sk.name.toLowerCase())
                        setSelectedNode(foundSub || foundCluster || {
                          title: sk.name,
                          progress: sk.progress,
                          themeColor: sk.color,
                          icon: sk.icon,
                          category: "Core Competency"
                        })
                      }}
                    >
                      <div className={styles.skillItemTop}>
                        <div className={styles.skillItemNameWrap}>
                          <div className={styles.skillItemIcon} style={{ background: `${sk.color}18`, color: sk.color }}>
                            <SkillIcon iconType={sk.icon} size={14} color={sk.color} />
                          </div>
                          <span>{sk.name}</span>
                        </div>
                        <span className={styles.skillItemPercent}>{sk.progress}%</span>
                      </div>
                      <div className={styles.skillItemBarBg}>
                        <div
                          className={styles.skillItemBarFill}
                          style={{
                            width: `${sk.progress}%`,
                            background: sk.color || "#10B981"
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Next Recommended Skills */}
              <div className={styles.railCard}>
                <div className={styles.railCardHeader}>
                  <div className={styles.railCardTitle}>
                    <Lightbulb size={18} color="#F59E0B" />
                    <span>Next Recommended Skills</span>
                  </div>
                  <span className={styles.railCardLink} onClick={() => navigate("/career")}>
                    View All →
                  </span>
                </div>

                <div className={styles.recSkillsList}>
                  {(graphData?.recommendedSkills || []).map((rec) => (
                    <div
                      key={rec.rank}
                      className={styles.recSkillItem}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        const foundSub = graphData?.clusters?.flatMap(c => c.subSkills).find(s => s.title.toLowerCase() === rec.name.toLowerCase())
                        setSelectedNode(foundSub || {
                          title: rec.name,
                          progress: 30,
                          category: rec.category || "Recommended Benchmark",
                          themeColor: "#F59E0B",
                          icon: "zap",
                          whatToDo: rec.tasks || [
                            {
                              id: "rec-ch",
                              type: rec.actionType || "challenge",
                              title: rec.taskTitle ? `Solve Challenge: ${rec.taskTitle}` : `Master ${rec.name}`,
                              desc: rec.reason,
                              url: rec.actionUrl || `/challenges`,
                              badge: `${rec.xp || 75} XP • Recommended`,
                              actionLabel: rec.actionLabel || "Start Challenge →"
                            },
                            {
                              id: "rec-tutor",
                              type: "tutor",
                              title: `Practice with AI Tutor: ${rec.name}`,
                              desc: `Interactive coaching and architectural trade-offs for ${rec.name}.`,
                              url: `/ai-tutor?topic=${encodeURIComponent(rec.name)}`,
                              badge: "AI Coaching",
                              actionLabel: "Ask AI Tutor →"
                            },
                            {
                              id: "rec-quiz",
                              type: "quiz",
                              title: `${rec.name} Benchmark Quiz`,
                              desc: `Take a 10-question evaluation to unlock new skills.`,
                              url: `/quizzes?topic=${encodeURIComponent(rec.name.toLowerCase())}`,
                              badge: "Skill Quiz",
                              actionLabel: "Take Quiz →"
                            }
                          ]
                        })
                      }}
                    >
                      <div className={styles.recSkillLeft}>
                        <span className={styles.recSkillRank}>{rec.rank}</span>
                        <div className={styles.recSkillInfo}>
                          <span className={styles.recSkillName}>{rec.name}</span>
                          <span className={styles.recSkillDesc}>{rec.reason}</span>
                        </div>
                      </div>

                      <button
                        className={styles.recSkillStartBtn}
                        onClick={(e) => {
                          e.stopPropagation()
                          const targetUrl = rec.actionUrl || `/challenges`
                          const label = rec.taskTitle ? `${rec.name} - ${rec.taskTitle}` : rec.name
                          showToast(`Launching ${label}`)
                          navigate(targetUrl)
                        }}
                      >
                        <span>Start</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 4: Inspiration Quote Card */}
              <div
                className={styles.quoteCard}
                style={{
                  background: `#FAF3EA url(${careerMountainsAsset}) right bottom / 140px auto no-repeat`
                }}
              >
                <div className={styles.quoteText}>
                  "{graphData?.quote?.text || "Small steps every day lead to big results."}"
                </div>
                <div className={styles.quoteAuthor}>
                  — {graphData?.quote?.author || "REXION"}
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </main>

      {/* ═════════════════════════════════════════════════════════
          NODE DRILLDOWN MODAL ("WHAT TO DO" ACTION HUB)
          ═════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedNode && (
          <div className={styles.nodeModalOverlay} onClick={() => setSelectedNode(null)}>
            <motion.div
              className={styles.nodeModalCard}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.nodeModalClose} onClick={() => setSelectedNode(null)}>
                ✕
              </button>

              <div className={styles.nodeModalHeader}>
                <div
                  className={styles.nodeModalIcon}
                  style={{
                    background: `${selectedNode.themeColor || selectedNode.color || "#D96B43"}18`,
                    color: selectedNode.themeColor || selectedNode.color || "#D96B43"
                  }}
                >
                  <SkillIcon iconType={selectedNode.icon || "code"} size={24} color={selectedNode.themeColor || selectedNode.color || "#D96B43"} />
                </div>
                <div>
                  <div className={styles.nodeModalTitle}>{selectedNode.title}</div>
                  <div className={styles.nodeModalCategory}>
                    {selectedNode.category || "Skill Module"} • Status:{" "}
                    <span style={{
                      color: selectedNode.status === "completed" ? "#10B981" : selectedNode.status === "locked" ? "#94A3B8" : "#E27D60",
                      fontWeight: 700,
                      textTransform: "capitalize"
                    }}>
                      {selectedNode.status || "In Progress"}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.nodeModalBarWrap}>
                <div className={styles.nodeModalBarTop}>
                  <span>Current Mastery</span>
                  <span>{selectedNode.progress || 50}%</span>
                </div>
                <div className={styles.skillItemBarBg}>
                  <div
                    className={styles.skillItemBarFill}
                    style={{
                      width: `${selectedNode.progress || 50}%`,
                      background: selectedNode.themeColor || selectedNode.color || "#D96B43"
                    }}
                  />
                </div>
              </div>

              {/* What To Do Next Action Section */}
              <div className={styles.whatToDoSection}>
                <div className={styles.whatToDoHeader}>
                  <span className={styles.whatToDoTitleText}>
                    <Sparkles size={16} color="#D96B43" />
                    What You Need To Do
                  </span>
                  <span className={styles.whatToDoBadgeTop}>
                    {selectedNode.status === "completed" ? "Mastered ✓" : "Action Checklist"}
                  </span>
                </div>

                <div className={styles.whatToDoList}>
                  {(() => {
                    let tasks = selectedNode.whatToDo || []
                    if ((!tasks || tasks.length === 0) && selectedNode.subSkills) {
                      tasks = selectedNode.subSkills.flatMap(s => s.whatToDo || []).slice(0, 4)
                    }
                    if (!tasks || tasks.length === 0) {
                      tasks = [
                        {
                          id: 'task-fb-ch',
                          type: 'challenge',
                          title: `Solve ${selectedNode.title} Challenge`,
                          desc: `Production challenge testing implementation and edge cases.`,
                          url: `/challenges`,
                          badge: '100 XP • Challenge',
                          actionLabel: 'Solve Challenge →'
                        },
                        {
                          id: 'task-fb-tutor',
                          type: 'tutor',
                          title: `Practice with AI Tutor: ${selectedNode.title}`,
                          desc: `Interactive architectural explanation and live code review.`,
                          url: `/ai-tutor?topic=${encodeURIComponent(selectedNode.title)}`,
                          badge: 'AI Coaching',
                          actionLabel: 'Ask AI Tutor →'
                        },
                        {
                          id: 'task-fb-quiz',
                          type: 'quiz',
                          title: `${selectedNode.title} Assessment Quiz`,
                          desc: `Benchmark your retention and unlock advanced tracks.`,
                          url: `/quizzes?topic=${encodeURIComponent(selectedNode.title.toLowerCase())}`,
                          badge: 'Skill Quiz',
                          actionLabel: 'Take Quiz →'
                        }
                      ]
                    }

                    return tasks.map(task => {
                      const isChallenge = task.type === 'challenge'
                      const isTutor = task.type === 'tutor'
                      const isArena = task.type === 'arena'

                      return (
                        <div key={task.id || task.title} className={styles.whatToDoItem}>
                          <div className={styles.whatToDoLeft}>
                            <div className={styles.whatToDoIconBox}>
                              {isChallenge && <Code2 size={18} color="#D96B43" />}
                              {isTutor && <Bot size={18} color="#3B82F6" />}
                              {isArena && <Terminal size={18} color="#10B981" />}
                              {!isChallenge && !isTutor && !isArena && <Flame size={18} color="#F59E0B" />}
                            </div>
                            <div className={styles.whatToDoDetails}>
                              <span className={styles.whatToDoTaskTitle}>{task.title}</span>
                              <span className={styles.whatToDoTaskDesc}>{task.desc}</span>
                              {task.badge && (
                                <span className={styles.whatToDoTaskBadge}>{task.badge}</span>
                              )}
                            </div>
                          </div>

                          <button
                            className={styles.whatToDoActionBtn}
                            onClick={() => {
                              setSelectedNode(null)
                              showToast(`Launching ${task.title}`)
                              navigate(task.url)
                            }}
                          >
                            <span>{task.actionLabel || "Start →"}</span>
                          </button>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>

              <div className={styles.nodeModalActions}>
                <button
                  className={styles.nodeModalBtnPrimary}
                  onClick={() => {
                    const primaryUrl = selectedNode.primaryAction?.url || `/challenges`
                    setSelectedNode(null)
                    navigate(primaryUrl)
                  }}
                >
                  {selectedNode.primaryAction?.label || "Launch Recommended Task →"}
                </button>
                <button
                  className={styles.nodeModalBtnSecondary}
                  onClick={() => {
                    setSelectedNode(null)
                    navigate("/career")
                  }}
                >
                  Career Roadmap
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Career Track Selection Modal */}
      <CareerTrackModal
        isOpen={journeyModalOpen}
        onClose={() => setJourneyModalOpen(false)}
        currentRoleTitle={currentUser.targetRoleName}
        onRoleSelected={(track, customGraph) => {
          handleSelectRole(track.id, track.title, customGraph)
        }}
      />
    </div>
  )
}
