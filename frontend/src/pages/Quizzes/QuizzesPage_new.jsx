import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Home, GraduationCap, BookOpen, Target, Layers, Flame, Code2, Sparkles,
  Network, Trophy, Clock, Settings, Headphones, Search, Bell,
  ChevronRight, ChevronDown, Star, ArrowRight,
  Check, FileCode, Terminal, Database, Cpu, Layers2,
  ClipboardList, Crosshair, HelpCircle, FileText, Copy,
  TrendingUp, BarChart2, Zap, X
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { getStoredUser } from "../../utils/authSession"
import profileApi from "../../services/profileApi"
import quizApi from "../../services/quizApi"
import heroDeskAsset from "../../assets/quizzes_hero_desk.jpg"
import styles from "./QuizzesPage.module.css"
