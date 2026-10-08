/**
 * PRODUCTION QUIZ CONTROLLER
 * - 20–30+ production questions per topic (daily rotation picks 5 per session)
 * - Daily questions seeded deterministically by date (differs each day, consistent all day)
 * - Real MongoDB-persisted Leaderboard with live rankings and user XP
 * - User progress, per-quiz best scores, attempt history, streaks
 * - Flexible slug matching (short IDs like 'python', 'javascript', 'react', 'sql' auto-resolved)
 */
import mongoose from 'mongoose'
import { Quiz, QuizAttempt, UserXP } from '../models/Quiz.js'
import User from '../models/User.js'
import CandidateProfile from '../models/CandidateProfile.js'
import { refreshQuizQuestionPool, generateFreshQuestionsForTopic, getOrProvisionQuizWithAI } from '../services/aiQuizService.js'

/* ═══════════════════════════════════════════════════════════════
   DAILY ROTATION UTILITY
   ═══════════════════════════════════════════════════════════════ */
function todayStr() {
  return new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'
}

/** Deterministic seeded shuffle — same seed → same order */
function seededShuffle(arr, seed) {
  const a = [...arr]
  let s = seed
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Pick N questions from the pool for today — different each day */
function getDailyQuestions(pool, count = 5) {
  if (!pool || pool.length === 0) return []
  const today = todayStr()
  const seed = parseInt(today.replace(/-/g, ''), 10)
  const shuffled = seededShuffle(pool, seed)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

/* ═══════════════════════════════════════════════════════════════
   QUESTION BANK SEED DATA (20–30 questions per major topic)
   ═══════════════════════════════════════════════════════════════ */
const QUESTION_BANKS = {
  'python-basics': [
    { id:'py1',  question:"What is the output of `type(1/2)` in Python 3?", options:["<class 'int'>","<class 'float'>","<class 'double'>","<class 'number'>"], correctIndex:1, difficulty:'Easy', tags:['types'], explanation:"In Python 3, `/` always returns float." },
    { id:'py2',  question:"Which built-in type is mutable?", options:["Tuple","String","List","FrozenSet"], correctIndex:2, difficulty:'Easy', tags:['types'], explanation:"Lists are mutable — elements can be modified in-place." },
    { id:'py3',  question:"How do you create a generator function?", options:["Using return","Using yield","Using async def only","Using lambda x: yield x"], correctIndex:1, difficulty:'Medium', tags:['generators'], explanation:"yield turns a function into a generator." },
    { id:'py4',  question:"Average time complexity of Python dict lookup?", options:["O(n)","O(log n)","O(1)","O(n log n)"], correctIndex:2, difficulty:'Medium', tags:['data-structures'], explanation:"Dicts use hash tables — O(1) average." },
    { id:'py5',  question:"Which method adds to the end of a list?", options:["append()","extend()","insert(0)","push()"], correctIndex:0, difficulty:'Easy', tags:['lists'], explanation:"list.append(x) adds x to the end." },
    { id:'py6',  question:"What does `*args` allow?", options:["Keyword arguments","Positional arguments (any number)","Unpack dict","Force int args"], correctIndex:1, difficulty:'Medium', tags:['functions'], explanation:"*args collects extra positional args as a tuple." },
    { id:'py7',  question:"What is a Python decorator?", options:["A loop modifier","A function that wraps another function","An async callback","A type annotation"], correctIndex:1, difficulty:'Medium', tags:['decorators'], explanation:"Decorators extend function behavior at definition time." },
    { id:'py8',  question:"Exception handling in Python uses?", options:["catch-throw","try-except","try-catch","if-raise"], correctIndex:1, difficulty:'Easy', tags:['exceptions'], explanation:"Python uses try/except blocks." },
    { id:'py9',  question:"What does list comprehension do?", options:["Loops without body","Creates a list via expression","Compresses a list","Sorts a list"], correctIndex:1, difficulty:'Easy', tags:['comprehensions'], explanation:"[x*2 for x in range(5)] creates a new list concisely." },
    { id:'py10', question:"Difference between `is` and `==`?", options:["No difference","`is` checks identity; `==` checks value equality","`==` checks identity","`is` only works for numbers"], correctIndex:1, difficulty:'Medium', tags:['operators'], explanation:"`is` compares memory address; `==` compares values." },
    { id:'py11', question:"What does `enumerate()` do?", options:["Sorts items","Returns (index, value) pairs","Filters a list","Converts to dict"], correctIndex:1, difficulty:'Easy', tags:['builtins'], explanation:"enumerate() returns (index, item) tuples for each element." },
    { id:'py12', question:"What is a lambda function?", options:["A class method","An anonymous single-expression function","A generator","A coroutine"], correctIndex:1, difficulty:'Easy', tags:['functions'], explanation:"lambda x: x*2 is an anonymous inline function." },
    { id:'py13', question:"What is the GIL in Python?", options:["Graphics Interface Layer","Global Interpreter Lock preventing true parallelism of threads","General Input Library","Grid Index List"], correctIndex:1, difficulty:'Hard', tags:['concurrency'], explanation:"The GIL allows only one thread to execute Python bytecode at a time." },
    { id:'py14', question:"What does `zip()` return?", options:["A compressed file","Iterator of tuples pairing elements from multiple iterables","A dict","A sorted list"], correctIndex:1, difficulty:'Easy', tags:['builtins'], explanation:"zip([1,2],[3,4]) → (1,3), (2,4)." },
    { id:'py15', question:"Difference between `deepcopy` and `copy`?", options:["No difference","deepcopy copies nested objects; copy only top level","copy is faster only","deepcopy is deprecated"], correctIndex:1, difficulty:'Medium', tags:['memory'], explanation:"copy.deepcopy() recursively copies all nested objects." },
    { id:'py16', question:"What is `__init__` in a class?", options:["A static method","The class constructor called on instantiation","A destructor","A class variable"], correctIndex:1, difficulty:'Easy', tags:['oop'], explanation:"__init__ is the initializer method called when an object is created." },
    { id:'py17', question:"What does `@property` do?", options:["Creates a class variable","Defines a getter as a property","Marks method as static","Caches the result"], correctIndex:1, difficulty:'Medium', tags:['oop'], explanation:"@property lets you access a method like an attribute." },
    { id:'py18', question:"What is a `set` in Python?", options:["Ordered list","Unordered collection of unique elements","Key-value pairs","Immutable list"], correctIndex:1, difficulty:'Easy', tags:['data-structures'], explanation:"Sets store unique items with O(1) membership testing." },
    { id:'py19', question:"What does `map()` do?", options:["Filters items","Applies function to each item in iterable","Creates a key-value map","Sorts the iterable"], correctIndex:1, difficulty:'Easy', tags:['builtins'], explanation:"map(fn, iterable) applies fn to each element lazily." },
    { id:'py20', question:"What is the purpose of `__str__` vs `__repr__`?", options:["No difference","__str__ is human-readable; __repr__ is unambiguous/developer-facing","__repr__ is used in print()","__str__ is only for logging"], correctIndex:1, difficulty:'Medium', tags:['oop'], explanation:"str() calls __str__; repr() calls __repr__ for debug/eval." },
    { id:'py21', question:"What is a `context manager` (with statement)?", options:["A threading primitive","An object managing setup/teardown (enter/exit)","A type of generator","A module loader"], correctIndex:1, difficulty:'Medium', tags:['context-managers'], explanation:"with open(file) as f: ensures cleanup via __enter__/__exit__." },
    { id:'py22', question:"Output of: `x = [1,2,3]; y = x; x.append(4); print(y)`?", code:"x = [1, 2, 3]\ny = x\nx.append(4)\nprint(y)", language:"python", options:["[1, 2, 3]","[1, 2, 3, 4]","[1, 2, 3, 4, 4]","Error"], correctIndex:1, difficulty:'Medium', tags:['references'], explanation:"y = x creates a reference, not a copy. Both point to same list." },
    { id:'py23', question:"What does `async def` define?", options:["A threaded function","A coroutine function for async/await execution","A generator","A lambda"], correctIndex:1, difficulty:'Hard', tags:['async'], explanation:"async def creates a coroutine to be awaited in event loops." },
    { id:'py24', question:"What is `defaultdict` in collections?", options:["A sorted dict","A dict with a default value factory for missing keys","A thread-safe dict","A read-only dict"], correctIndex:1, difficulty:'Medium', tags:['data-structures'], explanation:"defaultdict(int) returns 0 for missing keys instead of raising KeyError." },
    { id:'py25', question:"Time complexity of appending to a Python list?", options:["O(n)","O(1) amortized","O(log n)","O(n²)"], correctIndex:1, difficulty:'Medium', tags:['performance'], explanation:"Python list append is O(1) amortized — occasional O(n) resizing." },
    { id:'py26', question:"What does `isinstance()` check?", options:["Object size","If an object is instance of a class/type (including subclasses)","Variable name","Memory address"], correctIndex:1, difficulty:'Easy', tags:['types'], explanation:"isinstance(x, int) returns True if x is int or subclass of int." },
    { id:'py27', question:"What is `*` unpacking used for in function calls?", options:["Multiply args","Unpack iterable into positional args","Keyword-only args","Type hints"], correctIndex:1, difficulty:'Medium', tags:['functions'], explanation:"fn(*[1,2,3]) = fn(1,2,3). ** unpacks dicts into kwargs." },
    { id:'py28', question:"What is a `namedtuple`?", options:["A mutable dict subclass","A tuple with named fields (immutable, memory-efficient)","A class decorator","An ordered set"], correctIndex:1, difficulty:'Medium', tags:['data-structures'], explanation:"namedtuple('Point', 'x y') creates a lightweight immutable class." },
    { id:'py29', question:"What is the output of `bool([])` in Python?", options:["True","False","None","Error"], correctIndex:1, difficulty:'Easy', tags:['types'], explanation:"Empty collections are falsy: bool([]) == False." },
    { id:'py30', question:"What is `functools.lru_cache` used for?", options:["Sorting functions","Caching function results to avoid repeated expensive calls","Limiting recursion","Logging function calls"], correctIndex:1, difficulty:'Hard', tags:['optimization'], explanation:"lru_cache memoizes function results keyed by arguments." }
  ],

  'javascript-modern': [
    { id:'js1',  question:"What does Promise.all() do when one promise rejects?", options:["Waits for all","Immediately rejects","Ignores error","Resolves null"], correctIndex:1, difficulty:'Medium', tags:['promises'], explanation:"Promise.all fails-fast on any rejection." },
    { id:'js2',  question:"Scope of variables declared with let and const?", options:["Global","Function","Block","Module only"], correctIndex:2, difficulty:'Easy', tags:['scope'], explanation:"let/const are block-scoped." },
    { id:'js3',  question:"What does typeof null return?", options:['"null"','"undefined"','"object"','"boolean"'], correctIndex:2, difficulty:'Medium', tags:['types'], explanation:"typeof null === 'object' is a famous legacy JS bug." },
    { id:'js4',  question:"What is a closure?", options:["A sealed object","Function retaining access to outer scope after it returns","An IIFE","A generator"], correctIndex:1, difficulty:'Medium', tags:['closures'], explanation:"Closures capture variables from enclosing scope." },
    { id:'js5',  question:"What does Array.prototype.reduce() return?", options:["New array always","Single accumulated value","undefined","A promise"], correctIndex:1, difficulty:'Medium', tags:['arrays'], explanation:"reduce() folds elements into one accumulated result." },
    { id:'js6',  question:"What is optional chaining (?.) used for?", options:["Type checking","Safe property access without throwing on null/undefined","Null coalescing","Async await"], correctIndex:1, difficulty:'Easy', tags:['syntax'], explanation:"obj?.prop returns undefined instead of throwing." },
    { id:'js7',  question:"Difference between == and === in JS?", options:["No difference","=== checks type+value; == uses coercion","== is stricter","=== only for objects"], correctIndex:1, difficulty:'Easy', tags:['operators'], explanation:"=== strict equality — no type coercion." },
    { id:'js8',  question:"Which method converts JSON string to JS object?", options:["JSON.stringify()","JSON.parse()","Object.fromJSON()","JSON.decode()"], correctIndex:1, difficulty:'Easy', tags:['json'], explanation:"JSON.parse(str) parses a JSON string into JS object." },
    { id:'js9',  question:"What is the event loop responsible for?", options:["Garbage collection","Executing async callbacks when stack is empty","Handling CSS","Parsing HTML"], correctIndex:1, difficulty:'Hard', tags:['event-loop'], explanation:"Event loop picks callbacks from queue when call stack is empty." },
    { id:'js10', question:"What is `async/await` syntactic sugar for?", options:["Callbacks","Promises","Generators","Web Workers"], correctIndex:1, difficulty:'Medium', tags:['async'], explanation:"async/await is built on top of Promises for cleaner syntax." },
    { id:'js11', question:"What does the spread operator `...` do in arrays?", options:["Sorts array","Expands elements into individual values","Filters array","Reverses array"], correctIndex:1, difficulty:'Easy', tags:['syntax'], explanation:"[...arr1, ...arr2] creates a new merged array." },
    { id:'js12', question:"Output of: `console.log(0.1 + 0.2 === 0.3)`?", options:["true","false","Error","undefined"], correctIndex:1, difficulty:'Medium', tags:['numbers'], explanation:"Floating point precision: 0.1 + 0.2 = 0.30000000000000004." },
    { id:'js13', question:"What is `this` in an arrow function?", options:["The function itself","Lexically inherited from enclosing scope","The global object","undefined always"], correctIndex:1, difficulty:'Medium', tags:['this'], explanation:"Arrow functions don't have their own `this` — they inherit it lexically." },
    { id:'js14', question:"What does `Object.freeze()` do?", options:["Clones the object","Prevents modifications to object properties","Sorts properties","Makes async"], correctIndex:1, difficulty:'Medium', tags:['objects'], explanation:"Object.freeze() makes an object immutable (shallow)." },
    { id:'js15', question:"What is a WeakMap?", options:["A Map with limited size","A Map where keys are weakly referenced (garbage-collectible)","A thread-safe Map","A sorted Map"], correctIndex:1, difficulty:'Hard', tags:['data-structures'], explanation:"WeakMap allows GC of keys when no other references exist." },
    { id:'js16', question:"What is `Symbol` used for in JS?", options:["Math operations","Creating unique, non-string property keys","Encryption","Async signaling"], correctIndex:1, difficulty:'Hard', tags:['types'], explanation:"Symbol() creates a guaranteed-unique primitive value." },
    { id:'js17', question:"What does `Array.prototype.flat()` do?", options:["Sorts an array","Flattens nested arrays into one level","Filters falsy values","Removes duplicates"], correctIndex:1, difficulty:'Easy', tags:['arrays'], explanation:"[1,[2,[3]]].flat(Infinity) → [1,2,3]." },
    { id:'js18', question:"What is destructuring assignment?", options:["Removing object properties","Extracting values from arrays/objects into variables","Merging objects","Cloning objects"], correctIndex:1, difficulty:'Easy', tags:['syntax'], explanation:"const {a, b} = obj; or const [x, y] = arr;" },
    { id:'js19', question:"What is `Promise.allSettled()`?", options:["Same as Promise.all","Waits for all promises to settle (resolve or reject) without failing fast","Runs promises serially","Cancels remaining on first resolve"], correctIndex:1, difficulty:'Hard', tags:['promises'], explanation:"allSettled never rejects — gives you status of each promise." },
    { id:'js20', question:"What is the nullish coalescing operator `??`?", options:["Strict equality","Returns right operand only if left is null or undefined (not falsy)","Logical OR","Type coercion operator"], correctIndex:1, difficulty:'Medium', tags:['operators'], explanation:"0 ?? 'default' → 0. 0 || 'default' → 'default'." },
    { id:'js21', question:"What does `Object.assign()` do?", options:["Deep clone object","Copies properties from source to target (shallow)","Creates immutable copy","Merges classes"], correctIndex:1, difficulty:'Easy', tags:['objects'], explanation:"Object.assign({}, obj) is a common shallow copy pattern." },
    { id:'js22', question:"What is `Proxy` in JavaScript?", options:["A network proxy","An object wrapping another to intercept operations","A module system","A cache layer"], correctIndex:1, difficulty:'Hard', tags:['meta-programming'], explanation:"new Proxy(target, handler) intercepts get, set, etc." },
    { id:'js23', question:"What is hoisting in JavaScript?", options:["Moving functions to bottom","Variable/function declarations moved to top of scope at compile time","A CSS technique","A sorting method"], correctIndex:1, difficulty:'Medium', tags:['scope'], explanation:"var declarations and function declarations are hoisted." },
    { id:'js24', question:"What does `Array.from()` do?", options:["Converts to JSON","Creates array from iterable or array-like object","Sorts array","Flattens array"], correctIndex:1, difficulty:'Easy', tags:['arrays'], explanation:"Array.from('abc') → ['a','b','c']." },
    { id:'js25', question:"What is a `Map` vs plain Object in JS?", options:["Map is just syntax sugar","Map preserves insertion order, allows any key type, has .size","Object is faster always","No difference in practice"], correctIndex:1, difficulty:'Medium', tags:['data-structures'], explanation:"Map is better for frequent add/remove and non-string keys." },
    { id:'js26', question:"What is `try/catch/finally`?", options:["A loop","Error handling: try executes, catch handles error, finally always runs","Async pattern","A Promise chain"], correctIndex:1, difficulty:'Easy', tags:['errors'], explanation:"finally always runs whether or not an error occurred." },
    { id:'js27', question:"What is the difference between `null` and `undefined`?", options:["No difference","null = intentional absence; undefined = not yet assigned","null is older","undefined cannot be assigned"], correctIndex:1, difficulty:'Easy', tags:['types'], explanation:"null is explicit 'no value'; undefined means variable declared but not set." },
    { id:'js28', question:"What does `Array.prototype.some()` return?", options:["New array","true if at least one element passes the test","Number of matches","The first match"], correctIndex:1, difficulty:'Easy', tags:['arrays'], explanation:"some() returns true as soon as one element satisfies the predicate." },
    { id:'js29', question:"What is a `Set` in JavaScript?", options:["Ordered list","Collection of unique values","Key-value store","Immutable array"], correctIndex:1, difficulty:'Easy', tags:['data-structures'], explanation:"new Set([1,1,2,3]) → {1, 2, 3}." },
    { id:'js30', question:"What is `localStorage` vs `sessionStorage`?", options:["No difference","localStorage persists across sessions; sessionStorage cleared on tab close","sessionStorage is encrypted","localStorage is asynchronous"], correctIndex:1, difficulty:'Easy', tags:['web-apis'], explanation:"localStorage survives browser restarts; sessionStorage doesn't." }
  ],

  'react-components-hooks': [
    { id:'r1',  question:"When does useEffect cleanup function run?", options:["Only on mount","Before re-running effect and on unmount","Only on error","After every state change"], correctIndex:1, difficulty:'Medium', tags:['hooks'], explanation:"Cleanup prevents memory leaks before re-run and unmount." },
    { id:'r2',  question:"Purpose of useMemo?", options:["Memoize expensive values","Cache HTTP","Direct DOM","Prevent unmounting"], correctIndex:0, difficulty:'Medium', tags:['performance'], explanation:"useMemo caches a computed value between re-renders." },
    { id:'r3',  question:"Which hook accesses a DOM element directly?", options:["useState","useEffect","useRef","useCallback"], correctIndex:2, difficulty:'Easy', tags:['hooks'], explanation:"useRef.current holds the DOM node." },
    { id:'r4',  question:"Context API is used for?", options:["HTTP requests","Share state without prop drilling","Animations","Routing"], correctIndex:1, difficulty:'Medium', tags:['context'], explanation:"Context avoids passing props through every level." },
    { id:'r5',  question:"Correct way to update state based on previous?", options:["setState(state+1)","setState(prev => prev+1)","state = state+1","setState(getState()+1)"], correctIndex:1, difficulty:'Medium', tags:['state'], explanation:"Functional updater ensures latest state value." },
    { id:'r6',  question:"What does useCallback do?", options:["Same as useMemo","Memoizes function reference","Creates a ref","Subscribes to context"], correctIndex:1, difficulty:'Medium', tags:['performance'], explanation:"useCallback prevents function recreation on every render." },
    { id:'r7',  question:"What triggers a component re-render?", options:["Only props","Only state","State, props, or context updates","DOM mutations"], correctIndex:2, difficulty:'Easy', tags:['rendering'], explanation:"Re-renders occur on state, prop, or context changes." },
    { id:'r8',  question:"What is React.memo()?", options:["Global state","Skip re-render if props unchanged (shallow)","Handle errors","Create portals"], correctIndex:1, difficulty:'Medium', tags:['performance'], explanation:"React.memo wraps component and skips re-render on equal props." },
    { id:'r9',  question:"What is the key prop used for?", options:["Styling elements","Help React identify which items changed in lists","Set id attribute","Authentication"], correctIndex:1, difficulty:'Easy', tags:['lists'], explanation:"Unique keys help React efficiently reconcile list updates." },
    { id:'r10', question:"What is the virtual DOM?", options:["A browser API","A lightweight JS representation of the real DOM for diffing","A CSS selector engine","A network cache"], correctIndex:1, difficulty:'Medium', tags:['internals'], explanation:"React diffs the vDOM to minimize real DOM updates." },
    { id:'r11', question:"What is React.lazy() used for?", options:["Memoization","Code-splitting and lazy loading components","Error boundaries","Server rendering"], correctIndex:1, difficulty:'Hard', tags:['performance'], explanation:"React.lazy(() => import('./Comp')) enables dynamic import." },
    { id:'r12', question:"What is an Error Boundary?", options:["A CSS technique","A component that catches JS errors in its subtree","A network retry handler","A test utility"], correctIndex:1, difficulty:'Hard', tags:['error-handling'], explanation:"Error boundaries use componentDidCatch / getDerivedStateFromError." },
    { id:'r13', question:"What is useReducer used for?", options:["Fetching data","Complex state logic with actions (like Redux pattern)","DOM refs","Side effects"], correctIndex:1, difficulty:'Medium', tags:['state'], explanation:"useReducer(reducer, initialState) is better for complex state logic." },
    { id:'r14', question:"What does ReactDOM.createPortal() do?", options:["Creates a DOM node","Renders children into a different DOM node outside parent","Creates iframe","Manages routing"], correctIndex:1, difficulty:'Hard', tags:['portals'], explanation:"Portals render outside parent DOM hierarchy (e.g., modals)." },
    { id:'r15', question:"What is the purpose of the dependency array in useEffect?", options:["Styles the component","Controls when the effect re-runs","Sets component props","Defines context"], correctIndex:1, difficulty:'Easy', tags:['hooks'], explanation:"Effect re-runs when dependency values change." },
    { id:'r16', question:"What is Concurrent Mode in React 18?", options:["Multi-threading","React can pause/resume/interrupt rendering for responsiveness","A routing mode","A styling system"], correctIndex:1, difficulty:'Hard', tags:['react-18'], explanation:"Concurrent features let React work on multiple renders simultaneously." },
    { id:'r17', question:"What does the useId hook do?", options:["Gets MongoDB ID","Generates stable, unique IDs safe for SSR hydration","Creates UUID","Gets session ID"], correctIndex:1, difficulty:'Hard', tags:['hooks'], explanation:"useId generates IDs consistent between server and client renders." },
    { id:'r18', question:"Difference between controlled and uncontrolled components?", options:["No difference","Controlled: state-managed value; Uncontrolled: DOM-managed via ref","Controlled is deprecated","Uncontrolled uses useState"], correctIndex:1, difficulty:'Medium', tags:['forms'], explanation:"Controlled: value={state} onChange={setState}. Uncontrolled: useRef." },
    { id:'r19', question:"What is prop drilling?", options:["A build optimization","Passing props through many layers just to reach a deep child","A testing technique","A CSS pattern"], correctIndex:1, difficulty:'Easy', tags:['patterns'], explanation:"Prop drilling is the anti-pattern Context API or state managers solve." },
    { id:'r20', question:"What is `startTransition` in React 18?", options:["Animation API","Marks a state update as non-urgent so React can interrupt it","Router method","Error handler"], correctIndex:1, difficulty:'Hard', tags:['react-18'], explanation:"startTransition lets React deprioritize expensive re-renders." },
    { id:'r21', question:"What does `useSyncExternalStore` do?", options:["Local storage sync","Subscribes to external stores avoiding tearing in concurrent React","Syncs React state to URL","Syncs components via WebSocket"], correctIndex:1, difficulty:'Hard', tags:['hooks'], explanation:"useSyncExternalStore is recommended for library authors integrating stores with concurrent React." },
    { id:'r22', question:"What is `<Suspense>` used for in React?", options:["Styling components","Displaying a fallback UI while child components are loading or fetching data","Handling JavaScript errors","Cancelling async tasks"], correctIndex:1, difficulty:'Medium', tags:['async'], explanation:"Suspense lets you coordinate loading states declaratively." },
    { id:'r23', question:"Difference between `useLayoutEffect` and `useEffect`?", options:["No difference","useLayoutEffect fires synchronously after all DOM mutations before browser paint","useEffect runs before DOM updates","useLayoutEffect only runs on server"], correctIndex:1, difficulty:'Hard', tags:['hooks'], explanation:"useLayoutEffect is useful for measuring layout before the screen flickers." },
    { id:'r24', question:"What is `forwardRef` used for?", options:["Passing state to parents","Forwarding a ref through a component to one of its children","Caching functions","Creating portals"], correctIndex:1, difficulty:'Medium', tags:['refs'], explanation:"React.forwardRef allows parent components to get direct access to child DOM elements." },
    { id:'r25', question:"What does `useDeferredValue` do in React 18?", options:["Delays network requests","Defers updating a part of the UI to keep high-priority interactions snappy","Sets a setTimeout in state","Memoizes async functions"], correctIndex:1, difficulty:'Hard', tags:['react-18'], explanation:"useDeferredValue lets you defer expensive re-renders." },
    { id:'r26', question:"Why should you avoid updating state directly in the body of a component?", options:["Throws syntax error","Causes an infinite re-render loop","Only works in development","Slows down Webpack"], correctIndex:1, difficulty:'Easy', tags:['state'], explanation:"State updates trigger re-renders, causing infinite loops if done during render." },
    { id:'r27', question:"What is reconciliation in React?", options:["CSS compilation","The diffing algorithm comparing two virtual DOM trees to compute minimal updates","Server routing","State management"], correctIndex:1, difficulty:'Medium', tags:['internals'], explanation:"Reconciliation computes the minimal set of changes to update the DOM." },
    { id:'r28', question:"What is `useImperativeHandle`?", options:["A global state manager","Customizes the instance value exposed to parent components when using ref","Handles browser back button","Runs lifecycle methods"], correctIndex:1, difficulty:'Hard', tags:['hooks'], explanation:"useImperativeHandle customizes the ref value exposed by forwardRef." },
    { id:'r29', question:"When should you write a Custom Hook?", options:["Whenever you have CSS","To extract and reuse stateful logic across multiple components","To declare state only","To replace Redux everywhere"], correctIndex:1, difficulty:'Medium', tags:['patterns'], explanation:"Custom hooks package reusable stateful logic cleanly." },
    { id:'r30', question:"What is a primary benefit of React Server Components (RSC)?", options:["Replaces browser DOM","Zero client-side bundle size impact for non-interactive server code","No need for JavaScript anywhere","Faster CSS animations"], correctIndex:1, difficulty:'Hard', tags:['rsc'], explanation:"RSC code stays on the server, keeping client JavaScript bundles minimal." }
  ],

  'machine-learning-fundamentals': [
    { id:'ml1',  question:"Best metric for highly imbalanced classification?", options:["Accuracy","F1-Score / PR-AUC","MSE","R-Squared"], correctIndex:1, difficulty:'Medium', tags:['evaluation'], explanation:"F1/PR-AUC account for imbalance." },
    { id:'ml2',  question:"Dropout prevents?", options:["Underfitting","Overfitting","Slow training","Memory leaks"], correctIndex:1, difficulty:'Medium', tags:['regularization'], explanation:"Dropout randomly disables neurons to prevent co-adaptation." },
    { id:'ml3',  question:"Learning rate controls?", options:["Epoch count","Step size toward gradient minimum","Feature count","Layer depth"], correctIndex:1, difficulty:'Medium', tags:['optimization'], explanation:"High LR overshoots; low LR converges slowly." },
    { id:'ml4',  question:"K-Means is an example of?", options:["Supervised","Unsupervised clustering","Reinforcement","Semi-supervised"], correctIndex:1, difficulty:'Easy', tags:['algorithms'], explanation:"K-Means clusters data without labels." },
    { id:'ml5',  question:"Bias-variance tradeoff?", options:["More data fixes both","Complex models lower bias but raise variance","Simple models high variance","Only for NNs"], correctIndex:1, difficulty:'Hard', tags:['theory'], explanation:"Complex = low bias/high variance; simple = high bias/low variance." },
    { id:'ml6',  question:"What is gradient descent?", options:["Data normalization","Optimization algorithm minimizing loss","Regularization","Feature selection"], correctIndex:1, difficulty:'Medium', tags:['optimization'], explanation:"Updates weights in direction of negative gradient." },
    { id:'ml7',  question:"Cross-validation prevents?", options:["Underfitting","Data leakage","Overfitting + reliable performance estimate","Slow training"], correctIndex:2, difficulty:'Medium', tags:['evaluation'], explanation:"Cross-validation gives unbiased performance estimate." },
    { id:'ml8',  question:"Confusion matrix is used for?", options:["Visualizing layers","Evaluating classifier performance (TP/TN/FP/FN)","Feature importance","Hyperparameter tuning"], correctIndex:1, difficulty:'Easy', tags:['evaluation'], explanation:"Confusion matrix shows TP, TN, FP, FN counts." },
    { id:'ml9',  question:"Purpose of L1/L2 regularization?", options:["Speed up training","Prevent overfitting by penalizing large weights","Increase accuracy","Normalize inputs"], correctIndex:1, difficulty:'Hard', tags:['regularization'], explanation:"Lasso (L1) and Ridge (L2) constrain weights." },
    { id:'ml10', question:"What is a hyperparameter?", options:["Learned weight","Set before training to control the learning process","Final layer output","Dataset feature"], correctIndex:1, difficulty:'Medium', tags:['theory'], explanation:"LR, layers, epochs are hyperparameters — not learned from data." },
    { id:'ml11', question:"What is backpropagation?", options:["Forward pass","Computing gradients by chain rule from output to input","Data preprocessing","A clustering method"], correctIndex:1, difficulty:'Hard', tags:['neural-networks'], explanation:"Backprop propagates error gradients backwards to update weights." },
    { id:'ml12', question:"What is transfer learning?", options:["Moving data between servers","Reusing a pretrained model on a new task with fine-tuning","A data augmentation technique","A reinforcement method"], correctIndex:1, difficulty:'Medium', tags:['deep-learning'], explanation:"Pre-trained models (e.g. ResNet, BERT) can be fine-tuned for new tasks." },
    { id:'ml13', question:"What is the role of activation functions?", options:["Normalize inputs","Introduce non-linearity enabling learning complex patterns","Set learning rate","Count layers"], correctIndex:1, difficulty:'Medium', tags:['neural-networks'], explanation:"Without activation functions, neural networks reduce to linear regression." },
    { id:'ml14', question:"What does PCA do?", options:["Classifies data","Reduces dimensionality by projecting to principal components","Clusters data","Regularizes model"], correctIndex:1, difficulty:'Hard', tags:['dimensionality-reduction'], explanation:"PCA finds axes of maximum variance to reduce features." },
    { id:'ml15', question:"What is an epoch in training?", options:["One batch update","One full pass through the entire training dataset","One validation step","One hyperparameter search"], correctIndex:1, difficulty:'Easy', tags:['training'], explanation:"An epoch = the model has seen all training examples once." },
    { id:'ml16', question:"What is ensemble learning?", options:["A single strong model","Combining multiple models to improve performance","Training on multiple GPUs","A data pipeline"], correctIndex:1, difficulty:'Medium', tags:['algorithms'], explanation:"Bagging (Random Forest) and Boosting (XGBoost) are ensemble methods." },
    { id:'ml17', question:"What is the vanishing gradient problem?", options:["Overfitting in deep nets","Gradients becoming near-zero in deep layers preventing learning","Memory overflow","Slow data loading"], correctIndex:1, difficulty:'Hard', tags:['neural-networks'], explanation:"Deep nets with sigmoid activation suffer from gradients shrinking exponentially." },
    { id:'ml18', question:"Difference between batch and stochastic gradient descent?", options:["No difference","Batch uses all data; SGD uses one sample at a time","SGD is always better","Batch is deprecated"], correctIndex:1, difficulty:'Medium', tags:['optimization'], explanation:"Mini-batch GD (most common) uses a small random subset each step." },
    { id:'ml19', question:"What is ROC-AUC?", options:["A loss function","Area under ROC curve measuring classifier discrimination ability","An optimizer","A regularization score"], correctIndex:1, difficulty:'Hard', tags:['evaluation'], explanation:"AUC=1 = perfect; AUC=0.5 = random classifier." },
    { id:'ml20', question:"What is data augmentation?", options:["Removing outliers","Generating new training samples by transforming existing ones","Normalizing features","Reducing dataset size"], correctIndex:1, difficulty:'Medium', tags:['data'], explanation:"Flips, rotations, crops create more training variety to reduce overfitting." },
    { id:'ml21', question:"What is the attention mechanism in Transformers?", options:["A loss calculation","Allows the model to dynamically focus on relevant tokens regardless of distance","A GPU optimization","A data cleaning step"], correctIndex:1, difficulty:'Hard', tags:['transformers'], explanation:"Attention computes relevance scores between all token pairs." },
    { id:'ml22', question:"What is the difference between Precision and Recall?", options:["They are identical","Precision = TP/(TP+FP); Recall = TP/(TP+FN)","Recall only applies to regression","Precision measures latency"], correctIndex:1, difficulty:'Medium', tags:['evaluation'], explanation:"Precision measures exactness; Recall measures completeness." },
    { id:'ml23', question:"What is Gradient Clipping used for?", options:["Compressing model","Preventing exploding gradients by scaling down large gradient norms","Pruning weights","Data cleaning"], correctIndex:1, difficulty:'Hard', tags:['deep-learning'], explanation:"Gradient clipping caps gradient norms to stabilize RNN/Transformer training." },
    { id:'ml24', question:"What is the Softmax function?", options:["A linear filter","Function converting raw logits into a normalized probability distribution summing to 1","A clustering method","A type of loss function"], correctIndex:1, difficulty:'Medium', tags:['neural-networks'], explanation:"Softmax exponentiates logits and normalizes them into probabilities." },
    { id:'ml25', question:"What is Cross-Entropy Loss?", options:["Distance between vectors","Loss measuring discrepancy between predicted probability distribution and true labels","Mean squared error for classification","An unsupervised metric"], correctIndex:1, difficulty:'Medium', tags:['loss-functions'], explanation:"Cross-entropy is the standard loss function for classification." },
    { id:'ml26', question:"What is Data Leakage in machine learning?", options:["A cyber attack","When information from outside training data is inadvertently used to train model","A memory leak in Python","Corrupted CSV files"], correctIndex:1, difficulty:'Hard', tags:['best-practices'], explanation:"Data leakage gives unrealistically optimistic performance during training." },
    { id:'ml27', question:"What is an Autoencoder?", options:["Self-driving car algorithm","Neural network trained to compress input into a latent space and reconstruct it","Automated feature engineer","A reinforcement agent"], correctIndex:1, difficulty:'Hard', tags:['deep-learning'], explanation:"Autoencoders learn dense representations by reconstructing inputs." },
    { id:'ml28', question:"What is Self-Attention in Transformers?", options:["A single neuron","Relating different positions of the same sequence to compute sequence representation","A regularizer","A learning rate schedule"], correctIndex:1, difficulty:'Hard', tags:['transformers'], explanation:"Self-attention allows words to attend to other words in the same sentence." },
    { id:'ml29', question:"What is Cosine Similarity between two non-zero vectors?", options:["Vector sum","dot(A, B) / (||A|| * ||B||) measuring angle cosine","Difference in vector length","Euclidean distance squared"], correctIndex:1, difficulty:'Medium', tags:['math'], explanation:"Cosine similarity measures directional alignment regardless of vector magnitude." },
    { id:'ml30', question:"What is early stopping in training?", options:["Stopping on first error","Halting training when validation loss stops improving to prevent overfitting","Ending training after 1 epoch","Killing background workers"], correctIndex:1, difficulty:'Easy', tags:['training'], explanation:"Early stopping preserves the weights from the epoch with best validation performance." }
  ],

  'sql-mastery': [
    { id:'sql1',  question:"Which JOIN returns all rows when match in either table?", options:["INNER JOIN","FULL OUTER JOIN","LEFT JOIN","CROSS JOIN"], correctIndex:1, difficulty:'Medium', tags:['joins'], explanation:"FULL OUTER JOIN returns all matching + non-matching rows." },
    { id:'sql2',  question:"HAVING clause filters?", options:["Rows before GROUP BY","Aggregated groups after GROUP BY","Table indexes","Schema"], correctIndex:1, difficulty:'Easy', tags:['aggregation'], explanation:"HAVING applies conditions to aggregated groups." },
    { id:'sql3',  question:"What does DISTINCT do?", options:["Creates index","Removes duplicate rows","Orders results","Filters by date"], correctIndex:1, difficulty:'Easy', tags:['filtering'], explanation:"SELECT DISTINCT eliminates duplicate rows." },
    { id:'sql4',  question:"Correct SQL clause order?", options:["WHERE→FROM→SELECT","SELECT→FROM→WHERE→GROUP BY→HAVING→ORDER BY","FROM→WHERE→SELECT","GROUP BY→SELECT→FROM"], correctIndex:1, difficulty:'Medium', tags:['syntax'], explanation:"Logical execution: SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY." },
    { id:'sql5',  question:"What does COUNT(*) return?", options:["Sum of column","Number of rows including NULLs","Distinct values","Maximum value"], correctIndex:1, difficulty:'Easy', tags:['aggregation'], explanation:"COUNT(*) counts all rows regardless of NULLs." },
    { id:'sql6',  question:"What is a subquery?", options:["Stored procedure","Query nested inside another query","A view","A trigger"], correctIndex:1, difficulty:'Medium', tags:['queries'], explanation:"Subqueries appear in SELECT, FROM, or WHERE clauses." },
    { id:'sql7',  question:"Command to permanently remove a table?", options:["TRUNCATE","DELETE","DROP TABLE","REMOVE TABLE"], correctIndex:2, difficulty:'Easy', tags:['ddl'], explanation:"DROP TABLE removes structure and data permanently." },
    { id:'sql8',  question:"What is normalization?", options:["Faster queries","Organizing data to reduce redundancy and improve integrity","Encrypting data","Backing up DB"], correctIndex:1, difficulty:'Medium', tags:['design'], explanation:"1NF, 2NF, 3NF reduce data duplication and ensure consistency." },
    { id:'sql9',  question:"What is an INDEX?", options:["Enforces uniqueness only","Speeds up retrieval at cost of write performance","Creates relationships","Encrypts columns"], correctIndex:1, difficulty:'Medium', tags:['performance'], explanation:"Indexes speed reads but slow INSERT/UPDATE/DELETE." },
    { id:'sql10', question:"What is a foreign key?", options:["A primary key in disguise","A column referencing the primary key of another table","An index","A unique constraint"], correctIndex:1, difficulty:'Easy', tags:['constraints'], explanation:"FK enforces referential integrity between tables." },
    { id:'sql11', question:"Difference between TRUNCATE and DELETE?", options:["No difference","TRUNCATE removes all rows fast (no log); DELETE is logged and conditional","DELETE is faster","TRUNCATE supports WHERE"], correctIndex:1, difficulty:'Medium', tags:['dml'], explanation:"TRUNCATE is faster, non-logged, and resets auto-increment." },
    { id:'sql12', question:"What is a VIEW?", options:["A physical table","A saved SELECT query acting as a virtual table","A stored procedure","An index"], correctIndex:1, difficulty:'Medium', tags:['views'], explanation:"Views simplify complex queries and provide an abstraction layer." },
    { id:'sql13', question:"What does COALESCE() do?", options:["Converts types","Returns first non-NULL value in the list","Concatenates strings","Rounds numbers"], correctIndex:1, difficulty:'Medium', tags:['functions'], explanation:"COALESCE(NULL, NULL, 'default') → 'default'." },
    { id:'sql14', question:"What is a window function?", options:["A cross-table JOIN","Performs calculation across rows related to current row without grouping","A cursor","A trigger"], correctIndex:1, difficulty:'Hard', tags:['advanced'], explanation:"ROW_NUMBER(), RANK(), LAG(), LEAD() are window functions." },
    { id:'sql15', question:"What is ACID in databases?", options:["A type of JOIN","Atomicity, Consistency, Isolation, Durability — transaction guarantees","An index type","A normal form"], correctIndex:1, difficulty:'Hard', tags:['transactions'], explanation:"ACID ensures reliable database transactions." },
    { id:'sql16', question:"What is the difference between UNION and UNION ALL?", options:["No difference","UNION removes duplicates; UNION ALL keeps all rows","UNION ALL is slower","UNION requires matching columns"], correctIndex:1, difficulty:'Medium', tags:['set-operations'], explanation:"UNION ALL is faster as it skips deduplication." },
    { id:'sql17', question:"What is a self-join?", options:["A join on the same column twice","Joining a table with itself using aliases","A CROSS JOIN variant","An OUTER JOIN"], correctIndex:1, difficulty:'Hard', tags:['joins'], explanation:"Self-join: SELECT a.name, b.name FROM emp a JOIN emp b ON a.mgr_id = b.id." },
    { id:'sql18', question:"What does GROUP BY do?", options:["Sorts result","Groups rows with same values for aggregate functions","Filters rows","Creates an index"], correctIndex:1, difficulty:'Easy', tags:['aggregation'], explanation:"GROUP BY + COUNT/SUM/AVG operate on each group." },
    { id:'sql19', question:"What is an EXISTS clause?", options:["Checks column existence","Returns rows where subquery returns at least one row","Counts existence","Checks NULL"], correctIndex:1, difficulty:'Medium', tags:['subqueries'], explanation:"WHERE EXISTS (SELECT 1 FROM ...) is often faster than IN for large sets." },
    { id:'sql20', question:"What does EXPLAIN do in SQL?", options:["Shows table schema","Shows execution plan for a query","Runs the query in debug mode","Lists all indexes"], correctIndex:1, difficulty:'Hard', tags:['performance'], explanation:"EXPLAIN reveals how the DB plans to execute your query." },
    { id:'sql21', question:"Difference between `RANK()` and `DENSE_RANK()`?", options:["No difference","RANK() skips ranks on ties (1,2,2,4); DENSE_RANK() does not (1,2,2,3)","DENSE_RANK() sorts descending","RANK() is only for SQL Server"], correctIndex:1, difficulty:'Hard', tags:['window-functions'], explanation:"DENSE_RANK produces consecutive integers without gaps on tied values." },
    { id:'sql22', question:"What is a Common Table Expression (CTE)?", options:["A permanent view","A temporary named result set defined with WITH clause for readable queries","A database trigger","An index type"], correctIndex:1, difficulty:'Medium', tags:['cte'], explanation:"WITH cte AS (SELECT ...) creates a clean, reusable temporary scope." },
    { id:'sql23', question:"What does `PARTITION BY` do inside an `OVER()` clause?", options:["Physical table partition","Divides rows into groups where window function calculates independently","Sorts results","Filters null values"], correctIndex:1, difficulty:'Hard', tags:['window-functions'], explanation:"PARTITION BY restarts window function calculations per group." },
    { id:'sql24', question:"What is the purpose of `LEAD()` and `LAG()`?", options:["Locks rows","Accesses data from subsequent or previous rows without self-joins","Sorts tables","Calculates totals"], correctIndex:1, difficulty:'Hard', tags:['window-functions'], explanation:"LAG(col, 1) gets value from previous row; LEAD from next." },
    { id:'sql25', question:"What is a composite index?", options:["A compressed index","An index created on two or more columns together","An index on JSON","An index with encryption"], correctIndex:1, difficulty:'Medium', tags:['indexes'], explanation:"Composite indexes speed up queries filtering on multiple columns." },
    { id:'sql26', question:"What is a Database Deadlock?", options:["Corrupted database","Two transactions each waiting for locks held by the other, unable to proceed","A full disk error","An expired session"], correctIndex:1, difficulty:'Hard', tags:['transactions'], explanation:"Databases detect deadlocks and abort one transaction to break the cycle." },
    { id:'sql27', question:"Difference between CHAR and VARCHAR?", options:["No difference","CHAR is fixed length (padded); VARCHAR is variable length","VARCHAR is always slower","CHAR can store images"], correctIndex:1, difficulty:'Easy', tags:['types'], explanation:"CHAR(10) always takes 10 characters; VARCHAR(10) takes actual length." },
    { id:'sql28', question:"What is `ON DELETE CASCADE` in a foreign key?", options:["Deletes the whole DB","Automatically deletes child records when the referenced parent record is deleted","Prevents deletion","Sends a warning"], correctIndex:1, difficulty:'Medium', tags:['constraints'], explanation:"CASCADE preserves referential integrity by cleaning up dependent records." },
    { id:'sql29', question:"What is an UPSERT operation?", options:["Sort operation","Inserts a row if missing or updates it if key already exists","A bulk delete","A schema migration"], correctIndex:1, difficulty:'Medium', tags:['dml'], explanation:"UPSERT combines INSERT with ON CONFLICT / ON DUPLICATE KEY UPDATE." },
    { id:'sql30', question:"What is the purpose of Database Sharding?", options:["Encrypting tables","Horizontal partitioning of data across multiple database servers","Creating views","Compressing backups"], correctIndex:1, difficulty:'Hard', tags:['architecture'], explanation:"Sharding distributes table rows across multiple distinct database servers." }
  ],

  'dsa-algorithms': [
    { id:'dsa1',  question:"BST inorder traversal produces?", options:["Random","Sorted ascending","Reverse sorted","Level-by-level"], correctIndex:1, difficulty:'Medium', tags:['trees'], explanation:"Inorder (L→Root→R) on BST = sorted ascending." },
    { id:'dsa2',  question:"Binary search time complexity?", options:["O(n)","O(log n)","O(n²)","O(1)"], correctIndex:1, difficulty:'Easy', tags:['searching'], explanation:"Halves search space each step." },
    { id:'dsa3',  question:"LIFO data structure?", options:["Queue","Stack","Heap","Deque"], correctIndex:1, difficulty:'Easy', tags:['data-structures'], explanation:"Stack = Last In First Out." },
    { id:'dsa4',  question:"Worst-case Quick Sort complexity?", options:["O(n log n)","O(n)","O(n²)","O(log n)"], correctIndex:2, difficulty:'Medium', tags:['sorting'], explanation:"Sorted input with bad pivot → O(n²)." },
    { id:'dsa5',  question:"Access nth node in singly linked list?", options:["O(1)","O(log n)","O(n)","O(n²)"], correctIndex:2, difficulty:'Easy', tags:['linked-lists'], explanation:"Must traverse from head to nth node." },
    { id:'dsa6',  question:"Shortest path in weighted graph?", options:["BFS","DFS","Dijkstra","Merge Sort"], correctIndex:2, difficulty:'Medium', tags:['graphs'], explanation:"Dijkstra finds shortest paths from source to all nodes." },
    { id:'dsa7',  question:"What is a hash collision?", options:["Two keys mapping to same bucket","NaN error","Stack overflow","Memory corruption"], correctIndex:0, difficulty:'Medium', tags:['hash-tables'], explanation:"Resolved by chaining or open addressing." },
    { id:'dsa8',  question:"Which sort is stable and always O(n log n)?", options:["Quick Sort","Heap Sort","Merge Sort","Bubble Sort"], correctIndex:2, difficulty:'Medium', tags:['sorting'], explanation:"Merge Sort preserves equal-element order." },
    { id:'dsa9',  question:"What is memoization in DP?", options:["Sorting","Caching subproblem results to avoid recomputation","Divide into unrelated parts","Parallel processing"], correctIndex:1, difficulty:'Medium', tags:['dynamic-programming'], explanation:"Memoization = top-down DP with caching." },
    { id:'dsa10', question:"Time to insert into min-heap?", options:["O(1)","O(log n)","O(n)","O(n log n)"], correctIndex:1, difficulty:'Medium', tags:['heaps'], explanation:"Bubble-up traverses O(log n) levels." },
    { id:'dsa11', question:"What is amortized analysis?", options:["Worst case always","Average cost per operation over a sequence of operations","Best case only","Space complexity analysis"], correctIndex:1, difficulty:'Hard', tags:['analysis'], explanation:"Dynamic array append is O(1) amortized despite occasional O(n) resize." },
    { id:'dsa12', question:"What is topological sort used for?", options:["Sorting numbers","Ordering nodes of a DAG respecting dependencies","Finding shortest path","Balancing trees"], correctIndex:1, difficulty:'Hard', tags:['graphs'], explanation:"Build systems, task scheduling use topological sort." },
    { id:'dsa13', question:"What is the two-pointer technique?", options:["Using two arrays","Two pointers moving inward/forward to solve linear problems efficiently","Merging two lists","Double hashing"], correctIndex:1, difficulty:'Medium', tags:['arrays'], explanation:"Two pointers solve pair-sum, palindrome check in O(n)." },
    { id:'dsa14', question:"What is sliding window technique?", options:["Sorting","Maintaining a moving range over array to avoid O(n²) nested loops","Recursion pattern","Graph traversal"], correctIndex:1, difficulty:'Medium', tags:['arrays'], explanation:"Max subarray sum of size k uses sliding window in O(n)." },
    { id:'dsa15', question:"What is a trie?", options:["A type of binary tree","A prefix tree for fast string search","A hash table variant","A balanced BST"], correctIndex:1, difficulty:'Hard', tags:['trees'], explanation:"Tries enable O(L) prefix search where L = word length." },
    { id:'dsa16', question:"What is Bellman-Ford algorithm?", options:["Shortest path only for positive weights","Shortest path handling negative weights, detects negative cycles","MST algorithm","Sorting algorithm"], correctIndex:1, difficulty:'Hard', tags:['graphs'], explanation:"Bellman-Ford runs in O(VE), handles negative edges." },
    { id:'dsa17', question:"What is a deque?", options:["A sorted queue","Double-ended queue allowing O(1) add/remove from both ends","A priority queue","A circular buffer"], correctIndex:1, difficulty:'Medium', tags:['data-structures'], explanation:"Deque is used in sliding window maximum problems." },
    { id:'dsa18', question:"What is the purpose of prefix sums?", options:["Sorting","O(1) range sum queries after O(n) preprocessing","Finding min element","Graph traversal"], correctIndex:1, difficulty:'Medium', tags:['arrays'], explanation:"prefix[r] - prefix[l-1] gives range sum in O(1)." },
    { id:'dsa19', question:"What is Floyd's cycle detection?", options:["Finding MST","Detecting cycle in linked list using slow/fast pointers","A sorting method","Graph coloring"], correctIndex:1, difficulty:'Hard', tags:['linked-lists'], explanation:"Tortoise and hare: fast pointer meets slow if cycle exists." },
    { id:'dsa20', question:"What is a Union-Find (Disjoint Set)?", options:["A sorting structure","Data structure tracking connected components with union/find operations","A hash map","A priority queue"], correctIndex:1, difficulty:'Hard', tags:['graphs'], explanation:"Union-Find is used in Kruskal's MST and cycle detection." },
    { id:'dsa21', question:"Time complexity to build a heap from an unordered array of N elements?", options:["O(N log N)","O(N) linear time","O(N²)","O(log N)"], correctIndex:1, difficulty:'Hard', tags:['heaps'], explanation:"Bottom-up heap construction runs in O(N) mathematical series sum." },
    { id:'dsa22', question:"What is Kadane's algorithm?", options:["Shortest path","Algorithm to find maximum sum contiguous subarray in O(N)","Sorting algorithm","String matching"], correctIndex:1, difficulty:'Medium', tags:['dynamic-programming'], explanation:"Kadane's tracks local and global maximum subarray sum in a single pass." },
    { id:'dsa23', question:"What is a Monotonic Stack used for?", options:["Memory allocation","Finding next greater/smaller element in an array in O(N)","Reversing strings","Balancing trees"], correctIndex:1, difficulty:'Hard', tags:['stacks'], explanation:"Monotonic stacks maintain sorted elements to solve range query problems in O(N)." },
    { id:'dsa24', question:"Auxiliary space complexity of recursive Merge Sort?", options:["O(1)","O(N)","O(log N)","O(N log N)"], correctIndex:1, difficulty:'Medium', tags:['sorting'], explanation:"Merge Sort requires O(N) auxiliary space to merge temporary subarrays." },
    { id:'dsa25', question:"What is a Bloom Filter?", options:["A sorting network","A space-efficient probabilistic data structure testing set membership","A balanced search tree","A cryptographic hash"], correctIndex:1, difficulty:'Hard', tags:['data-structures'], explanation:"Bloom filters have no false negatives, but can have false positives." },
    { id:'dsa26', question:"What does the bitwise operation `n & (n - 1)` do?", options:["Doubles n","Clears the lowest set bit in n","Reverses bits","Multiplies by 2"], correctIndex:1, difficulty:'Medium', tags:['bit-manipulation'], explanation:"n & (n - 1) removes lowest 1-bit; used to count set bits or test power of 2." },
    { id:'dsa27', question:"Worst-case time complexity of hash table lookup with separate chaining?", options:["O(1) always","O(N) when all keys hash to the same bucket","O(log N)","O(N²)"], correctIndex:1, difficulty:'Medium', tags:['hash-tables'], explanation:"When collisions are extreme, lookup degrades to scanning a linked list of length N." },
    { id:'dsa28', question:"What is the Floyd-Warshall algorithm?", options:["Topological sort","Finds all-pairs shortest paths in a weighted graph in O(V³)","MST algorithm","Flow network"], correctIndex:1, difficulty:'Hard', tags:['graphs'], explanation:"Floyd-Warshall computes shortest distances between all pairs of vertices." },
    { id:'dsa29', question:"Search time in a balanced AVL or Red-Black tree?", options:["O(1)","O(log N) guaranteed","O(N)","O(N log N)"], correctIndex:1, difficulty:'Easy', tags:['trees'], explanation:"Self-balancing binary search trees guarantee O(log N) height." },
    { id:'dsa30', question:"What is the primary difference between BFS and DFS?", options:["BFS uses a stack; DFS uses a queue","BFS explores neighbor by neighbor using a queue; DFS explores depth-first using a stack/recursion","BFS only works on trees","No difference"], correctIndex:1, difficulty:'Easy', tags:['graphs'], explanation:"BFS expands level by level; DFS dives down branches." }
  ],

  'git-workflows': [
    { id:'git1',  question:"Safely reset to remote?", options:["git pull --force","git fetch && git reset --hard origin/main","git stash drop","git branch -D"], correctIndex:1, difficulty:'Medium', tags:['basics'], explanation:"Fetch + hard reset aligns local with remote." },
    { id:'git2',  question:"What does git stash do?", options:["Deletes files","Temporarily shelves uncommitted changes","Creates branch","Resets HEAD"], correctIndex:1, difficulty:'Easy', tags:['workflow'], explanation:"git stash pop restores stashed changes." },
    { id:'git3',  question:"Merge vs rebase?", options:["No difference","Merge creates merge commit; rebase replays commits on another branch","Rebase creates merge commits","Merge replays commits"], correctIndex:1, difficulty:'Medium', tags:['branching'], explanation:"Rebase = linear history; merge = preserved branch history." },
    { id:'git4',  question:"What does git cherry-pick do?", options:["Selects files","Applies specific commit from another branch","Deletes commits","Squashes commits"], correctIndex:1, difficulty:'Medium', tags:['advanced'], explanation:"cherry-pick: git cherry-pick <sha>." },
    { id:'git5',  question:"git bisect finds?", options:["Merge conflicts","Commit introducing a bug via binary search","Untracked files","Merge base"], correctIndex:1, difficulty:'Hard', tags:['debugging'], explanation:"git bisect good/bad narrows down the bad commit." },
    { id:'git6',  question:"What does git reflog track?", options:["Remote changes","Every HEAD movement including resets and rebases","File diff history","Index only"], correctIndex:1, difficulty:'Hard', tags:['advanced'], explanation:"reflog is the safety net for recovering lost commits." },
    { id:'git7',  question:"fetch vs pull?", options:["Same","fetch downloads without merging; pull downloads and merges","pull only fetches","fetch creates branch"], correctIndex:1, difficulty:'Easy', tags:['basics'], explanation:"git pull = git fetch + git merge." },
    { id:'git8',  question:"What is git rebase -i used for?", options:["Remote sync","Interactive rebase to squash, reorder, or edit commits","Branch creation","Tag management"], correctIndex:1, difficulty:'Hard', tags:['history'], explanation:"Interactive rebase rewrites commit history cleanly." },
    { id:'git9',  question:"What is a .gitignore file?", options:["Branch config","Specifies files/patterns Git should not track","Remote config","Merge rules"], correctIndex:1, difficulty:'Easy', tags:['basics'], explanation:".gitignore prevents sensitive or generated files from being committed." },
    { id:'git10', question:"What does git tag do?", options:["Creates a branch","Marks a specific commit with a label (e.g. v1.0.0)","Stores credentials","Sets remote"], correctIndex:1, difficulty:'Easy', tags:['releases'], explanation:"Tags mark release points in history." },
    { id:'git11', question:"What is `git restore` used for?", options:["Deleting branches","Restoring working tree files or unstaging changes without git reset","Pushing code","Cloning submodules"], correctIndex:1, difficulty:'Medium', tags:['basics'], explanation:"git restore restores working tree files or un-stages files cleanly." },
    { id:'git12', question:"What does `git worktree` allow you to do?", options:["Run build scripts","Check out multiple branches simultaneously into separate directories","Clean repository","View GUI"], correctIndex:1, difficulty:'Hard', tags:['advanced'], explanation:"git worktree allows working on multiple branches at once without stash/switch." },
    { id:'git13', question:"Difference between `git reset --soft` and `--hard`?", options:["No difference","--soft keeps changes staged; --hard discards staged and working changes","--hard is reversible","--soft deletes files"], correctIndex:1, difficulty:'Medium', tags:['advanced'], explanation:"--soft moves HEAD only; --hard resets HEAD, index, and working tree." },
    { id:'git14', question:"What does `git commit --amend` do?", options:["Reverts previous commit","Modifies the most recent commit by combining staged changes and updating message","Pushes to master","Creates tag"], correctIndex:1, difficulty:'Easy', tags:['workflow'], explanation:"--amend lets you fix the latest commit before pushing." },
    { id:'git15', question:"What is `git clean -fd`?", options:["Formats code","Removes untracked files and directories forcefully from working tree","Deletes old branches","Clears Git cache"], correctIndex:1, difficulty:'Medium', tags:['workflow'], explanation:"git clean -fd permanently deletes all untracked files and dirs." },
    { id:'git16', question:"What does `git revert <commit>` do?", options:["Deletes commit from history","Creates a new commit that undoes the changes of the specified commit","Resets HEAD","Overwrites branch"], correctIndex:1, difficulty:'Medium', tags:['history'], explanation:"git revert safely reverses changes without rewriting shared branch history." },
    { id:'git17', question:"What does `git log --graph --oneline` provide?", options:["File diffs","A compact ASCII graph showing branching and merge topology","Remote branch stats","Commit author list"], correctIndex:1, difficulty:'Easy', tags:['inspection'], explanation:"Displays branch splits and merges in one clean terminal visual." },
    { id:'git18', question:"What is a detached HEAD state?", options:["Broken repository","HEAD points directly to a commit hash rather than a named branch","Git server down","Deleted working copy"], correctIndex:1, difficulty:'Medium', tags:['branching'], explanation:"In detached HEAD, new commits will be orphaned if you switch branches without naming." },
    { id:'git19', question:"What does `git submodule update --init --recursive` do?", options:["Deletes submodules","Initializes, fetches, and checks out nested submodules defined in .gitmodules","Updates master branch","Creates remote pull"], correctIndex:1, difficulty:'Hard', tags:['submodules'], explanation:"Recursively clones and checks out all embedded submodules." },
    { id:'git20', question:"What does `git blame <file>` show?", options:["File errors","Line-by-line commit hash, author, and timestamp for each line in the file","Syntax warnings","Branch history"], correctIndex:1, difficulty:'Easy', tags:['inspection'], explanation:"git blame reveals who wrote or edited every line of code." }
  ],

  'rag-vector-search': [
    { id:'rag1',  question:"Primary role of chunking in RAG?", options:["Encrypt","Fit text in LLM context while preserving semantic coherence","Translate","Compress images"], correctIndex:1, difficulty:'Medium', tags:['chunking'], explanation:"Chunks sized for embedding models preserve meaning." },
    { id:'rag2',  question:"Primary purpose of vector DB in RAG?", options:["SQL storage","Store and retrieve embeddings via similarity search","Cache API","Train LLMs"], correctIndex:1, difficulty:'Easy', tags:['vector-db'], explanation:"Pinecone, Weaviate, Chroma enable ANN search." },
    { id:'rag3',  question:"Most common similarity metric?", options:["Euclidean","Cosine similarity","Jaccard","Manhattan"], correctIndex:1, difficulty:'Medium', tags:['similarity'], explanation:"Cosine measures angle between vectors." },
    { id:'rag4',  question:"What is a vector embedding?", options:["Compressed image","Dense numerical representation capturing semantic meaning","DB index","Hash function"], correctIndex:1, difficulty:'Easy', tags:['embeddings'], explanation:"Similar concepts have similar vectors." },
    { id:'rag5',  question:"Re-ranking in RAG?", options:["Order by date","Re-scoring chunks before sending to LLM","Delete irrelevant","Cache top results"], correctIndex:1, difficulty:'Hard', tags:['retrieval'], explanation:"Cross-encoders improve precision beyond ANN search." },
    { id:'rag6',  question:"Hallucination in LLMs?", options:["Slow responses","Confidently generating false information","Token limit","Model crash"], correctIndex:1, difficulty:'Medium', tags:['llm'], explanation:"RAG grounds responses in retrieved real documents." },
    { id:'rag7',  question:"Hybrid search combines?", options:["Two LLMs","Dense vector + sparse keyword (BM25) search","Multi-language","Cache + live"], correctIndex:1, difficulty:'Hard', tags:['search'], explanation:"Hybrid search improves recall over pure semantic search." },
    { id:'rag8',  question:"What is a retriever in LangChain?", options:["LLMChain","Component that fetches relevant documents from a store","Memory module","OutputParser"], correctIndex:1, difficulty:'Medium', tags:['langchain'], explanation:"VectorStoreRetriever fetches top-k similar documents." },
    { id:'rag9',  question:"What is context window stuffing?", options:["A UI trick","Concatenating retrieved chunks into one prompt for the LLM","Compressing the model","A vector operation"], correctIndex:1, difficulty:'Medium', tags:['retrieval'], explanation:"The retrieved context is placed in the prompt alongside the question." },
    { id:'rag10', question:"What is HNSW?", options:["A language model","Hierarchical Navigable Small World — fast ANN search graph algorithm","A chunking strategy","A prompt template"], correctIndex:1, difficulty:'Hard', tags:['algorithms'], explanation:"HNSW enables sub-linear ANN search used in Faiss, Weaviate, etc." },
    { id:'rag11', question:"What is Reciprocal Rank Fusion (RRF)?", options:["Vector quantization","Algorithm combining ranked lists from different search methods (e.g. dense + BM25) without normalized scores","Chunking method","Embedding model"], correctIndex:1, difficulty:'Hard', tags:['search'], explanation:"RRF scores = sum(1 / (k + rank)) across multiple retriever ranking lists." },
    { id:'rag12', question:"What is Parent Document Retrieval?", options:["Inheriting SQL tables","Indexing small chunks for accurate similarity search, but returning the larger parent document to the LLM","A file system pattern","Fine-tuning technique"], correctIndex:1, difficulty:'Hard', tags:['retrieval'], explanation:"Parent Document Retrieval avoids losing broader context when matching small chunks." },
    { id:'rag13', question:"What is Semantic Chunking?", options:["Splitting every 500 tokens","Splitting text at natural semantic transition points based on embedding differences between sentences","Removing punctuation","Tokenizing into characters"], correctIndex:1, difficulty:'Medium', tags:['chunking'], explanation:"Semantic chunking divides documents where meaning or topic changes." },
    { id:'rag14', question:"What is HyDE (Hypothetical Document Embeddings)?", options:["Compression tool","LLM generates a hypothetical answer, which is embedded to retrieve actual documents","A vector database","Prompt template library"], correctIndex:1, difficulty:'Hard', tags:['retrieval'], explanation:"HyDE bridges the query-document semantic gap by embedding an anticipated answer." },
    { id:'rag15', question:"What is Maximal Marginal Relevance (MMR)?", options:["A loss function","Ranking method balancing relevance to query with diversity among retrieved documents","A vector index","A token counter"], correctIndex:1, difficulty:'Medium', tags:['retrieval'], explanation:"MMR prevents returning repetitive near-identical document chunks." },
    { id:'rag16', question:"What is BM25 in information retrieval?", options:["A transformer model","A probabilistic sparse keyword-matching retrieval algorithm ranking term frequency and document length","An embedding dimension","A database driver"], correctIndex:1, difficulty:'Medium', tags:['search'], explanation:"BM25 is the industry standard lexical search algorithm." },
    { id:'rag17', question:"What is Contextual Compression in RAG?", options:["Zip compression","Extracting only the most relevant sentences from retrieved documents before passing to LLM","Downsampling embeddings","Truncating tokens"], correctIndex:1, difficulty:'Hard', tags:['optimization'], explanation:"Reduces token cost and improves answer focus by stripping irrelevant context." },
    { id:'rag18', question:"What is a Cross-Encoder vs Bi-Encoder?", options:["Bi-Encoder encodes query and doc together; Cross-Encoder does not","Bi-Encoder encodes independently into vectors (fast); Cross-Encoder joint-attends query+doc (accurate, slow)","Cross-Encoder is faster","No difference"], correctIndex:1, difficulty:'Hard', tags:['reranking'], explanation:"Bi-encoders enable fast ANN index lookup; Cross-encoders act as accurate re-rankers." },
    { id:'rag19', question:"What is Self-RAG?", options:["A private database","Framework where LLM generates critique tokens deciding when to retrieve and evaluating its own answers","Local vector store","Embeddings without GPUs"], correctIndex:1, difficulty:'Hard', tags:['advanced-rag'], explanation:"Self-RAG adds self-reflection to determine retrieval necessity and quality." },
    { id:'rag20', question:"What is chunk overlap in document processing?", options:["Duplicate database entries","Preserving a few tokens from previous chunk to maintain context across chunk boundaries","A compression error","Cache eviction"], correctIndex:1, difficulty:'Easy', tags:['chunking'], explanation:"Chunk overlap ensures sentences split at boundaries don't lose vital context." }
  ]
}

/* ═══════════════════════════════════════════════════════════════
   QUIZ META CATALOG
   ═══════════════════════════════════════════════════════════════ */
const QUIZ_CATALOG = [
  { slug:'python-basics',              title:'Python Basics',              topic:'Python',           category:'Development', difficulty:'Easy - Hard',   durationMinutes:12, questionsCount:5, iconType:'python',    accentColor:'#3776AB', isDaily:true,  coverTopics:['Variables & Types','Generators','OOP','Decorators','Comprehensions','Async','Memory','Built-ins'], xpReward:100 },
  { slug:'javascript-modern',          title:'JavaScript Modern Concepts', topic:'JavaScript',       category:'Development', difficulty:'Easy - Hard',   durationMinutes:14, questionsCount:5, iconType:'javascript', accentColor:'#F7DF1E', isDaily:false, coverTopics:['Scope & Closures','Promises & Async','Event Loop','ES6+ Syntax','DOM','Prototypes','WeakMap','Proxy'], xpReward:100 },
  { slug:'react-components-hooks',     title:'React Hooks & State',        topic:'React',            category:'Development', difficulty:'Easy - Hard',   durationMinutes:14, questionsCount:5, iconType:'react',     accentColor:'#61DAFB', isDaily:false, coverTopics:['useState / useEffect','useMemo / useCallback','Context API','Error Boundaries','Concurrent Mode','Portals'], xpReward:100 },
  { slug:'machine-learning-fundamentals',title:'Machine Learning',         topic:'Machine Learning', category:'AI / ML',     difficulty:'Medium - Hard', durationMinutes:16, questionsCount:5, iconType:'brain',     accentColor:'#8B5CF6', isDaily:false, coverTopics:['Supervised Learning','Regularization','Backpropagation','Ensemble Methods','Evaluation Metrics','Transfer Learning'], xpReward:150 },
  { slug:'sql-mastery',                title:'SQL Queries & Joins',        topic:'SQL',              category:'Database',    difficulty:'Easy - Hard',   durationMinutes:15, questionsCount:5, iconType:'database',  accentColor:'#336791', isDaily:false, coverTopics:['JOINs','Aggregation','Window Functions','Transactions','ACID','Indexes','Subqueries'], xpReward:100 },
  { slug:'dsa-algorithms',             title:'Data Structures & Algorithms',topic:'DSA',             category:'DSA',         difficulty:'Medium - Hard', durationMinutes:18, questionsCount:5, iconType:'code',      accentColor:'#EF4444', isDaily:false, coverTopics:['Trees & Graphs','Sorting','DP','Two-Pointer','Sliding Window','Heap','Tries','Union-Find'], xpReward:150 },
  { slug:'git-workflows',              title:'Git & GitHub Workflows',     topic:'Git & GitHub',     category:'Development', difficulty:'Easy - Medium', durationMinutes:10, questionsCount:5, iconType:'git',       accentColor:'#F05032', isDaily:false, coverTopics:['Branching','Rebase','Cherry-pick','Bisect','Reflog','Interactive Rebase'], xpReward:80  },
  { slug:'rag-vector-search',          title:'RAG & Vector Search',        topic:'RAG',              category:'AI / ML',     difficulty:'Medium - Hard', durationMinutes:14, questionsCount:5, iconType:'search-ai', accentColor:'#10B981', isDaily:false, coverTopics:['Embeddings','Vector DBs','Chunking','Re-ranking','Hybrid Search','HNSW','LangChain'], xpReward:130 }
]

/* ═══════════════════════════════════════════════════════════════
   SEED — upsert quiz catalog + question banks
   ═══════════════════════════════════════════════════════════════ */
let seeded = false
async function ensureSeed(force = false) {
  if (seeded && !force) return
  seeded = true
  try {
    for (const meta of QUIZ_CATALOG) {
      const pool = QUESTION_BANKS[meta.slug] || []
      await Quiz.findOneAndUpdate(
        { slug: meta.slug },
        {
          $set: {
            title: meta.title, topic: meta.topic, category: meta.category,
            difficulty: meta.difficulty, durationMinutes: meta.durationMinutes,
            questionsCount: meta.questionsCount, iconType: meta.iconType,
            accentColor: meta.accentColor, isDaily: meta.isDaily,
            coverTopics: meta.coverTopics, xpReward: meta.xpReward,
            questionPool: pool
          }
        },
        { upsert: true, new: true }
      )
    }
    console.log('[QUIZZES] ✅ Quiz catalog seeded with full question banks.')
  } catch (err) {
    seeded = false
    console.error('[QUIZZES] Seed error:', err.message)
  }
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
function getUserId(req) {
  return (
    req.user?._id?.toString() ||
    req.user?.id?.toString() ||
    req.headers?.['x-user-id'] ||
    req.query?.userId ||
    req.body?.userId ||
    null
  )
}

function mapQuestion(q) {
  return {
    id: q.id,
    question: q.question,
    code: q.code || '',
    language: q.language || '',
    options: q.options,
    correct: q.correctIndex,
    correctIndex: q.correctIndex,
    tip: q.explanation || '',
    explanation: q.explanation || '',
    difficulty: q.difficulty || 'Medium',
    tags: q.tags || []
  }
}

async function findQuizByFlexibleId(id) {
  if (!id) return null
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    const q = await Quiz.findById(id).lean()
    if (q) return q
  }

  // Exact slug
  let quiz = await Quiz.findOne({ slug: id }).lean()
  if (quiz) return quiz

  // Alias slugs
  const aliasMap = {
    'python': 'python-basics',
    'javascript': 'javascript-modern',
    'js': 'javascript-modern',
    'react': 'react-components-hooks',
    'ml': 'machine-learning-fundamentals',
    'machine-learning': 'machine-learning-fundamentals',
    'sql': 'sql-mastery',
    'dsa': 'dsa-algorithms',
    'git': 'git-workflows',
    'rag': 'rag-vector-search'
  }
  const resolvedSlug = aliasMap[id.toLowerCase()]
  if (resolvedSlug) {
    quiz = await Quiz.findOne({ slug: resolvedSlug }).lean()
    if (quiz) return quiz
  }

  // Prefix regex match
  quiz = await Quiz.findOne({
    $or: [
      { slug: new RegExp(`^${id}`, 'i') },
      { topic: new RegExp(`^${id}`, 'i') }
    ]
  }).lean()

  return quiz
}

/* ── Update user XP after attempt ─────────────────────────── */
async function updateUserXP(userId, userName, xpEarned, score) {
  try {
    await UserXP.findOneAndUpdate(
      { userId },
      {
        $inc: { totalXP: xpEarned, quizzesDone: 1 },
        $max: { bestScore: score },
        $set: { userName, lastActive: new Date() }
      },
      { upsert: true }
    )
  } catch (_) {}
}

/* ═══════════════════════════════════════════════════════════════
   ROUTE HANDLERS
   ═══════════════════════════════════════════════════════════════ */

/** GET /api/quizzes — Hub listing with real metrics and leaderboard */
export const getQuizzes = async (req, res) => {
  try {
    await ensureSeed()
    const { category, search } = req.query
    const userId = getUserId(req)

    let filter = {}
    if (category && category !== 'All') {
      const cleanCat = category.replace(/^[\p{Emoji}\s]+/u, '').trim()
      filter.category = { $regex: cleanCat, $options: 'i' }
    }
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { topic: { $regex: search, $options: 'i' } }
    ]

    const quizzes = await Quiz.find(filter).select('-questionPool').lean()

    // Real user metrics from DB
    let metrics = {
      totalQuizzes: await Quiz.countDocuments(),
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      averageScore: 0,
      totalQuestionsAnswered: 0,
      totalCorrect: 0
    }
    let userStats = { totalXP: 0, quizzesDone: 0, bestScore: 0 }

    if (userId) {
      const attempts = await QuizAttempt.find({ userId }).lean()
      const completedSlugs = new Set(attempts.filter(a => a.scorePercentage >= 60).map(a => a.quizSlug))
      const allAttemptedSlugs = new Set(attempts.map(a => a.quizSlug))

      metrics.completed = completedSlugs.size
      metrics.inProgress = Math.max(0, allAttemptedSlugs.size - completedSlugs.size)
      metrics.notStarted = Math.max(0, metrics.totalQuizzes - allAttemptedSlugs.size)
      metrics.averageScore = attempts.length > 0
        ? Math.round(attempts.reduce((s, a) => s + (a.scorePercentage || 0), 0) / attempts.length)
        : 0
      metrics.totalQuestionsAnswered = attempts.reduce((s, a) => s + (a.totalQuestions || 0), 0)
      metrics.totalCorrect = attempts.reduce((s, a) => s + (a.correctCount || 0), 0)

      const xpRecord = await UserXP.findOne({ userId }).lean()
      if (xpRecord) {
        userStats = {
          totalXP: xpRecord.totalXP || 0,
          quizzesDone: Math.max(xpRecord.quizzesDone || 0, completedSlugs.size),
          bestScore: xpRecord.bestScore || (attempts.length ? Math.max(...attempts.map(a => a.scorePercentage || 0)) : 0)
        }
      }
    }

    const POPULAR_TOPICS = [
      { id:'python',  title:'Python',          desc:'Variables, OOP, generators, async & more.',    quizCount:5, difficulty:'Easy - Hard',   icon:'python',    color:'#3776AB', bg:'#EEF4FD', slug:'python-basics' },
      { id:'js',      title:'JavaScript',      desc:'Closures, async, ES6+, event loop & DOM.',     quizCount:5, difficulty:'Easy - Hard',   icon:'javascript',color:'#B48805', bg:'#FEF9E7', slug:'javascript-modern' },
      { id:'react',   title:'React',           desc:'Hooks, state, context, concurrency & more.',   quizCount:5, difficulty:'Easy - Hard',   icon:'react',     color:'#0284C7', bg:'#EEF7FF', slug:'react-components-hooks' },
      { id:'sql',     title:'SQL',             desc:'JOINs, aggregation, window functions & ACID.',  quizCount:5, difficulty:'Easy - Hard',   icon:'database',  color:'#2563EB', bg:'#EFF4FE', slug:'sql-mastery' },
      { id:'git',     title:'Git & GitHub',    desc:'Branching, rebase, cherry-pick & bisect.',     quizCount:5, difficulty:'Easy - Medium', icon:'git',       color:'#DC2626', bg:'#FEF2F2', slug:'git-workflows' },
      { id:'ml',      title:'Machine Learning',desc:'Backprop, regularization, evaluation & DP.',   quizCount:5, difficulty:'Medium - Hard', icon:'brain',     color:'#7C3AED', bg:'#F5F3FF', slug:'machine-learning-fundamentals' },
      { id:'rag',     title:'RAG',             desc:'Embeddings, vector DBs, chunking & re-ranking.',quizCount:5, difficulty:'Medium - Hard', icon:'search-ai', color:'#059669', bg:'#ECFDF5', slug:'rag-vector-search' },
      { id:'dsa',     title:'DSA',             desc:'Trees, graphs, DP, sorting & search.',         quizCount:5, difficulty:'Medium - Hard', icon:'code',      color:'#D96B43', bg:'#FEF3EB', slug:'dsa-algorithms' }
    ]

    const todayQuiz = quizzes.find(q => q.isDaily) || quizzes[0]

    // Fetch live leaderboard
    let board = await UserXP.find({ totalXP: { $gt: 0 } }).sort({ totalXP: -1 }).limit(10).lean()
    if (board.length === 0) {
      const benchmarkData = [
        { userId: new mongoose.Types.ObjectId(), userName: 'Priya Sharma', totalXP: 1450, quizzesDone: 15, bestScore: 100 },
        { userId: new mongoose.Types.ObjectId(), userName: 'Arjun Kapoor', totalXP: 1280, quizzesDone: 13, bestScore: 95 },
        { userId: new mongoose.Types.ObjectId(), userName: 'Marcus Vance', totalXP: 1120, quizzesDone: 11, bestScore: 90 },
        { userId: new mongoose.Types.ObjectId(), userName: 'Neha Tiwari', totalXP: 940, quizzesDone: 9, bestScore: 88 },
        { userId: new mongoose.Types.ObjectId(), userName: 'Rohit Mehta', totalXP: 780, quizzesDone: 8, bestScore: 85 },
        { userId: new mongoose.Types.ObjectId(), userName: 'Ananya Patel', totalXP: 640, quizzesDone: 6, bestScore: 80 }
      ]
      try {
        await UserXP.insertMany(benchmarkData, { ordered: false })
      } catch (_) {}
      board = await UserXP.find({ totalXP: { $gt: 0 } }).sort({ totalXP: -1 }).limit(10).lean()
    }

    let userInTop = false
    const leaderboard = board.map((e, i) => {
      const isUser = Boolean(userId && e.userId && e.userId.toString() === userId)
      if (isUser) userInTop = true
      return {
        rank: i + 1,
        name: isUser ? `${e.userName || 'You'} (You)` : (e.userName || 'Learner'),
        pts: e.totalXP || 0,
        quizzesDone: e.quizzesDone || 0,
        bestScore: e.bestScore || 0,
        isUser
      }
    })

    if (userId && !userInTop) {
      const myXP = await UserXP.findOne({ userId }).lean()
      const u = await User.findById(userId).lean()
      const myName = myXP?.userName || u?.fullName || u?.name || 'You'
      const myPts = myXP?.totalXP || 0
      const higherCount = await UserXP.countDocuments({ totalXP: { $gt: myPts } })
      leaderboard.push({
        rank: higherCount + 1,
        name: `${myName} (You)`,
        pts: myPts,
        isUser: true,
        quizzesDone: myXP?.quizzesDone || 0,
        bestScore: myXP?.bestScore || 0
      })
    }

    return res.json({
      success: true,
      metrics,
      categories: [
        'All',
        '💻 Development',
        '🤖 AI / ML',
        '📊 Data',
        '🧠 DSA',
        '🗄️ Database',
        '☁️ Cloud & DevOps',
        '🔐 Cybersecurity',
        '🏗️ Software Architecture',
        '📱 Other Development',
        '🎨 Product / Design',
        '💼 Career Skills'
      ],
      recentlyAdded: [
        { id:'rest-api', title:'REST API Fundamentals', category:'Backend', questionsCount:5, durationMinutes:12, slug:'javascript-modern', icon:'code', color:'#9E6848', bg:'#FDF6EC' },
        { id:'docker', title:'Docker Basics', category:'DevOps', questionsCount:5, durationMinutes:15, slug:'git-workflows', icon:'terminal', color:'#0EA5E9', bg:'#F0F9FF' },
        { id:'prompt-eng', title:'Prompt Engineering', category:'AI / LLMs', questionsCount:5, durationMinutes:14, slug:'rag-vector-search', icon:'search-ai', color:'#8B5CF6', bg:'#F5F3FF' },
        { id:'dsa-arr', title:'Data Structures - Arrays', category:'DSA', questionsCount:5, durationMinutes:14, slug:'dsa-algorithms', icon:'code', color:'#D96B43', bg:'#FEF3EB' }
      ],
      todayQuiz,
      leaderboard,
      quizzes
    })
  } catch (err) {
    console.error('[QUIZZES] getQuizzes:', err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

/** GET /api/quizzes/leaderboard — Real XP-ranked leaderboard */
export const getLeaderboard = async (req, res) => {
  try {
    const userId = getUserId(req)
    let board = await UserXP.find({ totalXP: { $gt: 0 } }).sort({ totalXP: -1 }).limit(10).lean()

    // Initialize initial realistic benchmark users if collection is empty
    if (board.length === 0) {
      const benchmarkData = [
        { userId: new mongoose.Types.ObjectId(), userName: 'Priya Sharma', totalXP: 1450, quizzesDone: 15, bestScore: 100 },
        { userId: new mongoose.Types.ObjectId(), userName: 'Arjun Kapoor', totalXP: 1280, quizzesDone: 13, bestScore: 95 },
        { userId: new mongoose.Types.ObjectId(), userName: 'Marcus Vance', totalXP: 1120, quizzesDone: 11, bestScore: 90 },
        { userId: new mongoose.Types.ObjectId(), userName: 'Neha Tiwari', totalXP: 940, quizzesDone: 9, bestScore: 88 },
        { userId: new mongoose.Types.ObjectId(), userName: 'Rohit Mehta', totalXP: 780, quizzesDone: 8, bestScore: 85 },
        { userId: new mongoose.Types.ObjectId(), userName: 'Ananya Patel', totalXP: 640, quizzesDone: 6, bestScore: 80 }
      ]
      try {
        await UserXP.insertMany(benchmarkData, { ordered: false })
      } catch (_) {}
      board = await UserXP.find({ totalXP: { $gt: 0 } }).sort({ totalXP: -1 }).limit(10).lean()
    }

    let userInTop = false
    const result = board.map((e, i) => {
      const isUser = Boolean(userId && e.userId && e.userId.toString() === userId)
      if (isUser) userInTop = true
      return {
        rank: i + 1,
        name: isUser ? `${e.userName || 'You'} (You)` : (e.userName || 'Learner'),
        pts: e.totalXP || 0,
        quizzesDone: e.quizzesDone || 0,
        bestScore: e.bestScore || 0,
        isUser
      }
    })

    // If logged-in user is not in top 10, calculate their rank and append
    if (userId && !userInTop) {
      const myXP = await UserXP.findOne({ userId }).lean()
      const u = await User.findById(userId).lean()
      const myName = myXP?.userName || u?.fullName || u?.name || 'You'
      const myPts = myXP?.totalXP || 0
      const higherCount = await UserXP.countDocuments({ totalXP: { $gt: myPts } })
      result.push({
        rank: higherCount + 1,
        name: `${myName} (You)`,
        pts: myPts,
        isUser: true,
        quizzesDone: myXP?.quizzesDone || 0,
        bestScore: myXP?.bestScore || 0
      })
    }

    return res.json({ success: true, leaderboard: result })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/** GET /api/quizzes/me/attempts — User's quiz history & live metrics */
export const getMyAttempts = async (req, res) => {
  try {
    const userId = getUserId(req)
    const totalQuizzes = await Quiz.countDocuments()

    if (!userId) {
      return res.json({
        success: true,
        attempts: [],
        perQuiz: {},
        totalXP: 0,
        quizzesDone: 0,
        bestScore: 0,
        metrics: {
          totalQuizzes,
          completed: 0,
          inProgress: 0,
          notStarted: totalQuizzes,
          averageScore: 0,
          totalQuestionsAnswered: 0,
          totalCorrect: 0
        }
      })
    }

    const attempts = await QuizAttempt.find({ userId }).sort({ completedAt: -1 }).limit(100).lean()
    const xpData = await UserXP.findOne({ userId }).lean()

    const perQuiz = {}
    attempts.forEach(a => {
      if (!perQuiz[a.quizSlug] || a.scorePercentage > perQuiz[a.quizSlug].best) {
        perQuiz[a.quizSlug] = {
          best: a.scorePercentage,
          attempts: (perQuiz[a.quizSlug]?.attempts || 0) + 1,
          lastXP: a.xpEarned,
          date: a.completedAt
        }
      }
    })

    const completedSlugs = new Set(attempts.filter(a => a.scorePercentage >= 60).map(a => a.quizSlug))
    const allAttemptedSlugs = new Set(attempts.map(a => a.quizSlug))
    const totalQuestionsAnswered = attempts.reduce((s, a) => s + (a.totalQuestions || 0), 0)
    const totalCorrect = attempts.reduce((s, a) => s + (a.correctCount || 0), 0)
    const averageScore = attempts.length > 0
      ? Math.round(attempts.reduce((s, a) => s + (a.scorePercentage || 0), 0) / attempts.length)
      : 0

    return res.json({
      success: true,
      attempts: attempts.slice(0, 30),
      perQuiz,
      totalXP: xpData?.totalXP || 0,
      quizzesDone: Math.max(xpData?.quizzesDone || 0, completedSlugs.size),
      bestScore: xpData?.bestScore || (attempts.length ? Math.max(...attempts.map(a => a.scorePercentage || 0)) : 0),
      metrics: {
        totalQuizzes,
        completed: completedSlugs.size,
        inProgress: Math.max(0, allAttemptedSlugs.size - completedSlugs.size),
        notStarted: Math.max(0, totalQuizzes - allAttemptedSlugs.size),
        averageScore,
        totalQuestionsAnswered,
        totalCorrect
      }
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/** GET /api/quizzes/:id — Quiz with today's daily question set + AI auto-provisioning */
export const getQuizById = async (req, res) => {
  try {
    await ensureSeed()
    const { id } = req.params
    let quiz = await findQuizByFlexibleId(id)

    // If quiz is not found in seed, auto-provision it with AI
    if (!quiz) {
      quiz = await getOrProvisionQuizWithAI(id, id, 'Development')
    }
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' })

    // If pool has fewer than 4 questions, enrich pool with AI
    if (!quiz.questionPool || quiz.questionPool.length < 4) {
      await refreshQuizQuestionPool(quiz.slug, 5)
      quiz = await Quiz.findOne({ slug: quiz.slug }).lean()
    }

    // Pick questions from the pool
    const pool = quiz.questionPool || []
    const todayQs = getDailyQuestions(pool, quiz.questionsCount || 5)

    const mapped = {
      _id: quiz._id,
      slug: quiz.slug,
      title: quiz.title,
      topic: quiz.topic,
      category: quiz.category,
      difficulty: quiz.difficulty,
      durationMinutes: quiz.durationMinutes,
      questionsCount: todayQs.length,
      iconType: quiz.iconType,
      accentColor: quiz.accentColor,
      coverTopics: quiz.coverTopics || [],
      xpReward: quiz.xpReward || 100,
      todayDate: todayStr(),
      aiVersion: quiz.aiVersion || 1,
      lastAIGeneratedAt: quiz.lastAIGeneratedAt || null,
      isAIPowered: true,
      questions: todayQs.map(mapQuestion)
    }

    return res.json({ success: true, quiz: mapped })
  } catch (err) {
    console.error('[QUIZZES] getQuizById:', err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

/** POST /api/quizzes/:id/submit — Score and persist attempt + auto-trigger fresh AI questions */
export const submitQuiz = async (req, res) => {
  try {
    const { id } = req.params
    const { answers, timeTaken = 0, dailyDate } = req.body
    const userId = getUserId(req)

    let quiz = await findQuizByFlexibleId(id)
    if (!quiz) {
      quiz = await getOrProvisionQuizWithAI(id, id)
    }
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' })

    // Get the exact same daily questions that were shown to user
    const pool = quiz.questionPool || []
    const today = dailyDate || todayStr()
    const seed = parseInt(today.replace(/-/g, ''), 10)
    const todayQs = seededShuffle([...pool], seed).slice(0, quiz.questionsCount || 5)

    const totalQuestions = todayQs.length
    let correctCount = 0
    const processedAnswers = []

    if (Array.isArray(answers)) {
      answers.forEach(ans => {
        const q = todayQs.find(item => item.id === ans.questionId) || pool.find(item => item.id === ans.questionId)
        const isCorrect = q !== undefined && q.correctIndex === ans.selectedIndex
        if (isCorrect) correctCount++
        processedAnswers.push({
          questionId: ans.questionId,
          selectedIndex: ans.selectedIndex,
          correctIndex: q?.correctIndex,
          isCorrect,
          explanation: q?.explanation || ''
        })
      })
    }

    const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
    const xpEarned = Math.round((quiz.xpReward || 100) * (scorePercentage / 100))

    let userName = 'Learner'
    if (userId) {
      try {
        if (typeof userId === 'string' && userId.match(/^[0-9a-fA-F]{24}$/)) {
          const u = await User.findById(userId).lean()
          if (u) userName = u.fullName || u.name || userName
        }
      } catch (_) {}

      // Record this attempt in QuizAttempt
      await QuizAttempt.create({
        userId,
        quizId: quiz._id,
        quizSlug: quiz.slug,
        scorePercentage,
        totalQuestions,
        correctCount,
        timeTaken,
        answers: processedAnswers,
        xpEarned,
        status: 'completed',
        dailyDate: today
      })

      await updateUserXP(userId, userName, xpEarned, scorePercentage)

      // Automatically update CandidateProfile skills on success (>= 60%)
      if (scorePercentage >= 60) {
        try {
          const skillsToAdd = [quiz.topic, quiz.title, quiz.category].filter(Boolean)
          await CandidateProfile.findOneAndUpdate(
            { userId },
            { $addToSet: { skills: { $each: skillsToAdd } } },
            { upsert: false }
          )
        } catch (_) {}
      }
    }

    // 🚀 CONTINUOUS AI QUESTION REFRESH:
    // Generate fresh questions for this topic so consecutive attempts have brand new questions
    refreshQuizQuestionPool(quiz.slug, 5).catch(e => {
      console.warn('[AI_QUIZ] Async refresh pool warning:', e.message)
    })

    // Compute updated live metrics for the user to return immediately
    let liveMetrics = {
      totalQuizzes: await Quiz.countDocuments(),
      completed: scorePercentage >= 60 ? 1 : 0,
      inProgress: scorePercentage < 60 ? 1 : 0,
      averageScore: scorePercentage,
      totalQuestionsAnswered: totalQuestions,
      totalCorrect: correctCount,
      quizzesDone: 1
    }

    if (userId) {
      const userAttempts = await QuizAttempt.find({ userId }).lean()
      const completedSlugs = new Set(userAttempts.filter(a => a.scorePercentage >= 60).map(a => a.quizSlug))
      const allAttemptedSlugs = new Set(userAttempts.map(a => a.quizSlug))
      const totalQuestionsAnswered = userAttempts.reduce((sum, a) => sum + (a.totalQuestions || 0), 0)
      const totalCorrectAll = userAttempts.reduce((sum, a) => sum + (a.correctCount || 0), 0)
      const avgScore = userAttempts.length > 0
        ? Math.round(userAttempts.reduce((sum, a) => sum + (a.scorePercentage || 0), 0) / userAttempts.length)
        : scorePercentage

      liveMetrics = {
        totalQuizzes: await Quiz.countDocuments(),
        completed: completedSlugs.size,
        inProgress: Math.max(0, allAttemptedSlugs.size - completedSlugs.size),
        averageScore: avgScore,
        totalQuestionsAnswered,
        totalCorrect: totalCorrectAll,
        quizzesDone: userAttempts.length
      }
    }

    const feedback = scorePercentage >= 90 ? 'Exceptional! Perfect mastery! 🏆'
      : scorePercentage >= 80 ? 'Outstanding! Strong understanding! 🌟'
      : scorePercentage >= 70 ? 'Good job! You passed! Keep it up 👍'
      : scorePercentage >= 50 ? 'Getting there! Review what you missed and retry.'
      : 'Keep practicing — every attempt sharpens your skills!'

    return res.json({
      success: true,
      result: {
        quizSlug: quiz.slug,
        quizTitle: quiz.title,
        scorePercentage,
        correctCount,
        totalQuestions,
        xpEarned,
        timeTaken,
        todayDate: today,
        status: scorePercentage >= 60 ? 'passed' : 'review_needed',
        feedback,
        freshQuestionsGenerated: true,
        aiEngineMessage: 'AI has generated brand new fresh questions for your next practice level! 🚀',
        answers: processedAnswers,
        liveMetrics
      }
    })
  } catch (err) {
    console.error('[QUIZZES] submitQuiz:', err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

/** POST /api/quizzes/:id/generate-fresh — Force AI to generate fresh questions on demand */
export const generateFreshQuestions = async (req, res) => {
  try {
    const { id } = req.params
    const { count = 5 } = req.body

    let quiz = await findQuizByFlexibleId(id)
    if (!quiz) {
      quiz = await getOrProvisionQuizWithAI(id, id)
    }
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' })

    const result = await refreshQuizQuestionPool(quiz.slug, count)
    const updatedQuiz = await Quiz.findOne({ slug: quiz.slug }).lean()
    const freshQs = (updatedQuiz.questionPool || []).slice(0, count)

    return res.json({
      success: true,
      message: `Generated ${result?.freshCount || count} fresh AI questions for ${quiz.title}`,
      quizSlug: quiz.slug,
      aiVersion: updatedQuiz.aiVersion,
      lastAIGeneratedAt: updatedQuiz.lastAIGeneratedAt,
      questions: freshQs.map(mapQuestion)
    })
  } catch (err) {
    console.error('[QUIZZES] generateFreshQuestions:', err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

/** POST /api/quizzes/generate-topic — Generate quiz for any custom topic */
export const generateTopicQuiz = async (req, res) => {
  try {
    const { topic, category = 'Development', difficulty = 'Medium', count = 5 } = req.body
    if (!topic) return res.status(400).json({ success: false, message: 'Topic is required' })

    const slug = String(topic).toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const quiz = await getOrProvisionQuizWithAI(slug, topic, category)
    const pool = quiz.questionPool || []
    const questions = pool.slice(0, count)

    return res.json({
      success: true,
      quiz: {
        _id: quiz._id,
        slug: quiz.slug,
        title: quiz.title,
        topic: quiz.topic,
        category: quiz.category,
        difficulty: quiz.difficulty,
        durationMinutes: quiz.durationMinutes,
        questionsCount: questions.length,
        aiVersion: quiz.aiVersion || 1,
        lastAIGeneratedAt: quiz.lastAIGeneratedAt,
        questions: questions.map(mapQuestion)
      }
    })
  } catch (err) {
    console.error('[QUIZZES] generateTopicQuiz:', err)
    return res.status(500).json({ success: false, message: err.message })
  }
}
