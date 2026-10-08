import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import { GEMINI_API_KEY, GEMINI_TEXT_MODEL, OPENAI_API_KEY } from '../config/env.js'
import SkillGraph from '../models/SkillGraph.js'

const geminiClient = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null
const openaiClient = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null

/**
 * Curated production graphs for standard industry tracks
 */
export const CURATED_ROLE_GRAPHS = {
  'agentic-ai': {
    roleId: 'agentic-ai',
    roleName: 'Agentic AI Engineer',
    domain: 'ai',
    isAIGenerated: false,
    centerNode: {
      id: 'center-goal',
      title: 'Agentic AI Engineer',
      subtitle: '0% complete',
      icon: 'zap',
      status: 'in-progress'
    },
    clusters: [
      {
        id: 'cluster-agent-core',
        title: 'Agent Core',
        categoryTag: 'Architecture',
        color: '#10B981',
        theme: 'green',
        icon: 'brain',
        subSkills: [
          {
            id: 'sub-autonomous-agents',
            title: 'Autonomous Agents',
            glyph: 'sparkles',
            category: 'Architecture',
            primaryAction: {
              type: 'tutor',
              title: 'Autonomous Agent Loops & ReAct',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Autonomous AI Agents ReAct Loops and Task Decomposition'
            },
            whatToDo: [
              {
                id: 'task-tutor-agents',
                type: 'tutor',
                title: 'Practice with AI Tutor: Agent Loops',
                desc: 'Explore ReAct, Plan-and-Solve, and dynamic tool selection architectures.',
                url: '/ai-tutor?topic=Autonomous AI Agents ReAct Loops and Task Decomposition',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              },
              {
                id: 'task-quiz-agents',
                type: 'quiz',
                title: 'AI & Agentic Systems Quiz',
                desc: 'Assess your understanding of agentic decision loops, memory, and reflection.',
                url: '/quizzes?topic=ai-llms',
                badge: 'Skill Quiz',
                actionLabel: 'Take Quiz →'
              }
            ]
          },
          {
            id: 'sub-tool-calling',
            title: 'Tool Calling & APIs',
            glyph: 'code',
            category: 'Architecture',
            primaryAction: {
              type: 'challenge',
              title: 'API Rate Limiting Shield',
              label: 'Solve Challenge',
              url: '/challenges/ch-10'
            },
            whatToDo: [
              {
                id: 'task-ch-10-agent',
                type: 'challenge',
                title: 'Solve Challenge: API Rate Limiting Shield',
                desc: 'Ensure agents handle API throttles, exponential backoff, and retry budgets.',
                url: '/challenges/ch-10',
                badge: '100 XP • Production',
                actionLabel: 'Solve Challenge →'
              },
              {
                id: 'task-tutor-tools',
                type: 'tutor',
                title: 'Practice with AI Tutor: Function Calling',
                desc: 'Learn JSON Schema tool declarations, parallel tool calls, and error recovery.',
                url: '/ai-tutor?topic=LLM Function Calling and JSON Schema Tool Validation',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          },
          {
            id: 'sub-prompt-eng-agent',
            title: 'System Prompts',
            glyph: 'sparkles',
            category: 'Architecture',
            primaryAction: {
              type: 'challenge',
              title: 'Semantic Prompt Compressor',
              label: 'Solve Challenge',
              url: '/challenges/ch-12'
            },
            whatToDo: [
              {
                id: 'task-ch-12-agent',
                type: 'challenge',
                title: 'Solve Challenge: Semantic Prompt Compressor',
                desc: 'Optimize agent instructions and context windows while preserving intent.',
                url: '/challenges/ch-12',
                badge: '100 XP • Medium',
                actionLabel: 'Solve Challenge →'
              }
            ]
          }
        ]
      },
      {
        id: 'cluster-frameworks',
        title: 'Orchestration',
        categoryTag: 'LangGraph & CrewAI',
        color: '#0284C7',
        theme: 'blue',
        icon: 'network',
        subSkills: [
          {
            id: 'sub-langgraph',
            title: 'LangGraph & State',
            glyph: 'check',
            category: 'Orchestration',
            primaryAction: {
              type: 'tutor',
              title: 'LangGraph State Graphs & Cycles',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=LangGraph State Graphs Cyclic Agent Workflows and Checkpointers'
            },
            whatToDo: [
              {
                id: 'task-tutor-langgraph',
                type: 'tutor',
                title: 'Practice with AI Tutor: LangGraph',
                desc: 'Design cyclic agent graphs with state persistence, time-travel, and human-in-the-loop.',
                url: '/ai-tutor?topic=LangGraph State Graphs Cyclic Agent Workflows and Checkpointers',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          },
          {
            id: 'sub-multi-agent',
            title: 'Multi-Agent Teams',
            glyph: 'layers',
            category: 'Orchestration',
            primaryAction: {
              type: 'challenge',
              title: 'Microservice Event Bus',
              label: 'Solve Challenge',
              url: '/challenges/ch-6'
            },
            whatToDo: [
              {
                id: 'task-ch-6-agent',
                type: 'challenge',
                title: 'Solve Challenge: Microservice Event Bus',
                desc: 'Build asynchronous event routing between hierarchical agent nodes.',
                url: '/challenges/ch-6',
                badge: '125 XP • Hard',
                actionLabel: 'Solve Challenge →'
              }
            ]
          }
        ]
      },
      {
        id: 'cluster-mcp',
        title: 'MCP & Protocols',
        categoryTag: 'Context Protocol',
        color: '#F59E0B',
        theme: 'amber',
        icon: 'layers',
        subSkills: [
          {
            id: 'sub-mcp-protocol',
            title: 'Model Context Protocol',
            glyph: 'layers',
            category: 'Protocols',
            primaryAction: {
              type: 'tutor',
              title: 'Anthropic Model Context Protocol (MCP)',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Anthropic Model Context Protocol MCP Servers Tools and Resources'
            },
            whatToDo: [
              {
                id: 'task-tutor-mcp',
                type: 'tutor',
                title: 'Practice with AI Tutor: MCP Architecture',
                desc: 'Build custom MCP servers providing dynamic tools, prompt templates, and resource URI schemas.',
                url: '/ai-tutor?topic=Anthropic Model Context Protocol MCP Servers Tools and Resources',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          },
          {
            id: 'sub-rag-agent',
            title: 'RAG & Memory',
            glyph: 'rag',
            category: 'Protocols',
            primaryAction: {
              type: 'challenge',
              title: 'RAG Pipeline & Embeddings',
              label: 'Solve Challenge',
              url: '/challenges/ch-5'
            },
            whatToDo: [
              {
                id: 'task-ch-5-agent',
                type: 'challenge',
                title: 'Solve Challenge: RAG Pipeline & Embeddings',
                desc: 'Build vector retrieval, chunking, and semantic re-ranking for long-term agent memory.',
                url: '/challenges/ch-5',
                badge: '100 XP • Production',
                actionLabel: 'Solve Challenge →'
              }
            ]
          }
        ]
      },
      {
        id: 'cluster-infra-agent',
        title: 'Infrastructure',
        categoryTag: 'FastAPI & Docker',
        color: '#EC4899',
        theme: 'pink',
        icon: 'server',
        subSkills: [
          {
            id: 'sub-fastapi-agent',
            title: 'FastAPI & Streaming',
            glyph: 'zap',
            category: 'Infrastructure',
            primaryAction: {
              type: 'tutor',
              title: 'FastAPI Server-Sent Events Streaming',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=FastAPI Async Endpoints Server Sent Events SSE Token Streaming'
            },
            whatToDo: [
              {
                id: 'task-tutor-sse',
                type: 'tutor',
                title: 'Practice with AI Tutor: Token Streaming',
                desc: 'Stream agent thinking tokens, tool call events, and partial responses via SSE.',
                url: '/ai-tutor?topic=FastAPI Async Endpoints Server Sent Events SSE Token Streaming',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          },
          {
            id: 'sub-docker-agent',
            title: 'Docker Sandboxes',
            glyph: 'layers',
            category: 'Infrastructure',
            primaryAction: {
              type: 'challenge',
              title: 'Dockerfile Optimization',
              label: 'Solve Challenge',
              url: '/challenges/ch-8'
            },
            whatToDo: [
              {
                id: 'task-ch-8-agent',
                type: 'challenge',
                title: 'Solve Challenge: Dockerfile Optimization',
                desc: 'Containerize isolated sandbox environments for safe untrusted agent code execution.',
                url: '/challenges/ch-8',
                badge: '75 XP • Medium',
                actionLabel: 'Solve Challenge →'
              }
            ]
          }
        ]
      },
      {
        id: 'cluster-eval-agent',
        title: 'Evals & Safety',
        categoryTag: 'Guardrails & Tracing',
        color: '#8B5CF6',
        theme: 'purple',
        icon: 'terminal',
        subSkills: [
          {
            id: 'sub-evals',
            title: 'Agent Evals & Tracing',
            glyph: 'terminal',
            category: 'Safety',
            primaryAction: {
              type: 'tutor',
              title: 'Langfuse & Agent Tracing',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Langfuse Tracing Agent Evaluation and Latency Benchmarks'
            },
            whatToDo: [
              {
                id: 'task-tutor-tracing',
                type: 'tutor',
                title: 'Practice with AI Tutor: Tracing & Evals',
                desc: 'Trace multi-step LLM call trees, token costs, latency spikes, and evaluation datasets.',
                url: '/ai-tutor?topic=Langfuse Tracing Agent Evaluation and Latency Benchmarks',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          },
          {
            id: 'sub-guardrails',
            title: 'Safety Guardrails',
            glyph: 'lock',
            category: 'Safety',
            primaryAction: {
              type: 'tutor',
              title: 'Prompt Injection Defense & Guardrails',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Prompt Injection Defense Guardrails and Safe Agent Sandboxing'
            },
            whatToDo: [
              {
                id: 'task-tutor-guard',
                type: 'tutor',
                title: 'Practice with AI Tutor: Guardrails',
                desc: 'Prevent prompt injection, implement output schemas, and enforce human approval gates.',
                url: '/ai-tutor?topic=Prompt Injection Defense Guardrails and Safe Agent Sandboxing',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          }
        ]
      }
    ],
    recommendedSkills: [
      {
        rank: 1,
        name: 'LangGraph',
        reason: 'Leading framework for cyclic agent state machines',
        actionType: 'tutor',
        actionUrl: '/ai-tutor?topic=LangGraph State Graphs Cyclic Agent Workflows and Checkpointers',
        actionLabel: 'Learn with AI',
        taskTitle: 'LangGraph State Graphs',
        category: 'Orchestration',
        xp: 90
      },
      {
        rank: 2,
        name: 'Model Context Protocol',
        reason: 'Standard protocol for enterprise agent tool integration',
        actionType: 'tutor',
        actionUrl: '/ai-tutor?topic=Anthropic Model Context Protocol MCP Servers Tools and Resources',
        actionLabel: 'Learn with AI',
        taskTitle: 'MCP Server Development',
        category: 'Protocols',
        xp: 85
      },
      {
        rank: 3,
        name: 'API Rate Limiting',
        reason: 'Essential for robust tool-calling agents',
        actionType: 'challenge',
        actionUrl: '/challenges/ch-10',
        actionLabel: 'Solve Challenge',
        taskTitle: 'API Rate Limiting Shield',
        category: 'Backend',
        xp: 100
      },
      {
        rank: 4,
        name: 'Agent Evaluation',
        reason: 'Production agents require rigorous benchmark testing',
        actionType: 'tutor',
        actionUrl: '/ai-tutor?topic=Langfuse Tracing Agent Evaluation and Latency Benchmarks',
        actionLabel: 'Learn with AI',
        taskTitle: 'Agent Observability & Evals',
        category: 'Safety',
        xp: 75
      }
    ],
    quote: {
      text: 'The true power of AI is not in answering questions, but in taking action.',
      author: 'REXION Agentic Labs'
    }
  },
  'data-analyst': {
    roleId: 'data-analyst',
    roleName: 'Data Scientist & Analyst',
    domain: 'data-science',
    isAIGenerated: false,
    centerNode: {
      id: 'center-goal',
      title: 'Data Scientist',
      subtitle: '0% complete',
      icon: 'database',
      status: 'in-progress'
    },
    clusters: [
      {
        id: 'cluster-stats',
        title: 'Statistics',
        categoryTag: 'Math & Stats',
        color: '#10B981',
        theme: 'green',
        icon: 'network',
        subSkills: [
          {
            id: 'sub-prob',
            title: 'Probability',
            glyph: 'code',
            category: 'Math & Stats',
            primaryAction: {
              type: 'tutor',
              title: 'Probability Distributions & Bayes Theorem',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Probability Distributions Bayes Theorem and Normal Distributions'
            },
            whatToDo: [
              {
                id: 'task-tutor-prob',
                type: 'tutor',
                title: 'Practice with AI Tutor: Probability',
                desc: 'Master conditional probability, binomial & Poisson distributions, and Bayes Theorem.',
                url: '/ai-tutor?topic=Probability Distributions Bayes Theorem and Normal Distributions',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              },
              {
                id: 'task-quiz-stats',
                type: 'quiz',
                title: 'Statistics & Probability Assessment',
                desc: 'Test your understanding of variance, standard deviation, and p-values.',
                url: '/quizzes?topic=data-analysis',
                badge: 'Skill Quiz',
                actionLabel: 'Take Quiz →'
              }
            ]
          },
          {
            id: 'sub-hypo',
            title: 'Hypothesis Testing',
            glyph: 'check',
            category: 'Math & Stats',
            primaryAction: {
              type: 'tutor',
              title: 'A/B Testing & Hypothesis Testing',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Hypothesis Testing AB Testing T-tests and ANOVA'
            },
            whatToDo: [
              {
                id: 'task-tutor-hypo',
                type: 'tutor',
                title: 'Practice with AI Tutor: A/B Testing',
                desc: 'Learn Z-tests, Student T-tests, Type I/II errors, and sample sizing.',
                url: '/ai-tutor?topic=Hypothesis Testing AB Testing T-tests and ANOVA',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          },
          {
            id: 'sub-lin-alg',
            title: 'Linear Algebra',
            glyph: 'cube',
            category: 'Math & Stats',
            primaryAction: {
              type: 'tutor',
              title: 'Matrices & Eigenvalues',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Linear Algebra Matrix Multiplication Eigenvalues PCA'
            },
            whatToDo: [
              {
                id: 'task-tutor-linalg',
                type: 'tutor',
                title: 'Practice with AI Tutor: Linear Algebra',
                desc: 'Understand matrix transformations, rank, dot products, and PCA.',
                url: '/ai-tutor?topic=Linear Algebra Matrix Multiplication Eigenvalues PCA',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          }
        ]
      },
      {
        id: 'cluster-wrangling',
        title: 'Data Analysis',
        categoryTag: 'Wrangling & SQL',
        color: '#0284C7',
        theme: 'blue',
        icon: 'table',
        subSkills: [
          {
            id: 'sub-pandas',
            title: 'Pandas',
            glyph: 'table',
            category: 'Data Wrangling',
            primaryAction: {
              type: 'challenge',
              title: 'Sales Analytics Aggregation',
              label: 'Solve Challenge',
              url: '/challenges/ch-7'
            },
            whatToDo: [
              {
                id: 'task-ch-7-ds',
                type: 'challenge',
                title: 'Solve Challenge: Sales Analytics Aggregation',
                desc: 'Compute monthly growth, cohort retention, and top customer groups with Pandas.',
                url: '/challenges/ch-7',
                badge: '100 XP • Production',
                actionLabel: 'Solve Challenge →'
              },
              {
                id: 'task-quiz-pandas',
                type: 'quiz',
                title: 'Pandas & Data Wrangling Quiz',
                desc: 'Benchmark your indexing, groupby, merge, and pivot_table skills.',
                url: '/quizzes?topic=data-analysis',
                badge: 'Skill Quiz',
                actionLabel: 'Take Quiz →'
              },
              {
                id: 'task-tutor-pandas-ds',
                type: 'tutor',
                title: 'Practice with AI Tutor: Pandas',
                desc: 'Ask AI Tutor how to optimize vectorization and memory usage in large DataFrames.',
                url: '/ai-tutor?topic=Pandas DataFrame Vectorization and Memory Optimization',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          },
          {
            id: 'sub-sql-ds',
            title: 'SQL & Queries',
            glyph: 'check',
            category: 'Data Wrangling',
            primaryAction: {
              type: 'challenge',
              title: 'SQL Query Aggregator',
              label: 'Solve Challenge',
              url: '/challenges/ch-4'
            },
            whatToDo: [
              {
                id: 'task-ch-4-ds',
                type: 'challenge',
                title: 'Solve Challenge: SQL Query Aggregator',
                desc: 'Write high-performance window functions, subqueries, and grouping sets.',
                url: '/challenges/ch-4',
                badge: '80 XP • Medium',
                actionLabel: 'Solve Challenge →'
              },
              {
                id: 'task-arena-sql',
                type: 'arena',
                title: 'Practice SQL in Code Arena',
                desc: 'Solve database query challenges and query optimization katas.',
                url: '/code-arena',
                badge: 'Code Arena',
                actionLabel: 'Enter Arena →'
              }
            ]
          },
          {
            id: 'sub-numpy-ds',
            title: 'NumPy',
            glyph: 'cube',
            category: 'Data Wrangling',
            primaryAction: {
              type: 'tutor',
              title: 'NumPy Vectorized Arrays',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=NumPy Array Broadcasting and Vectorized Operations'
            },
            whatToDo: [
              {
                id: 'task-tutor-numpy-ds',
                type: 'tutor',
                title: 'Practice with AI Tutor: NumPy',
                desc: 'Master broadcasting, strides, views, and numerical performance.',
                url: '/ai-tutor?topic=NumPy Array Broadcasting and Vectorized Operations',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          }
        ]
      },
      {
        id: 'cluster-ml-ds',
        title: 'Machine Learning',
        categoryTag: 'Modeling',
        color: '#F59E0B',
        theme: 'amber',
        icon: 'brain',
        subSkills: [
          {
            id: 'sub-sklearn',
            title: 'Scikit-Learn',
            glyph: 'code',
            category: 'Machine Learning',
            primaryAction: {
              type: 'tutor',
              title: 'Regression & Classification Models',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Scikit-Learn Regression Classification and Pipelines'
            },
            whatToDo: [
              {
                id: 'task-tutor-sklearn',
                type: 'tutor',
                title: 'Practice with AI Tutor: Scikit-Learn',
                desc: 'Implement Random Forests, Logistic Regression, cross-validation, and pipelines.',
                url: '/ai-tutor?topic=Scikit-Learn Regression Classification and Pipelines',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              },
              {
                id: 'task-quiz-ml-ds',
                type: 'quiz',
                title: 'Machine Learning Concepts Quiz',
                desc: 'Test your understanding of bias-variance tradeoff, ROC-AUC, and precision-recall.',
                url: '/quizzes?topic=machine-learning',
                badge: 'Skill Quiz',
                actionLabel: 'Take Quiz →'
              }
            ]
          },
          {
            id: 'sub-feature-eng',
            title: 'Feature Eng',
            glyph: 'sparkles',
            category: 'Machine Learning',
            primaryAction: {
              type: 'tutor',
              title: 'Feature Engineering & Scaling',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Feature Engineering One-Hot Encoding and Outlier Handling'
            },
            whatToDo: [
              {
                id: 'task-tutor-fe',
                type: 'tutor',
                title: 'Practice with AI Tutor: Feature Engineering',
                desc: 'Master target encoding, scaling, imputing missing values, and dimensionality reduction.',
                url: '/ai-tutor?topic=Feature Engineering One-Hot Encoding and Outlier Handling',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          },
          {
            id: 'sub-deep-learning-ds',
            title: 'Deep Learning',
            glyph: 'lock',
            category: 'Machine Learning',
            primaryAction: {
              type: 'tutor',
              title: 'Neural Networks & PyTorch',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=PyTorch Neural Networks and Backpropagation'
            },
            whatToDo: [
              {
                id: 'task-tutor-dl-ds',
                type: 'tutor',
                title: 'Practice with AI Tutor: Neural Networks',
                desc: 'Explore forward/backward propagation, activation functions, and training loops.',
                url: '/ai-tutor?topic=PyTorch Neural Networks and Backpropagation',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          }
        ]
      },
      {
        id: 'cluster-viz',
        title: 'Visualization',
        categoryTag: 'BI & Storytelling',
        color: '#EC4899',
        theme: 'pink',
        icon: 'sparkles',
        subSkills: [
          {
            id: 'sub-powerbi',
            title: 'Power BI',
            glyph: 'table',
            category: 'Visualization',
            primaryAction: {
              type: 'tutor',
              title: 'DAX & Dashboard Design',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Power BI DAX Measures Data Modeling and Dashboards'
            },
            whatToDo: [
              {
                id: 'task-tutor-pbi',
                type: 'tutor',
                title: 'Practice with AI Tutor: Power BI & DAX',
                desc: 'Build automated interactive dashboards, star schemas, and calculate DAX measures.',
                url: '/ai-tutor?topic=Power BI DAX Measures Data Modeling and Dashboards',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          },
          {
            id: 'sub-tableau',
            title: 'Tableau',
            glyph: 'sparkles',
            category: 'Visualization',
            primaryAction: {
              type: 'tutor',
              title: 'Tableau Visual Analytics',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Tableau Visual Analytics LOD Expressions and Storyboards'
            },
            whatToDo: [
              {
                id: 'task-tutor-tab',
                type: 'tutor',
                title: 'Practice with AI Tutor: Tableau',
                desc: 'Design executive storyboards, Level of Detail (LOD) calculations, and visual charts.',
                url: '/ai-tutor?topic=Tableau Visual Analytics LOD Expressions and Storyboards',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          },
          {
            id: 'sub-matplotlib',
            title: 'Matplotlib',
            glyph: 'code',
            category: 'Visualization',
            primaryAction: {
              type: 'tutor',
              title: 'Seaborn & Matplotlib Customization',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Matplotlib and Seaborn Statistical Plots'
            },
            whatToDo: [
              {
                id: 'task-tutor-sns',
                type: 'tutor',
                title: 'Practice with AI Tutor: Statistical Plots',
                desc: 'Create publication-ready heatmaps, distribution plots, and subplots.',
                url: '/ai-tutor?topic=Matplotlib and Seaborn Statistical Plots',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          }
        ]
      },
      {
        id: 'cluster-bigdata',
        title: 'Big Data',
        categoryTag: 'Pipelines & Cloud',
        color: '#8B5CF6',
        theme: 'purple',
        icon: 'cloud',
        subSkills: [
          {
            id: 'sub-etl',
            title: 'ETL Pipelines',
            glyph: 'layers',
            category: 'Data Engineering',
            primaryAction: {
              type: 'tutor',
              title: 'Airflow & Automated Pipelines',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Apache Airflow DAGs and ETL Pipelines'
            },
            whatToDo: [
              {
                id: 'task-tutor-etl',
                type: 'tutor',
                title: 'Practice with AI Tutor: ETL Pipelines',
                desc: 'Design fault-tolerant DAGs, schedule ingestion jobs, and handle data validation.',
                url: '/ai-tutor?topic=Apache Airflow DAGs and ETL Pipelines',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          },
          {
            id: 'sub-spark',
            title: 'Apache Spark',
            glyph: 'zap',
            category: 'Data Engineering',
            primaryAction: {
              type: 'tutor',
              title: 'PySpark & Distributed Compute',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=PySpark Distributed DataFrames and Spark SQL'
            },
            whatToDo: [
              {
                id: 'task-tutor-spark',
                type: 'tutor',
                title: 'Practice with AI Tutor: PySpark',
                desc: 'Process terabyte-scale datasets with distributed partitions and Spark SQL.',
                url: '/ai-tutor?topic=PySpark Distributed DataFrames and Spark SQL',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          },
          {
            id: 'sub-warehouse',
            title: 'Data Warehouses',
            glyph: 'lock',
            category: 'Data Engineering',
            primaryAction: {
              type: 'tutor',
              title: 'Snowflake & BigQuery Optimization',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Snowflake BigQuery Partitioning and Columnar Storage'
            },
            whatToDo: [
              {
                id: 'task-tutor-wh',
                type: 'tutor',
                title: 'Practice with AI Tutor: Data Warehousing',
                desc: 'Master columnar storage, micro-partitioning, and analytical clustering keys.',
                url: '/ai-tutor?topic=Snowflake BigQuery Partitioning and Columnar Storage',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          }
        ]
      }
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
  },

  'frontend-developer': {
    roleId: 'frontend-developer',
    roleName: 'Frontend Web Engineer',
    domain: 'frontend',
    isAIGenerated: false,
    centerNode: {
      id: 'center-goal',
      title: 'Frontend Engineer',
      subtitle: '0% complete',
      icon: 'code',
      status: 'in-progress'
    },
    clusters: [
      {
        id: 'cluster-fe-core',
        title: 'JavaScript',
        categoryTag: 'Core Language',
        color: '#F59E0B',
        theme: 'amber',
        icon: 'code',
        subSkills: [
          {
            id: 'sub-fe-es6',
            title: 'ES6+ & Async',
            glyph: 'zap',
            category: 'Core Language',
            primaryAction: {
              type: 'challenge',
              title: 'Debounce Function',
              label: 'Solve Challenge',
              url: '/challenges/ch-2'
            },
            whatToDo: [
              {
                id: 'task-ch-2-fe',
                type: 'challenge',
                title: 'Solve Challenge: Debounce Function',
                desc: 'Implement a high-frequency event debounce and rate-limiting wrapper.',
                url: '/challenges/ch-2',
                badge: '75 XP • Medium',
                actionLabel: 'Solve Challenge →'
              },
              {
                id: 'task-quiz-js',
                type: 'quiz',
                title: 'Modern JavaScript Quiz',
                desc: 'Test closures, promises, event loop microtasks, and prototypes.',
                url: '/quizzes?topic=javascript-basics',
                badge: 'Skill Quiz',
                actionLabel: 'Take Quiz →'
              }
            ]
          },
          {
            id: 'sub-fe-ts',
            title: 'TypeScript',
            glyph: 'check',
            category: 'Core Language',
            primaryAction: {
              type: 'tutor',
              title: 'TypeScript Generics & Inference',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=TypeScript Generics Conditional Types and Utility Types'
            },
            whatToDo: [
              {
                id: 'task-tutor-ts-fe',
                type: 'tutor',
                title: 'Practice with AI Tutor: TypeScript',
                desc: 'Master generic constraints, discriminated unions, and strict typing.',
                url: '/ai-tutor?topic=TypeScript Generics Conditional Types and Utility Types',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          },
          {
            id: 'sub-fe-dom',
            title: 'DOM & Events',
            glyph: 'code',
            category: 'Core Language',
            primaryAction: {
              type: 'tutor',
              title: 'DOM Performance & Event Delegation',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=DOM Manipulation Event Delegation and Virtual DOM'
            },
            whatToDo: [
              {
                id: 'task-tutor-dom',
                type: 'tutor',
                title: 'Practice with AI Tutor: DOM Events',
                desc: 'Understand event bubbling, capturing, passive event listeners, and layout thrashing.',
                url: '/ai-tutor?topic=DOM Manipulation Event Delegation and Virtual DOM',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          }
        ]
      },
      {
        id: 'cluster-react',
        title: 'React Ecosystem',
        categoryTag: 'UI Framework',
        color: '#0284C7',
        theme: 'blue',
        icon: 'react',
        subSkills: [
          {
            id: 'sub-react-hooks',
            title: 'React Hooks',
            glyph: 'check',
            category: 'UI Framework',
            primaryAction: {
              type: 'tutor',
              title: 'Advanced React Hooks',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=React Hooks useMemo useCallback and Custom Hooks'
            },
            whatToDo: [
              {
                id: 'task-tutor-hooks',
                type: 'tutor',
                title: 'Practice with AI Tutor: React Hooks',
                desc: 'Master useEffect dependency arrays, useMemo caching, and custom state hooks.',
                url: '/ai-tutor?topic=React Hooks useMemo useCallback and Custom Hooks',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              },
              {
                id: 'task-quiz-react',
                type: 'quiz',
                title: 'React Architecture Quiz',
                desc: 'Assess your understanding of reconciliation, keys, contexts, and portals.',
                url: '/quizzes?topic=react-fundamentals',
                badge: 'Skill Quiz',
                actionLabel: 'Take Quiz →'
              }
            ]
          },
          {
            id: 'sub-nextjs',
            title: 'Next.js App Router',
            glyph: 'sparkles',
            category: 'UI Framework',
            primaryAction: {
              type: 'tutor',
              title: 'Next.js Server Components',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Next.js App Router Server Components SSR and Streaming'
            },
            whatToDo: [
              {
                id: 'task-tutor-next',
                type: 'tutor',
                title: 'Practice with AI Tutor: Next.js',
                desc: 'Learn React Server Components (RSC), Suspense streaming, and Server Actions.',
                url: '/ai-tutor?topic=Next.js App Router Server Components SSR and Streaming',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          },
          {
            id: 'sub-state-mgmt',
            title: 'State Mgmt',
            glyph: 'layers',
            category: 'UI Framework',
            primaryAction: {
              type: 'tutor',
              title: 'Zustand & TanStack Query',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Zustand Redux Toolkit and TanStack Query Cache'
            },
            whatToDo: [
              {
                id: 'task-tutor-state',
                type: 'tutor',
                title: 'Practice with AI Tutor: State Management',
                desc: 'Implement client state with Zustand and server state caching with TanStack Query.',
                url: '/ai-tutor?topic=Zustand Redux Toolkit and TanStack Query Cache',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          }
        ]
      },
      {
        id: 'cluster-css',
        title: 'Styling & UI',
        categoryTag: 'Design Systems',
        color: '#10B981',
        theme: 'green',
        icon: 'sparkles',
        subSkills: [
          {
            id: 'sub-tailwind',
            title: 'Tailwind CSS',
            glyph: 'sparkles',
            category: 'Styling',
            primaryAction: {
              type: 'tutor',
              title: 'Tailwind Utility-First Design',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Tailwind CSS Responsive Design and Animation Variants'
            },
            whatToDo: [
              {
                id: 'task-tutor-tailwind',
                type: 'tutor',
                title: 'Practice with AI Tutor: Tailwind CSS',
                desc: 'Build responsive grids, dark modes, animations, and reusable design tokens.',
                url: '/ai-tutor?topic=Tailwind CSS Responsive Design and Animation Variants',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          },
          {
            id: 'sub-css-anim',
            title: 'Framer Motion',
            glyph: 'zap',
            category: 'Styling',
            primaryAction: {
              type: 'tutor',
              title: 'Micro-Interactions & Framer Motion',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Framer Motion Layout Animations and Gestures'
            },
            whatToDo: [
              {
                id: 'task-tutor-framer',
                type: 'tutor',
                title: 'Practice with AI Tutor: Framer Motion',
                desc: 'Create smooth drag physics, layout transitions, and scroll animations.',
                url: '/ai-tutor?topic=Framer Motion Layout Animations and Gestures',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          },
          {
            id: 'sub-a11y',
            title: 'Accessibility (a11y)',
            glyph: 'check',
            category: 'Styling',
            primaryAction: {
              type: 'tutor',
              title: 'ARIA Roles & Keyboard Nav',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Web Accessibility WCAG ARIA Roles and Focus Management'
            },
            whatToDo: [
              {
                id: 'task-tutor-a11y',
                type: 'tutor',
                title: 'Practice with AI Tutor: Web Accessibility',
                desc: 'Ensure WCAG compliance, screen reader compatibility, and roving tabindex.',
                url: '/ai-tutor?topic=Web Accessibility WCAG ARIA Roles and Focus Management',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          }
        ]
      },
      {
        id: 'cluster-perf',
        title: 'Performance',
        categoryTag: 'Web Vitals & SEO',
        color: '#EC4899',
        theme: 'pink',
        icon: 'zap',
        subSkills: [
          {
            id: 'sub-cwv',
            title: 'Core Web Vitals',
            glyph: 'zap',
            category: 'Performance',
            primaryAction: {
              type: 'tutor',
              title: 'LCP, INP, and CLS Optimization',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Core Web Vitals LCP INP CLS and Performance Profiling'
            },
            whatToDo: [
              {
                id: 'task-tutor-cwv',
                type: 'tutor',
                title: 'Practice with AI Tutor: Web Vitals',
                desc: 'Optimize image formats, eliminate layout shifts, and accelerate Largest Contentful Paint.',
                url: '/ai-tutor?topic=Core Web Vitals LCP INP CLS and Performance Profiling',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          },
          {
            id: 'sub-bundlers',
            title: 'Vite & Bundling',
            glyph: 'layers',
            category: 'Performance',
            primaryAction: {
              type: 'tutor',
              title: 'Code Splitting & Tree Shaking',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Vite Webpack Code Splitting Tree Shaking and Bundle Analysis'
            },
            whatToDo: [
              {
                id: 'task-tutor-bundling',
                type: 'tutor',
                title: 'Practice with AI Tutor: Bundlers',
                desc: 'Reduce JavaScript bundle payload through dynamic imports and tree shaking.',
                url: '/ai-tutor?topic=Vite Webpack Code Splitting Tree Shaking and Bundle Analysis',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          }
        ]
      },
      {
        id: 'cluster-testing',
        title: 'Testing & CI',
        categoryTag: 'Quality Assurance',
        color: '#64748B',
        theme: 'slate',
        icon: 'terminal',
        subSkills: [
          {
            id: 'sub-vitest',
            title: 'Vitest & RTL',
            glyph: 'check',
            category: 'Testing',
            primaryAction: {
              type: 'tutor',
              title: 'React Testing Library & Vitest',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Vitest React Testing Library Component Unit Tests'
            },
            whatToDo: [
              {
                id: 'task-tutor-vitest',
                type: 'tutor',
                title: 'Practice with AI Tutor: Testing Library',
                desc: 'Write behavior-driven tests with user-event, queries, and async assertions.',
                url: '/ai-tutor?topic=Vitest React Testing Library Component Unit Tests',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          },
          {
            id: 'sub-playwright',
            title: 'Playwright E2E',
            glyph: 'lock',
            category: 'Testing',
            primaryAction: {
              type: 'tutor',
              title: 'End-to-End Browser Automation',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Playwright End to End Automated Browser Testing'
            },
            whatToDo: [
              {
                id: 'task-tutor-playwright',
                type: 'tutor',
                title: 'Practice with AI Tutor: Playwright',
                desc: 'Automate multi-browser user journeys, network mocks, and visual regression checks.',
                url: '/ai-tutor?topic=Playwright End to End Automated Browser Testing',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          }
        ]
      }
    ],
    recommendedSkills: [
      {
        rank: 1,
        name: 'React Hooks',
        reason: 'Foundation of modern UI engineering',
        actionType: 'quiz',
        actionUrl: '/quizzes?topic=react-fundamentals',
        actionLabel: 'Take Quiz',
        taskTitle: 'React Architecture Quiz',
        category: 'Frontend',
        xp: 80
      },
      {
        rank: 2,
        name: 'TypeScript',
        reason: 'Required standard across modern teams',
        actionType: 'tutor',
        actionUrl: '/ai-tutor?topic=TypeScript Generics Conditional Types and Utility Types',
        actionLabel: 'Practice with Tutor',
        taskTitle: 'TypeScript Generics Mastery',
        category: 'Language',
        xp: 75
      },
      {
        rank: 3,
        name: 'Next.js',
        reason: 'Dominant fullstack framework for React',
        actionType: 'tutor',
        actionUrl: '/ai-tutor?topic=Next.js App Router Server Components SSR and Streaming',
        actionLabel: 'Practice with Tutor',
        taskTitle: 'Next.js App Router',
        category: 'Framework',
        xp: 85
      },
      {
        rank: 4,
        name: 'Core Web Vitals',
        reason: 'Crucial for high performance and SEO',
        actionType: 'tutor',
        actionUrl: '/ai-tutor?topic=Core Web Vitals LCP INP CLS and Performance Profiling',
        actionLabel: 'Learn with AI',
        taskTitle: 'Web Performance Optimization',
        category: 'Performance',
        xp: 65
      }
    ],
    quote: {
      text: 'Good code is its own best documentation.',
      author: 'Steve McConnell'
    }
  },

  'cloud-devops': {
    roleId: 'cloud-devops',
    roleName: 'Cloud & DevOps Engineer',
    domain: 'devops',
    isAIGenerated: false,
    centerNode: {
      id: 'center-goal',
      title: 'Cloud & DevOps',
      subtitle: '0% complete',
      icon: 'cloud',
      status: 'in-progress'
    },
    clusters: [
      {
        id: 'cluster-containers',
        title: 'Containers',
        categoryTag: 'Containerization',
        color: '#0284C7',
        theme: 'blue',
        icon: 'layers',
        subSkills: [
          {
            id: 'sub-docker-devops',
            title: 'Docker',
            glyph: 'layers',
            category: 'Containers',
            primaryAction: {
              type: 'challenge',
              title: 'Dockerfile Optimization',
              label: 'Solve Challenge',
              url: '/challenges/ch-8'
            },
            whatToDo: [
              {
                id: 'task-ch-8-devops',
                type: 'challenge',
                title: 'Solve Challenge: Dockerfile Optimization',
                desc: 'Reduce container size from 1.2GB to under 150MB with multi-stage builds.',
                url: '/challenges/ch-8',
                badge: '75 XP • Medium',
                actionLabel: 'Solve Challenge →'
              },
              {
                id: 'task-tutor-docker-do',
                type: 'tutor',
                title: 'Practice with AI Tutor: Docker',
                desc: 'Ask AI Tutor about container security, non-root users, and caching layers.',
                url: '/ai-tutor?topic=Docker Container Optimization and Security Best Practices',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          },
          {
            id: 'sub-k8s',
            title: 'Kubernetes',
            glyph: 'network',
            category: 'Containers',
            primaryAction: {
              type: 'tutor',
              title: 'Kubernetes Pods & Deployments',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Kubernetes Deployments Services Ingress and ConfigMaps'
            },
            whatToDo: [
              {
                id: 'task-tutor-k8s',
                type: 'tutor',
                title: 'Practice with AI Tutor: Kubernetes',
                desc: 'Master Ingress controllers, Services, horizontal pod autoscaling (HPA), and helm charts.',
                url: '/ai-tutor?topic=Kubernetes Deployments Services Ingress and ConfigMaps',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          }
        ]
      },
      {
        id: 'cluster-cloud-plat',
        title: 'Cloud Platforms',
        categoryTag: 'AWS & GCP',
        color: '#F59E0B',
        theme: 'amber',
        icon: 'cloud',
        subSkills: [
          {
            id: 'sub-aws-core',
            title: 'AWS Core',
            glyph: 'cloud',
            category: 'Cloud Infrastructure',
            primaryAction: {
              type: 'tutor',
              title: 'AWS EC2, S3, and VPC Networking',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=AWS Architecture EC2 S3 VPC Subnets and IAM Policies'
            },
            whatToDo: [
              {
                id: 'task-tutor-aws',
                type: 'tutor',
                title: 'Practice with AI Tutor: AWS VPC & IAM',
                desc: 'Configure security groups, subnets, route tables, and least-privilege IAM roles.',
                url: '/ai-tutor?topic=AWS Architecture EC2 S3 VPC Subnets and IAM Policies',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          },
          {
            id: 'sub-serverless',
            title: 'Serverless',
            glyph: 'zap',
            category: 'Cloud Infrastructure',
            primaryAction: {
              type: 'tutor',
              title: 'AWS Lambda & EventBridge',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=AWS Lambda API Gateway EventBridge and DynamoDB'
            },
            whatToDo: [
              {
                id: 'task-tutor-serverless',
                type: 'tutor',
                title: 'Practice with AI Tutor: Serverless',
                desc: 'Design event-driven architectures with API Gateway, SQS queues, and Lambda.',
                url: '/ai-tutor?topic=AWS Lambda API Gateway EventBridge and DynamoDB',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          }
        ]
      },
      {
        id: 'cluster-cicd',
        title: 'CI / CD Pipelines',
        categoryTag: 'Automation',
        color: '#10B981',
        theme: 'green',
        icon: 'terminal',
        subSkills: [
          {
            id: 'sub-gh-actions',
            title: 'GitHub Actions',
            glyph: 'check',
            category: 'CI/CD',
            primaryAction: {
              type: 'tutor',
              title: 'Automated CI/CD Workflows',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=GitHub Actions CI CD Workflows Matrix Builds and Deployments'
            },
            whatToDo: [
              {
                id: 'task-tutor-gha',
                type: 'tutor',
                title: 'Practice with AI Tutor: GitHub Actions',
                desc: 'Build automated test, lint, and blue-green deployment pipelines with secrets management.',
                url: '/ai-tutor?topic=GitHub Actions CI CD Workflows Matrix Builds and Deployments',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              },
              {
                id: 'task-quiz-git',
                type: 'quiz',
                title: 'Git & Deployment Workflows Quiz',
                desc: 'Test your understanding of rebasing, merge strategies, hooks, and release tagging.',
                url: '/quizzes?topic=git',
                badge: 'Skill Quiz',
                actionLabel: 'Take Quiz →'
              }
            ]
          },
          {
            id: 'sub-argo',
            title: 'GitOps & ArgoCD',
            glyph: 'lock',
            category: 'CI/CD',
            primaryAction: {
              type: 'tutor',
              title: 'GitOps Continuous Delivery',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=GitOps ArgoCD Declarative Kubernetes Deployment'
            },
            whatToDo: [
              {
                id: 'task-tutor-argo',
                type: 'tutor',
                title: 'Practice with AI Tutor: GitOps',
                desc: 'Implement declarative Kubernetes rollouts and automated drift correction with ArgoCD.',
                url: '/ai-tutor?topic=GitOps ArgoCD Declarative Kubernetes Deployment',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          }
        ]
      },
      {
        id: 'cluster-iac',
        title: 'Infra as Code',
        categoryTag: 'Terraform & Config',
        color: '#8B5CF6',
        theme: 'purple',
        icon: 'code',
        subSkills: [
          {
            id: 'sub-terraform',
            title: 'Terraform',
            glyph: 'code',
            category: 'IaC',
            primaryAction: {
              type: 'tutor',
              title: 'Terraform State & Modules',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Terraform HCL Remote State Locking and Modular Architecture'
            },
            whatToDo: [
              {
                id: 'task-tutor-tf',
                type: 'tutor',
                title: 'Practice with AI Tutor: Terraform',
                desc: 'Manage cloud resources declaratively with remote S3 state locking and reusable modules.',
                url: '/ai-tutor?topic=Terraform HCL Remote State Locking and Modular Architecture',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          },
          {
            id: 'sub-ansible',
            title: 'Ansible',
            glyph: 'terminal',
            category: 'IaC',
            primaryAction: {
              type: 'tutor',
              title: 'Idempotent Configuration',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Ansible Playbooks Roles and Server Configuration Automation'
            },
            whatToDo: [
              {
                id: 'task-tutor-ansible',
                type: 'tutor',
                title: 'Practice with AI Tutor: Ansible',
                desc: 'Automate Linux server provisioning, SSH key distribution, and security hardening.',
                url: '/ai-tutor?topic=Ansible Playbooks Roles and Server Configuration Automation',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          }
        ]
      },
      {
        id: 'cluster-observability',
        title: 'Observability',
        categoryTag: 'Monitoring & Logs',
        color: '#EC4899',
        theme: 'pink',
        icon: 'sparkles',
        subSkills: [
          {
            id: 'sub-prom-grafana',
            title: 'Prometheus & Grafana',
            glyph: 'table',
            category: 'Monitoring',
            primaryAction: {
              type: 'tutor',
              title: 'Metrics & Alertmanager',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Prometheus Metrics PromQL Alertmanager and Grafana Dashboards'
            },
            whatToDo: [
              {
                id: 'task-tutor-prom',
                type: 'tutor',
                title: 'Practice with AI Tutor: Prometheus & PromQL',
                desc: 'Write PromQL alert rules, scrape exporters, and build real-time system monitoring.',
                url: '/ai-tutor?topic=Prometheus Metrics PromQL Alertmanager and Grafana Dashboards',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          },
          {
            id: 'sub-linux-systems',
            title: 'Linux Systems',
            glyph: 'terminal',
            category: 'Operating System',
            primaryAction: {
              type: 'tutor',
              title: 'Linux Kernel & Networking',
              label: 'Practice with AI Tutor',
              url: '/ai-tutor?topic=Linux Systems Performance Tuning Systemd and TCP IP Networking'
            },
            whatToDo: [
              {
                id: 'task-tutor-linux-sys',
                type: 'tutor',
                title: 'Practice with AI Tutor: Linux Systems',
                desc: 'Inspect network sockets, tune kernel parameters, manage systemd, and diagnose CPU wait.',
                url: '/ai-tutor?topic=Linux Systems Performance Tuning Systemd and TCP IP Networking',
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          }
        ]
      }
    ],
    recommendedSkills: [
      {
        rank: 1,
        name: 'Docker',
        reason: 'Universal container standard',
        actionType: 'challenge',
        actionUrl: '/challenges/ch-8',
        actionLabel: 'Solve Challenge',
        taskTitle: 'Dockerfile Optimization',
        category: 'DevOps',
        xp: 75
      },
      {
        rank: 2,
        name: 'Kubernetes',
        reason: 'Industry leader for container orchestration',
        actionType: 'tutor',
        actionUrl: '/ai-tutor?topic=Kubernetes Deployments Services Ingress and ConfigMaps',
        actionLabel: 'Practice with Tutor',
        taskTitle: 'Kubernetes Architecture',
        category: 'Cloud',
        xp: 85
      },
      {
        rank: 3,
        name: 'GitHub Actions',
        reason: 'Critical for CI/CD automation',
        actionType: 'tutor',
        actionUrl: '/ai-tutor?topic=GitHub Actions CI CD Workflows Matrix Builds and Deployments',
        actionLabel: 'Practice with Tutor',
        taskTitle: 'Automated CI/CD Workflows',
        category: 'Automation',
        xp: 70
      },
      {
        rank: 4,
        name: 'Terraform',
        reason: 'Most popular Infrastructure as Code tool',
        actionType: 'tutor',
        actionUrl: '/ai-tutor?topic=Terraform HCL Remote State Locking and Modular Architecture',
        actionLabel: 'Learn with AI',
        taskTitle: 'Terraform State Mastery',
        category: 'IaC',
        xp: 80
      }
    ],
    quote: {
      text: 'Automate everything you can, measure everything that matters.',
      author: 'REXION'
    }
  }
}

/**
 * Procedural fallback synthesis generator when LLM is unavailable
 */
function generateProceduralAIGraph(roleTitle) {
  const cleanTitle = roleTitle.trim()
  const roleSlug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  
  return {
    roleId: roleSlug,
    roleName: cleanTitle,
    domain: 'custom',
    isAIGenerated: true,
    centerNode: {
      id: 'center-goal',
      title: cleanTitle,
      subtitle: '0% complete',
      icon: 'brain',
      status: 'in-progress'
    },
    clusters: [
      {
        id: 'cluster-core-foundation',
        title: 'Core Fundamentals',
        categoryTag: 'Foundations',
        color: '#10B981',
        theme: 'green',
        icon: 'code',
        subSkills: [
          {
            id: 'sub-foundations-1',
            title: `${cleanTitle} Basics`,
            glyph: 'code',
            category: 'Foundations',
            primaryAction: {
              type: 'tutor',
              title: `${cleanTitle} Core Concepts`,
              label: 'Practice with AI Tutor',
              url: `/ai-tutor?topic=${encodeURIComponent(cleanTitle + ' Core Fundamentals and Principles')}`
            },
            whatToDo: [
              {
                id: 'task-tutor-f1',
                type: 'tutor',
                title: `Practice with AI Tutor: ${cleanTitle} Basics`,
                desc: `Understand the foundational principles, core syntax, and architecture of ${cleanTitle}.`,
                url: `/ai-tutor?topic=${encodeURIComponent(cleanTitle + ' Core Fundamentals and Principles')}`,
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              },
              {
                id: 'task-quiz-f1',
                type: 'quiz',
                title: `${cleanTitle} Foundations Quiz`,
                desc: 'Test your initial conceptual baseline on terminology and best practices.',
                url: '/quizzes?topic=general-software',
                badge: 'Skill Quiz',
                actionLabel: 'Take Quiz →'
              }
            ]
          },
          {
            id: 'sub-foundations-2',
            title: 'Data Structures & Logic',
            glyph: 'check',
            category: 'Foundations',
            primaryAction: {
              type: 'challenge',
              title: 'Solve Challenge: Reverse a String',
              label: 'Solve Challenge',
              url: '/challenges/ch-1'
            },
            whatToDo: [
              {
                id: 'task-ch-1-custom',
                type: 'challenge',
                title: 'Solve Challenge: Reverse a String',
                desc: 'UTF-8 string and memory manipulation challenge.',
                url: '/challenges/ch-1',
                badge: '50 XP • Easy',
                actionLabel: 'Solve Challenge →'
              },
              {
                id: 'task-arena-custom',
                type: 'arena',
                title: 'Practice in Code Arena',
                desc: 'Test your algorithmic reasoning against production problem sets.',
                url: '/code-arena',
                badge: 'Code Arena',
                actionLabel: 'Enter Arena →'
              }
            ]
          }
        ]
      },
      {
        id: 'cluster-frameworks',
        title: 'Frameworks & Tools',
        categoryTag: 'Frameworks',
        color: '#0284C7',
        theme: 'blue',
        icon: 'layers',
        subSkills: [
          {
            id: 'sub-frameworks-1',
            title: 'Primary Framework',
            glyph: 'layers',
            category: 'Frameworks',
            primaryAction: {
              type: 'tutor',
              title: `${cleanTitle} Ecosystem & Tools`,
              label: 'Practice with AI Tutor',
              url: `/ai-tutor?topic=${encodeURIComponent(cleanTitle + ' Standard Frameworks and Industry Tooling')}`
            },
            whatToDo: [
              {
                id: 'task-tutor-fw',
                type: 'tutor',
                title: `Practice with AI Tutor: ${cleanTitle} Frameworks`,
                desc: `Explore leading libraries, SDKs, and patterns used in professional ${cleanTitle}.`,
                url: `/ai-tutor?topic=${encodeURIComponent(cleanTitle + ' Standard Frameworks and Industry Tooling')}`,
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          },
          {
            id: 'sub-frameworks-2',
            title: 'Workflow Automation',
            glyph: 'zap',
            category: 'Frameworks',
            primaryAction: {
              type: 'challenge',
              title: 'Solve Challenge: Debounce Function',
              label: 'Solve Challenge',
              url: '/challenges/ch-2'
            },
            whatToDo: [
              {
                id: 'task-ch-2-custom',
                type: 'challenge',
                title: 'Solve Challenge: Debounce Function',
                desc: 'Implement performance optimization and event throttling.',
                url: '/challenges/ch-2',
                badge: '75 XP • Medium',
                actionLabel: 'Solve Challenge →'
              }
            ]
          }
        ]
      },
      {
        id: 'cluster-advanced',
        title: 'Advanced Architecture',
        categoryTag: 'Architecture',
        color: '#F59E0B',
        theme: 'amber',
        icon: 'brain',
        subSkills: [
          {
            id: 'sub-adv-1',
            title: 'System Design & Scalability',
            glyph: 'network',
            category: 'Architecture',
            primaryAction: {
              type: 'challenge',
              title: 'Microservice Event Bus',
              label: 'Solve Challenge',
              url: '/challenges/ch-6'
            },
            whatToDo: [
              {
                id: 'task-ch-6-custom',
                type: 'challenge',
                title: 'Solve Challenge: Microservice Event Bus',
                desc: 'Design distributed event routing and publish-subscribe patterns.',
                url: '/challenges/ch-6',
                badge: '125 XP • Hard',
                actionLabel: 'Solve Challenge →'
              },
              {
                id: 'task-tutor-sys',
                type: 'tutor',
                title: 'Practice with AI Tutor: Scalability',
                desc: 'Discuss caching, horizontal scaling, and latency trade-offs with AI Tutor.',
                url: `/ai-tutor?topic=${encodeURIComponent(cleanTitle + ' System Design and Scalability')}`,
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          },
          {
            id: 'sub-adv-2',
            title: 'Security & Optimization',
            glyph: 'check',
            category: 'Architecture',
            primaryAction: {
              type: 'challenge',
              title: 'API Rate Limiting Shield',
              label: 'Solve Challenge',
              url: '/challenges/ch-10'
            },
            whatToDo: [
              {
                id: 'task-ch-10-custom',
                type: 'challenge',
                title: 'Solve Challenge: API Rate Limiting Shield',
                desc: 'Protect against DDoS, abusive traffic, and token bucket overflows.',
                url: '/challenges/ch-10',
                badge: '100 XP • Production',
                actionLabel: 'Solve Challenge →'
              }
            ]
          }
        ]
      },
      {
        id: 'cluster-data-infra',
        title: 'Data & Storage',
        categoryTag: 'Data Management',
        color: '#EC4899',
        theme: 'pink',
        icon: 'sparkles',
        subSkills: [
          {
            id: 'sub-data-1',
            title: 'Data Modeling & Queries',
            glyph: 'table',
            category: 'Data',
            primaryAction: {
              type: 'challenge',
              title: 'SQL Query Aggregator',
              label: 'Solve Challenge',
              url: '/challenges/ch-4'
            },
            whatToDo: [
              {
                id: 'task-ch-4-custom',
                type: 'challenge',
                title: 'Solve Challenge: SQL Query Aggregator',
                desc: 'Write robust query aggregations and data pipelines.',
                url: '/challenges/ch-4',
                badge: '80 XP • Medium',
                actionLabel: 'Solve Challenge →'
              }
            ]
          },
          {
            id: 'sub-data-2',
            title: 'Caching & State',
            glyph: 'zap',
            category: 'Data',
            primaryAction: {
              type: 'challenge',
              title: 'LRU Cache Implementation',
              label: 'Solve Challenge',
              url: '/challenges/ch-3'
            },
            whatToDo: [
              {
                id: 'task-ch-3-custom',
                type: 'challenge',
                title: 'Solve Challenge: LRU Cache Implementation',
                desc: 'Implement O(1) eviction and doubly-linked hash map storage.',
                url: '/challenges/ch-3',
                badge: '100 XP • Medium',
                actionLabel: 'Solve Challenge →'
              }
            ]
          }
        ]
      },
      {
        id: 'cluster-deployment',
        title: 'DevOps & Production',
        categoryTag: 'Deployment',
        color: '#64748B',
        theme: 'slate',
        icon: 'cloud',
        subSkills: [
          {
            id: 'sub-dep-1',
            title: 'Containerization & Docker',
            glyph: 'layers',
            category: 'DevOps',
            primaryAction: {
              type: 'challenge',
              title: 'Dockerfile Optimization',
              label: 'Solve Challenge',
              url: '/challenges/ch-8'
            },
            whatToDo: [
              {
                id: 'task-ch-8-custom',
                type: 'challenge',
                title: 'Solve Challenge: Dockerfile Optimization',
                desc: 'Multi-stage builds and container size reduction.',
                url: '/challenges/ch-8',
                badge: '75 XP • Medium',
                actionLabel: 'Solve Challenge →'
              }
            ]
          },
          {
            id: 'sub-dep-2',
            title: 'CI/CD & Monitoring',
            glyph: 'terminal',
            category: 'DevOps',
            primaryAction: {
              type: 'tutor',
              title: `${cleanTitle} CI/CD Workflows`,
              label: 'Practice with AI Tutor',
              url: `/ai-tutor?topic=${encodeURIComponent(cleanTitle + ' CI CD Pipelines and Automated Testing')}`
            },
            whatToDo: [
              {
                id: 'task-tutor-dep-custom',
                type: 'tutor',
                title: `Practice with AI Tutor: Production Workflows`,
                desc: `Implement automated testing, branch protection, and release pipelines.`,
                url: `/ai-tutor?topic=${encodeURIComponent(cleanTitle + ' CI CD Pipelines and Automated Testing')}`,
                badge: 'AI Coaching',
                actionLabel: 'Ask AI Tutor →'
              }
            ]
          }
        ]
      }
    ],
    recommendedSkills: [
      {
        rank: 1,
        name: 'Foundations',
        reason: `Core prerequisite for ${cleanTitle}`,
        actionType: 'tutor',
        actionUrl: `/ai-tutor?topic=${encodeURIComponent(cleanTitle + ' Core Fundamentals and Principles')}`,
        actionLabel: 'Learn with AI',
        taskTitle: `${cleanTitle} Fundamentals`,
        category: 'Foundations',
        xp: 80
      },
      {
        rank: 2,
        name: 'Data Structures',
        reason: 'Universal standard for technical problem solving',
        actionType: 'challenge',
        actionUrl: '/challenges/ch-1',
        actionLabel: 'Solve Challenge',
        taskTitle: 'Reverse a String',
        category: 'DSA',
        xp: 50
      },
      {
        rank: 3,
        name: 'System Design',
        reason: 'Crucial for modern engineering architecture',
        actionType: 'challenge',
        actionUrl: '/challenges/ch-6',
        actionLabel: 'Solve Challenge',
        taskTitle: 'Microservice Event Bus',
        category: 'Architecture',
        xp: 125
      },
      {
        rank: 4,
        name: 'Docker & DevOps',
        reason: 'Essential for running production workloads',
        actionType: 'challenge',
        actionUrl: '/challenges/ch-8',
        actionLabel: 'Solve Challenge',
        taskTitle: 'Dockerfile Optimization',
        category: 'DevOps',
        xp: 75
      }
    ],
    quote: {
      text: 'Master the fundamentals, and the rest will follow.',
      author: 'REXION'
    }
  }
}

/**
 * Synthesizes an on-demand skill tree with an LLM (Gemini or OpenAI)
 */
export async function synthesizeAIGraph(roleTitle) {
  const cleanTitle = roleTitle.trim()
  const roleSlug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const systemPrompt = `You are the Lead Curriculum Architect at REXION AI.
Generate a structured, production-grade 5-cluster skill tree mindmap for the career path: "${cleanTitle}".

Output strictly valid JSON with this exact schema:
{
  "roleId": "${roleSlug}",
  "roleName": "${cleanTitle}",
  "domain": "engineering",
  "isAIGenerated": true,
  "centerNode": {
    "id": "center-goal",
    "title": "${cleanTitle}",
    "subtitle": "0% complete",
    "icon": "brain",
    "status": "in-progress"
  },
  "clusters": [
    {
      "id": "cluster-1",
      "title": "Cluster Title",
      "categoryTag": "Short Tag",
      "color": "#10B981",
      "theme": "green",
      "icon": "code",
      "subSkills": [
        {
          "id": "sub-1-1",
          "title": "SubSkill Name",
          "glyph": "code",
          "category": "Domain",
          "primaryAction": {
            "type": "tutor",
            "title": "Topic Title",
            "label": "Practice with AI Tutor",
            "url": "/ai-tutor?topic=URL_ENCODED_TOPIC"
          },
          "whatToDo": [
            {
              "id": "task-1-1-1",
              "type": "tutor",
              "title": "Practice with AI Tutor: Name",
              "desc": "Short description of what the user learns.",
              "url": "/ai-tutor?topic=URL_ENCODED_TOPIC",
              "badge": "AI Coaching",
              "actionLabel": "Ask AI Tutor →"
            },
            {
              "id": "task-1-1-2",
              "type": "quiz",
              "title": "Skill Assessment Quiz",
              "desc": "Test your understanding of core concepts.",
              "url": "/quizzes?topic=general-software",
              "badge": "Skill Quiz",
              "actionLabel": "Take Quiz →"
            }
          ]
        }
      ]
    }
  ],
  "recommendedSkills": [
    {
      "rank": 1,
      "name": "Skill Name",
      "reason": "Why this skill is recommended",
      "actionType": "tutor",
      "actionUrl": "/ai-tutor?topic=...",
      "actionLabel": "Practice with Tutor",
      "taskTitle": "Task Title",
      "category": "Category",
      "xp": 80
    }
  ],
  "quote": {
    "text": "Inspiring quote about engineering or mastery",
    "author": "Thought Leader"
  }
}

Requirements:
- Exactly 5 distinct clusters representing the 5 major pillars of ${cleanTitle}.
- Colors for the 5 clusters should vary cleanly: #10B981 (green), #0284C7 (blue), #F59E0B (amber), #EC4899 (pink), #8B5CF6 (purple).
- 2 to 3 subskills per cluster with realistic, accurate modern technical topics.
- Every subskill MUST have an actionable whatToDo array containing quizzes (/quizzes?topic=...), Code Arena challenges (/challenges/ch-1 to ch-12 or /code-arena), and AI Tutor topics (/ai-tutor?topic=...).
- Return ONLY pure valid JSON without markdown fences.
`

  // 1. Try Gemini
  if (geminiClient) {
    try {
      const model = geminiClient.getGenerativeModel({ model: GEMINI_TEXT_MODEL || 'gemini-1.5-flash' })
      const res = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.4 }
      })
      const rawText = res.response.text().trim()
      const parsed = JSON.parse(rawText)
      if (parsed && Array.isArray(parsed.clusters) && parsed.clusters.length >= 3) {
        return parsed
      }
    } catch (err) {
      console.warn('Gemini graph synthesis warning, falling back:', err.message)
    }
  }

  // 2. Try OpenAI
  if (openaiClient) {
    try {
      const res = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: systemPrompt }],
        temperature: 0.4
      })
      const content = res.choices[0]?.message?.content?.trim()
      const jsonStr = content.replace(/^```json/i, '').replace(/```$/i, '').trim()
      const parsed = JSON.parse(jsonStr)
      if (parsed && Array.isArray(parsed.clusters) && parsed.clusters.length >= 3) {
        return parsed
      }
    } catch (err) {
      console.warn('OpenAI graph synthesis warning, falling back:', err.message)
    }
  }

  // 3. Fallback to procedural generator
  return generateProceduralAIGraph(cleanTitle)
}

/**
 * Retrieves an existing graph from MongoDB or generates and persists it
 */
export async function getOrGenerateSkillGraph(roleId, customTitle = null) {
  const normId = (roleId || 'ai-engineer').toLowerCase().trim()

  // Check MongoDB first
  try {
    const cached = await SkillGraph.findOne({ roleId: normId }).lean()
    if (cached) return cached
  } catch (dbErr) {
    console.warn('SkillGraph findOne warning:', dbErr.message)
  }

  // Check Curated built-in catalog
  if (CURATED_ROLE_GRAPHS[normId]) {
    try {
      const saved = await SkillGraph.create(CURATED_ROLE_GRAPHS[normId])
      return saved.toObject()
    } catch (createErr) {
      // If concurrent write created it, fetch again
      const existing = await SkillGraph.findOne({ roleId: normId }).lean()
      if (existing) return existing
      return CURATED_ROLE_GRAPHS[normId]
    }
  }

  // Dynamic AI generation for arbitrary custom career paths
  const synthesized = await synthesizeAIGraph(customTitle || normId.replace(/-/g, ' '))
  try {
    const saved = await SkillGraph.create(synthesized)
    return saved.toObject()
  } catch (saveErr) {
    console.warn('SkillGraph cache save warning:', saveErr.message)
    return synthesized
  }
}
