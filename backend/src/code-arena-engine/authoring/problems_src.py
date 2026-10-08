# Batch 1: 37 problems. Add more files like this (problems_src2.py ...) and import them in build.py.
from factory import P, rl, S
import math

# ---------------- Arrays & Hashing ----------------
def g_twosum(r, big):
    while True:
        n = 5000 if big else r.randint(2, 10)
        nums = r.sample(range(-10**9, 10**9) if big else range(-30, 30), n)
        i, j = r.sample(range(n), 2); t = nums[i] + nums[j]; s = set(nums)
        if sum(1 for x in nums if (t - x) in s and t - x != x) == 2: return [nums, t]
P("two-sum", "Two Sum", "EASY", ["Array", "Hash Table"],
 "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`. Exactly one solution exists, and you may not use the same element twice. The answer may be returned in any order.",
 "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nExactly one valid answer exists.", "twoSum(nums, target)",
 "def twoSum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i\n",
 g_twosum, [[[2,7,11,15],9],[[3,2,4],6],[[3,3],6]], [[[0,4,3,0],0],[[-1,-2,-3,-4,-5],-8]], hasbig=True, checker="UNORDERED",
 brute="def twoSum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i+1, len(nums)):\n            if nums[i]+nums[j]==target: return [i,j]\n",
 hint="Store each number's index in a hash map as you scan.")

P("contains-duplicate", "Contains Duplicate", "EASY", ["Array", "Hash Table"],
 "Given an integer array `nums`, return `true` if any value appears at least twice, and `false` if every element is distinct.",
 "1 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9", "containsDuplicate(nums)",
 "def containsDuplicate(nums):\n    return len(set(nums)) != len(nums)\n",
 lambda r, big: [rl(r, 20000, -10**9, 10**9) if big else rl(r, r.randint(1, 10), -20, 20)], [[[1,2,3,1]],[[1,2,3,4]]], [[[7]],[[5,5]]], hasbig=True,
 brute="def containsDuplicate(nums):\n    for i in range(len(nums)):\n        if nums[i] in nums[i+1:]: return True\n    return False\n")

def g_anagram(r, big):
    n = 20000 if big else r.randint(1, 8); s = S(r, n, "abc"); t = list(s); r.shuffle(t)
    if r.random() < .5: t[r.randrange(n)] = r.choice("abcd")
    return [s, "".join(t)]
P("valid-anagram", "Valid Anagram", "EASY", ["String", "Hash Table"],
 "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s` (same letters, same counts, any order), otherwise `false`.",
 "1 <= s.length, t.length <= 5 * 10^4\ns and t consist of lowercase English letters.", "isAnagram(s, t)",
 "def isAnagram(s, t):\n    from collections import Counter\n    return Counter(s) == Counter(t)\n", g_anagram,
 [["anagram","nagaram"],["rat","car"]], [[ "a","a"],["ab","a"]], hasbig=True,
 brute="def isAnagram(s, t):\n    return sorted(s) == sorted(t)\n")

P("group-anagrams", "Group Anagrams", "MEDIUM", ["Array", "Hash Table", "String", "Sorting"],
 "Given an array of strings `strs`, group the anagrams together. Return the groups in any order, and the strings inside each group in any order.",
 "1 <= strs.length <= 10^4\n1 <= strs[i].length <= 100\nstrs[i] consists of lowercase English letters.", "groupAnagrams(strs)",
 "def groupAnagrams(strs):\n    d = {}\n    for w in strs:\n        d.setdefault(''.join(sorted(w)), []).append(w)\n    return list(d.values())\n",
 lambda r, big: [[S(r, r.randint(1, 3), "abc") for _ in range(r.randint(1, 8))]],
 [[["eat","tea","tan","ate","nat","bat"]],[["a"]]], [[["ab","ba","abc","cba","bca"]]], checker="UNORDERED_DEEP",
 brute="def groupAnagrams(strs):\n    out = []\n    for w in strs:\n        for g in out:\n            if sorted(g[0]) == sorted(w):\n                g.append(w); break\n        else:\n            out.append([w])\n    return out\n")

def g_topk(r, big):
    from collections import Counter
    while True:
        nums = rl(r, 20000, -1000, 1000) if big else rl(r, r.randint(1, 15), -5, 5)
        f = sorted(Counter(nums).values(), reverse=True)
        ks = [k for k in range(1, len(f) + 1) if k == len(f) or f[k-1] > f[k]]
        if ks: return [nums, r.choice(ks)]
P("top-k-frequent", "Top K Frequent Elements", "MEDIUM", ["Array", "Hash Table", "Heap", "Sorting"],
 "Given an integer array `nums` and an integer `k`, return the `k` most frequent elements in any order. The answer is guaranteed to be unique.",
 "1 <= nums.length <= 10^5\n1 <= k <= number of distinct elements\nThe answer is guaranteed unique.", "topKFrequent(nums, k)",
 "def topKFrequent(nums, k):\n    from collections import Counter\n    return [x for x, _ in Counter(nums).most_common(k)]\n", g_topk,
 [[[1,1,1,2,2,3],2],[[1],1]], [[[4,4,4,4,5],1]], checker="UNORDERED", hasbig=True,
 brute="def topKFrequent(nums, k):\n    vals = sorted(set(nums), key=lambda x: -nums.count(x))\n    return vals[:k]\n")

P("product-of-array-except-self", "Product of Array Except Self", "MEDIUM", ["Array", "Prefix Sum"],
 "Given an integer array `nums`, return an array `answer` where `answer[i]` is the product of all elements of `nums` except `nums[i]`. Do it without using division, in O(n) time.",
 "2 <= nums.length <= 10^5\nThe product of any prefix or suffix fits in a 32-bit integer.", "productExceptSelf(nums)",
 "def productExceptSelf(nums):\n    n = len(nums); out = [1] * n\n    p = 1\n    for i in range(n):\n        out[i] = p; p *= nums[i]\n    p = 1\n    for i in range(n - 1, -1, -1):\n        out[i] *= p; p *= nums[i]\n    return out\n",
 lambda r, big: [[r.choice([-1, 1, 1]) for _ in range(20000)] if big else rl(r, r.randint(2, 6), -3, 3)],
 [[[1,2,3,4]],[[-1,1,0,-3,3]]], [[[0,0]],[[2,3]]], hasbig=True,
 brute="def productExceptSelf(nums):\n    out = []\n    for i in range(len(nums)):\n        p = 1\n        for j in range(len(nums)):\n            if j != i: p *= nums[j]\n        out.append(p)\n    return out\n")

P("maximum-subarray", "Maximum Subarray", "MEDIUM", ["Array", "Dynamic Programming"],
 "Given an integer array `nums`, find the contiguous subarray (at least one element) with the largest sum and return that sum.",
 "1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4", "maxSubArray(nums)",
 "def maxSubArray(nums):\n    best = cur = nums[0]\n    for x in nums[1:]:\n        cur = max(x, cur + x); best = max(best, cur)\n    return best\n",
 lambda r, big: [rl(r, 10000, -10**4, 10**4) if big else rl(r, r.randint(1, 10), -10, 10)],
 [[[-2,1,-3,4,-1,2,1,-5,4]],[[1]]], [[[-3,-1,-2]],[[5,4,-1,7,8]]], hasbig=True,
 brute="def maxSubArray(nums):\n    return max(sum(nums[i:j]) for i in range(len(nums)) for j in range(i+1, len(nums)+1))\n")

P("best-time-to-buy-and-sell-stock", "Best Time to Buy and Sell Stock", "EASY", ["Array", "Dynamic Programming"],
 "`prices[i]` is the price of a stock on day `i`. Choose one day to buy and a later day to sell. Return the maximum profit, or `0` if no profit is possible.",
 "1 <= prices.length <= 10^5\n0 <= prices[i] <= 10^4", "maxProfit(prices)",
 "def maxProfit(prices):\n    low = prices[0]; best = 0\n    for p in prices:\n        low = min(low, p); best = max(best, p - low)\n    return best\n",
 lambda r, big: [rl(r, 10000, 0, 10**4) if big else rl(r, r.randint(1, 9), 0, 20)],
 [[[7,1,5,3,6,4]],[[7,6,4,3,1]]], [[[3]],[[1,2]]], hasbig=True,
 brute="def maxProfit(prices):\n    return max([0] + [prices[j]-prices[i] for i in range(len(prices)) for j in range(i+1, len(prices))])\n")

P("move-zeroes", "Move Zeroes", "EASY", ["Array", "Two Pointers"],
 "Given an integer array `nums`, return the array with all `0`s moved to the end while keeping the relative order of the non-zero elements.",
 "1 <= nums.length <= 10^4\n-2^31 <= nums[i] <= 2^31 - 1", "moveZeroes(nums)",
 "def moveZeroes(nums):\n    nz = [x for x in nums if x != 0]\n    return nz + [0] * (len(nums) - len(nz))\n",
 lambda r, big: [rl(r, 10000, 0, 3) if big else rl(r, r.randint(1, 10), 0, 3)], [[[0,1,0,3,12]],[[0]]], [[[1,2,3]],[[0,0,0]]], hasbig=True,
 brute="def moveZeroes(nums):\n    a = list(nums)\n    for i in range(len(a)):\n        for j in range(len(a)-1-i):\n            if a[j] == 0 and a[j+1] != 0: a[j], a[j+1] = a[j+1], a[j]\n    return a\n")

def g_major(r, big):
    n = r.randint(1, 9); m = r.randint(-3, 3); c = n // 2 + 1
    a = [m] * c + [r.randint(-3, 3) for _ in range(n - c)]; r.shuffle(a); return [a]
P("majority-element", "Majority Element", "EASY", ["Array", "Hash Table", "Counting"],
 "Given an array `nums` of size `n`, return the majority element: the element that appears more than `n / 2` times. It always exists.",
 "1 <= n <= 5 * 10^4\nA majority element always exists.", "majorityElement(nums)",
 "def majorityElement(nums):\n    cand = None; cnt = 0\n    for x in nums:\n        if cnt == 0: cand = x\n        cnt += 1 if x == cand else -1\n    return cand\n", g_major,
 [[[3,2,3]],[[2,2,1,1,1,2,2]]], [[[1]],[[5,5]]],
 brute="def majorityElement(nums):\n    return max(set(nums), key=nums.count)\n")

# ---------------- Strings ----------------
def g_pal(r, big):
    if r.random() < .5: return [S(r, r.randint(1, 10), "aAbB1 ,:")]
    h = S(r, r.randint(1, 5), "abAB12 ,"); return [h + r.choice(["", "x", "!"]) + h[::-1]]
P("valid-palindrome", "Valid Palindrome", "EASY", ["String", "Two Pointers"],
 "After converting all uppercase letters to lowercase and removing every character that is not a letter or digit, a phrase is a palindrome if it reads the same forward and backward. Given a string `s`, return `true` if it is a palindrome, otherwise `false`.",
 "1 <= s.length <= 2 * 10^5\ns consists of printable ASCII characters.", "isPalindrome(s)",
 "def isPalindrome(s):\n    t = [c.lower() for c in s if c.isalnum()]\n    return t == t[::-1]\n", g_pal,
 [["A man, a plan, a canal: Panama"],["race a car"]], [[" "],[",."]],
 brute="def isPalindrome(s):\n    t = ''.join(c for c in s.lower() if c in 'abcdefghijklmnopqrstuvwxyz0123456789')\n    return all(t[i] == t[len(t)-1-i] for i in range(len(t)))\n")

P("longest-substring-without-repeating-characters", "Longest Substring Without Repeating Characters", "MEDIUM", ["String", "Sliding Window", "Hash Table"],
 "Given a string `s`, return the length of the longest substring that contains no repeated characters.",
 "0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.", "lengthOfLongestSubstring(s)",
 "def lengthOfLongestSubstring(s):\n    last = {}; start = best = 0\n    for i, c in enumerate(s):\n        if c in last and last[c] >= start: start = last[c] + 1\n        last[c] = i; best = max(best, i - start + 1)\n    return best\n",
 lambda r, big: [S(r, 5000, "abcdefghij") if big else S(r, r.randint(1, 12), "abc")],
 [["abcabcbb"],["bbbbb"],["pwwkew"]], [[""],["a"]], hasbig=True,
 brute="def lengthOfLongestSubstring(s):\n    best = 0\n    for i in range(len(s)):\n        for j in range(i, len(s)):\n            if len(set(s[i:j+1])) == j-i+1: best = max(best, j-i+1)\n    return best\n")

def g_lcp(r, big):
    p = S(r, r.randint(0, 3), "ab"); return [[p + S(r, r.randint(0, 3), "abc") for _ in range(r.randint(1, 5))]]
P("longest-common-prefix", "Longest Common Prefix", "EASY", ["String"],
 "Write a function to find the longest common prefix string amongst an array of strings. If there is none, return an empty string.",
 "1 <= strs.length <= 200\n0 <= strs[i].length <= 200\nstrs[i] consists of lowercase English letters.", "longestCommonPrefix(strs)",
 "def longestCommonPrefix(strs):\n    p = strs[0]\n    for s in strs[1:]:\n        while not s.startswith(p): p = p[:-1]\n    return p\n", g_lcp,
 [[["flower","flow","flight"]],[["dog","racecar","car"]]], [[["a"]],[[""," "]]],
 brute="def longestCommonPrefix(strs):\n    out = ''\n    for i in range(min(map(len, strs))):\n        if len({s[i] for s in strs}) == 1: out += strs[0][i]\n        else: break\n    return out\n")

def g_paren(r, big):
    if big: return ["(" * 5000 + ")" * 5000]
    if r.random() < .5: return [S(r, r.randint(1, 10), "()[]{}")]
    out = []
    def b(d):
        for _ in range(r.randint(1, 2)):
            a, c = r.choice(["()", "[]", "{}"]); out.append(a)
            if d > 1: b(d - 1)
            out.append(c)
    b(r.randint(1, 3)); return ["".join(out)]
P("valid-parentheses", "Valid Parentheses", "EASY", ["String", "Stack"],
 "Given a string `s` containing only the characters `()[]{}`, determine if it is valid: every open bracket is closed by the same type of bracket, in the correct order.",
 "1 <= s.length <= 10^4", "isValid(s)",
 "def isValid(s):\n    pair = {')': '(', ']': '[', '}': '{'}; st = []\n    for c in s:\n        if c in pair:\n            if not st or st.pop() != pair[c]: return False\n        else: st.append(c)\n    return not st\n", g_paren,
 [["()"],["()[]{}"],["(]"]], [["["],["]"]], hasbig=True,
 brute="def isValid(s):\n    while True:\n        t = s.replace('()', '').replace('[]', '').replace('{}', '')\n        if t == s: return s == ''\n        s = t\n")

def g_words(r, big):
    ws = [r.choice(["hi", "abc", "x", "Go", "the"]) for _ in range(r.randint(1, 5))]
    return [" " * r.randint(0, 2) + "".join(w + " " * r.randint(1, 3) for w in ws[:-1]) + ws[-1] + " " * r.randint(0, 2)]
P("reverse-words-in-a-string", "Reverse Words in a String", "MEDIUM", ["String", "Two Pointers"],
 "Given a string `s`, reverse the order of its words. Words are separated by one or more spaces. Return the words in reverse order joined by a single space, with no leading or trailing spaces.",
 "1 <= s.length <= 10^4\ns contains at least one word.", "reverseWords(s)",
 "def reverseWords(s):\n    return ' '.join(reversed(s.split()))\n", g_words,
 [["the sky is blue"],["  hello world  "]], [["a"],["  a   b  "]],
 brute="def reverseWords(s):\n    ws = []; cur = ''\n    for c in s + ' ':\n        if c == ' ':\n            if cur: ws.append(cur); cur = ''\n        else: cur += c\n    return ' '.join(ws[::-1])\n")

# ---------------- Two pointers / Binary search ----------------
P("container-with-most-water", "Container With Most Water", "MEDIUM", ["Array", "Two Pointers", "Greedy"],
 "`height[i]` is the height of a vertical line at position `i`. Choose two lines that, with the x-axis, form a container holding the most water. Return that maximum amount.",
 "2 <= height.length <= 10^5\n0 <= height[i] <= 10^4", "maxArea(height)",
 "def maxArea(height):\n    l, r = 0, len(height) - 1; best = 0\n    while l < r:\n        best = max(best, min(height[l], height[r]) * (r - l))\n        if height[l] < height[r]: l += 1\n        else: r -= 1\n    return best\n",
 lambda r, big: [rl(r, 10000, 0, 10**4) if big else rl(r, r.randint(2, 8), 0, 20)],
 [[[1,8,6,2,5,4,8,3,7]],[[1,1]]], [[[0,0]],[[5,1,1,5]]], hasbig=True,
 brute="def maxArea(height):\n    return max(min(height[i], height[j]) * (j - i) for i in range(len(height)) for j in range(i+1, len(height)))\n")

P("3sum", "3Sum", "MEDIUM", ["Array", "Two Pointers", "Sorting"],
 "Given an integer array `nums`, return all unique triplets `[nums[i], nums[j], nums[k]]` with distinct indices such that the three numbers sum to `0`. The answer must not contain duplicate triplets. Order of triplets and of numbers inside a triplet does not matter.",
 "0 <= nums.length <= 3000\n-10^5 <= nums[i] <= 10^5", "threeSum(nums)",
 "def threeSum(nums):\n    nums = sorted(nums); res = []\n    for i in range(len(nums) - 2):\n        if i and nums[i] == nums[i-1]: continue\n        l, h = i + 1, len(nums) - 1\n        while l < h:\n            s = nums[i] + nums[l] + nums[h]\n            if s < 0: l += 1\n            elif s > 0: h -= 1\n            else:\n                res.append([nums[i], nums[l], nums[h]]); l += 1\n                while l < h and nums[l] == nums[l-1]: l += 1\n    return res\n",
 lambda r, big: [rl(r, 2000, -10**5, 10**5) if big else rl(r, r.randint(0, 12), -6, 6)],
 [[[-1,0,1,2,-1,-4]],[[0,1,1]],[[0,0,0]]], [[[]],[[0,0,0,0]]], hasbig=True, checker="UNORDERED_DEEP",
 brute="def threeSum(nums):\n    out = set()\n    for i in range(len(nums)):\n        for j in range(i+1, len(nums)):\n            for k in range(j+1, len(nums)):\n                if nums[i]+nums[j]+nums[k] == 0: out.add(tuple(sorted((nums[i], nums[j], nums[k]))))\n    return [list(t) for t in out]\n")

def g_bs(r, big):
    n = 100000 if big else r.randint(1, 10); a = sorted(r.sample(range(-10**6, 10**6) if big else range(-20, 20), n))
    return [a, r.choice(a) if r.random() < .5 else r.randint(-22, 22)]
P("binary-search", "Binary Search", "EASY", ["Array", "Binary Search"],
 "Given a sorted (ascending) array `nums` of distinct integers and an integer `target`, return the index of `target` in `nums`, or `-1` if it is not present. Your solution must run in O(log n).",
 "1 <= nums.length <= 10^5\nAll integers in nums are distinct and sorted ascending.", "search(nums, target)",
 "def search(nums, target):\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        m = (lo + hi) // 2\n        if nums[m] == target: return m\n        if nums[m] < target: lo = m + 1\n        else: hi = m - 1\n    return -1\n", g_bs,
 [[[-1,0,3,5,9,12],9],[[-1,0,3,5,9,12],2]], [[[5],5],[[5],-5]], hasbig=True,
 brute="def search(nums, target):\n    return nums.index(target) if target in nums else -1\n")

def g_rot(r, big):
    n = 50000 if big else r.randint(1, 10); a = sorted(r.sample(range(-10**6, 10**6) if big else range(-20, 20), n)); k = r.randrange(n)
    return [a[k:] + a[:k], r.choice(a) if r.random() < .6 else r.randint(-22, 22)]
P("search-in-rotated-sorted-array", "Search in Rotated Sorted Array", "MEDIUM", ["Array", "Binary Search"],
 "A sorted array of distinct integers was rotated at an unknown pivot (for example `[0,1,2,4,5,6,7]` may become `[4,5,6,7,0,1,2]`). Given the rotated array `nums` and an integer `target`, return the index of `target`, or `-1` if absent. Your solution must run in O(log n).",
 "1 <= nums.length <= 5000\nAll values are distinct.", "search(nums, target)",
 "def search(nums, target):\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        m = (lo + hi) // 2\n        if nums[m] == target: return m\n        if nums[lo] <= nums[m]:\n            if nums[lo] <= target < nums[m]: hi = m - 1\n            else: lo = m + 1\n        else:\n            if nums[m] < target <= nums[hi]: lo = m + 1\n            else: hi = m - 1\n    return -1\n", g_rot,
 [[[4,5,6,7,0,1,2],0],[[4,5,6,7,0,1,2],3],[[1],0]], [[[1,3],3],[[3,1],1]], hasbig=True,
 brute="def search(nums, target):\n    return nums.index(target) if target in nums else -1\n")

def g_min(r, big):
    a = g_rot(r, big)[0]; return [a]
P("find-minimum-in-rotated-sorted-array", "Find Minimum in Rotated Sorted Array", "MEDIUM", ["Array", "Binary Search"],
 "A sorted array of unique integers was rotated between 1 and n times. Given the rotated array `nums`, return its minimum element. Your algorithm must run in O(log n).",
 "1 <= nums.length <= 5000\nAll values are unique.", "findMin(nums)",
 "def findMin(nums):\n    lo, hi = 0, len(nums) - 1\n    while lo < hi:\n        m = (lo + hi) // 2\n        if nums[m] > nums[hi]: lo = m + 1\n        else: hi = m\n    return nums[lo]\n", g_min,
 [[[3,4,5,1,2]],[[4,5,6,7,0,1,2]]], [[[11]],[[2,1]]], hasbig=True,
 brute="def findMin(nums):\n    return min(nums)\n")

# ---------------- Dynamic Programming ----------------
P("climbing-stairs", "Climbing Stairs", "EASY", ["Dynamic Programming", "Math"],
 "You are climbing a staircase with `n` steps. Each time you can climb 1 or 2 steps. Return the number of distinct ways to reach the top.",
 "1 <= n <= 45", "climbStairs(n)",
 "def climbStairs(n):\n    a, b = 1, 1\n    for _ in range(n - 1): a, b = b, a + b\n    return b\n", lambda r, big: [r.randint(1, 45)],
 [[2],[3]], [[1],[45]], n=10,
 brute="def climbStairs(n):\n    from math import comb\n    return sum(comb(n - k, k) for k in range(n // 2 + 1))\n")

P("house-robber", "House Robber", "MEDIUM", ["Array", "Dynamic Programming"],
 "`nums[i]` is the money in house `i`. Adjacent houses have linked alarms, so you cannot rob two adjacent houses. Return the maximum amount you can rob.",
 "1 <= nums.length <= 100\n0 <= nums[i] <= 400", "rob(nums)",
 "def rob(nums):\n    a = b = 0\n    for x in nums: a, b = b, max(b, a + x)\n    return b\n", lambda r, big: [rl(r, r.randint(1, 10), 0, 20)],
 [[[1,2,3,1]],[[2,7,9,3,1]]], [[[5]],[[0,0]]],
 brute="def rob(nums):\n    best = 0; n = len(nums)\n    for m in range(1 << n):\n        if m & (m >> 1): continue\n        best = max(best, sum(nums[i] for i in range(n) if m >> i & 1))\n    return best\n")

def g_coin(r, big):
    if big: return [[1, 2, 5, 10, 20, 50, 100, 200], 10000]
    return [r.sample(range(1, 12), r.randint(1, 4)), r.randint(0, 25)]
P("coin-change", "Coin Change", "MEDIUM", ["Dynamic Programming", "Array"],
 "Given coin denominations `coins` (unlimited supply of each) and a target `amount`, return the fewest coins needed to make that amount, or `-1` if impossible.",
 "1 <= coins.length <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4", "coinChange(coins, amount)",
 "def coinChange(coins, amount):\n    INF = amount + 1; dp = [0] + [INF] * amount\n    for a in range(1, amount + 1):\n        for c in coins:\n            if c <= a and dp[a - c] + 1 < dp[a]: dp[a] = dp[a - c] + 1\n    return dp[amount] if dp[amount] != INF else -1\n", g_coin,
 [[[1,2,5],11],[[2],3],[[1],0]], [[[2,5],1],[[3,7],14]], hasbig=True,
 brute="def coinChange(coins, amount):\n    from functools import lru_cache\n    @lru_cache(None)\n    def f(a):\n        if a == 0: return 0\n        best = float('inf')\n        for c in coins:\n            if c <= a: best = min(best, f(a - c) + 1)\n        return best\n    r = f(amount)\n    return -1 if r == float('inf') else r\n")

P("longest-increasing-subsequence", "Longest Increasing Subsequence", "MEDIUM", ["Array", "Binary Search", "Dynamic Programming"],
 "Given an integer array `nums`, return the length of the longest strictly increasing subsequence.",
 "1 <= nums.length <= 2500\n-10^4 <= nums[i] <= 10^4", "lengthOfLIS(nums)",
 "def lengthOfLIS(nums):\n    from bisect import bisect_left\n    t = []\n    for x in nums:\n        i = bisect_left(t, x)\n        if i == len(t): t.append(x)\n        else: t[i] = x\n    return len(t)\n",
 lambda r, big: [rl(r, 2500, -10**4, 10**4) if big else rl(r, r.randint(1, 10), -10, 10)],
 [[[10,9,2,5,3,7,101,18]],[[0,1,0,3,2,3]],[[7,7,7,7]]], [[[1]],[[5,4,3,2,1]]], hasbig=True,
 brute="def lengthOfLIS(nums):\n    dp = [1] * len(nums)\n    for i in range(len(nums)):\n        for j in range(i):\n            if nums[j] < nums[i]: dp[i] = max(dp[i], dp[j] + 1)\n    return max(dp)\n")

P("unique-paths", "Unique Paths", "MEDIUM", ["Math", "Dynamic Programming", "Combinatorics"],
 "A robot starts at the top-left of an `m x n` grid and can only move right or down. Return the number of unique paths to the bottom-right corner.",
 "1 <= m, n <= 18", "uniquePaths(m, n)",
 "def uniquePaths(m, n):\n    from math import comb\n    return comb(m + n - 2, m - 1)\n", lambda r, big: [r.randint(1, 18), r.randint(1, 18)],
 [[3,7],[3,2]], [[1,1],[18,18]],
 brute="def uniquePaths(m, n):\n    dp = [[1] * n for _ in range(m)]\n    for i in range(1, m):\n        for j in range(1, n): dp[i][j] = dp[i-1][j] + dp[i][j-1]\n    return dp[-1][-1]\n")

# ---------------- Math / classic interview ----------------
P("fizz-buzz", "Fizz Buzz", "EASY", ["Math", "String"],
 "Given an integer `n`, return a string array `answer` (1-indexed) where `answer[i]` is `\"FizzBuzz\"` if i is divisible by 3 and 5, `\"Fizz\"` if divisible by 3, `\"Buzz\"` if divisible by 5, otherwise `i` as a string.",
 "1 <= n <= 10^4", "fizzBuzz(n)",
 "def fizzBuzz(n):\n    return ['FizzBuzz' if i % 15 == 0 else 'Fizz' if i % 3 == 0 else 'Buzz' if i % 5 == 0 else str(i) for i in range(1, n + 1)]\n",
 lambda r, big: [r.randint(1, 40)], [[3],[5],[15]], [[1],[10000]],
 brute="def fizzBuzz(n):\n    out = []\n    for i in range(1, n+1):\n        s = ''\n        if i % 3 == 0: s += 'Fizz'\n        if i % 5 == 0: s += 'Buzz'\n        out.append(s or str(i))\n    return out\n")

P("count-primes", "Count Primes", "MEDIUM", ["Math", "Sieve"],
 "Given an integer `n`, return the number of prime numbers strictly less than `n`.",
 "0 <= n <= 5 * 10^6", "countPrimes(n)",
 "def countPrimes(n):\n    if n < 3: return 0\n    s = bytearray([1]) * n; s[0] = s[1] = 0\n    for i in range(2, int(n ** 0.5) + 1):\n        if s[i]: s[i*i::i] = bytearray(len(range(i*i, n, i)))\n    return sum(s)\n",
 lambda r, big: [1000000 if big else r.randint(0, 200)], [[10],[0],[1]], [[2],[3],[100]], hasbig=True,
 brute="def countPrimes(n):\n    return sum(1 for k in range(2, n) if all(k % d for d in range(2, int(k ** 0.5) + 1)))\n")

def g_pn(r, big):
    if r.random() < .5:
        k = r.randint(0, 999); s = str(k); return [int(s + s[::-1][r.randint(0, 1):])]
    return [r.randint(-200, 20000)]
P("palindrome-number", "Palindrome Number", "EASY", ["Math"],
 "Given an integer `x`, return `true` if `x` is a palindrome (reads the same forward and backward), otherwise `false`. Negative numbers are never palindromes.",
 "-2^31 <= x <= 2^31 - 1", "isPalindrome(x)",
 "def isPalindrome(x):\n    s = str(x)\n    return s == s[::-1]\n", g_pn, [[121],[-121],[10]], [[0],[7]],
 brute="def isPalindrome(x):\n    if x < 0: return False\n    r, y = 0, x\n    while y: r = r * 10 + y % 10; y //= 10\n    return r == x\n")

def itor(n):
    out = ""
    for v, s in [(1000,"M"),(900,"CM"),(500,"D"),(400,"CD"),(100,"C"),(90,"XC"),(50,"L"),(40,"XL"),(10,"X"),(9,"IX"),(5,"V"),(4,"IV"),(1,"I")]:
        while n >= v: out += s; n -= v
    return out
P("roman-to-integer", "Roman to Integer", "EASY", ["Math", "String"],
 "Roman numerals use `I=1, V=5, X=10, L=50, C=100, D=500, M=1000`. When a smaller value precedes a larger one it is subtracted (`IV=4`, `IX=9`, `XL=40`, `XC=90`, `CD=400`, `CM=900`). Given a valid Roman numeral `s`, return its integer value.",
 "1 <= s.length <= 15\ns is a valid Roman numeral in the range [1, 3999].", "romanToInt(s)",
 "def romanToInt(s):\n    v = {'I':1,'V':5,'X':10,'L':50,'C':100,'D':500,'M':1000}; t = 0\n    for i, c in enumerate(s):\n        t += -v[c] if i + 1 < len(s) and v[c] < v[s[i+1]] else v[c]\n    return t\n",
 lambda r, big: [itor(r.randint(1, 3999))], [["III"],["LVIII"],["MCMXCIV"]], [[itor(3999)],["I"]],
 brute="def romanToInt(s):\n    t = 0\n    for p, v in [('IV',4),('IX',9),('XL',40),('XC',90),('CD',400),('CM',900)]:\n        t += s.count(p) * v; s = s.replace(p, '')\n    return t + sum({'I':1,'V':5,'X':10,'L':50,'C':100,'D':500,'M':1000}[c] for c in s)\n")

# ---------------- Stack / Intervals / misc ----------------
P("daily-temperatures", "Daily Temperatures", "MEDIUM", ["Array", "Stack", "Monotonic Stack"],
 "Given an array `temperatures` of daily temperatures, return an array `answer` where `answer[i]` is the number of days you must wait after day `i` for a warmer temperature. If there is none, `answer[i] = 0`.",
 "1 <= temperatures.length <= 10^5\n30 <= temperatures[i] <= 100", "dailyTemperatures(temperatures)",
 "def dailyTemperatures(temperatures):\n    ans = [0] * len(temperatures); st = []\n    for i, t in enumerate(temperatures):\n        while st and temperatures[st[-1]] < t:\n            j = st.pop(); ans[j] = i - j\n        st.append(i)\n    return ans\n",
 lambda r, big: [rl(r, 20000, 30, 100) if big else rl(r, r.randint(1, 10), 30, 100)],
 [[[73,74,75,71,69,72,76,73]],[[30,40,50,60]]], [[[90]],[[60,50,40]]], hasbig=True,
 brute="def dailyTemperatures(t):\n    out = []\n    for i in range(len(t)):\n        d = 0\n        for j in range(i+1, len(t)):\n            if t[j] > t[i]: d = j - i; break\n        out.append(d)\n    return out\n")

def g_iv(r, big):
    return [[sorted([r.randint(0, 20), r.randint(0, 20)]) for _ in range(r.randint(1, 6))]]
P("merge-intervals", "Merge Intervals", "MEDIUM", ["Array", "Sorting", "Intervals"],
 "Given an array of `intervals` where `intervals[i] = [start, end]`, merge all overlapping intervals (intervals that touch, like `[1,4]` and `[4,5]`, overlap) and return the non-overlapping intervals sorted by start.",
 "1 <= intervals.length <= 10^4\n0 <= start <= end <= 10^4", "merge(intervals)",
 "def merge(intervals):\n    out = []\n    for s, e in sorted(intervals):\n        if out and s <= out[-1][1]: out[-1][1] = max(out[-1][1], e)\n        else: out.append([s, e])\n    return out\n", g_iv,
 [[[[1,3],[2,6],[8,10],[15,18]]],[[[1,4],[4,5]]]], [[[[1,1]]],[[[0,5],[1,2]]]],
 brute="def merge(intervals):\n    a = [list(i) for i in intervals]\n    ch = True\n    while ch:\n        ch = False\n        for i in range(len(a)):\n            for j in range(i+1, len(a)):\n                if a[i][0] <= a[j][1] and a[j][0] <= a[i][1]:\n                    a[i] = [min(a[i][0], a[j][0]), max(a[i][1], a[j][1])]; a.pop(j); ch = True; break\n            if ch: break\n    return sorted(a)\n")

def g_miss(r, big):
    n = r.randint(1, 9); a = list(range(n + 1)); a.pop(r.randrange(n + 1)); r.shuffle(a); return [a]
P("missing-number", "Missing Number", "EASY", ["Array", "Math", "Bit Manipulation"],
 "Given an array `nums` containing `n` distinct numbers in the range `[0, n]`, return the only number in the range that is missing.",
 "1 <= n <= 10^4\nAll numbers are unique.", "missingNumber(nums)",
 "def missingNumber(nums):\n    n = len(nums)\n    return n * (n + 1) // 2 - sum(nums)\n", g_miss, [[[3,0,1]],[[0,1]],[[9,6,4,2,3,5,7,0,1]]], [[[0]],[[1]]],
 brute="def missingNumber(nums):\n    s = set(nums)\n    return next(i for i in range(len(nums) + 1) if i not in s)\n")

def g_single(r, big):
    vals = r.sample(range(-20, 20), r.randint(1, 6)); a = [v for v in vals[1:] for _ in (0, 1)] + [vals[0]]; r.shuffle(a); return [a]
P("single-number", "Single Number", "EASY", ["Array", "Bit Manipulation"],
 "Every element in `nums` appears twice except for one that appears once. Return that single element. Use linear time and constant extra space.",
 "1 <= nums.length <= 3 * 10^4\nEvery element appears twice except one.", "singleNumber(nums)",
 "def singleNumber(nums):\n    x = 0\n    for n in nums: x ^= n\n    return x\n", g_single, [[[2,2,1]],[[4,1,2,1,2]]], [[[1]],[[-3,-3,0]]],
 brute="def singleNumber(nums):\n    return next(x for x in nums if nums.count(x) == 1)\n")

def g_sub(r, big):
    if big: return [rl(r, 20000, -5, 5), r.randint(-20, 20)]
    return [rl(r, r.randint(1, 10), -3, 3), r.randint(-4, 4)]
P("subarray-sum-equals-k", "Subarray Sum Equals K", "MEDIUM", ["Array", "Hash Table", "Prefix Sum"],
 "Given an integer array `nums` and an integer `k`, return the total number of contiguous subarrays whose sum equals `k`.",
 "1 <= nums.length <= 2 * 10^4\n-1000 <= nums[i] <= 1000\n-10^7 <= k <= 10^7", "subarraySum(nums, k)",
 "def subarraySum(nums, k):\n    cnt = {0: 1}; s = ans = 0\n    for x in nums:\n        s += x; ans += cnt.get(s - k, 0); cnt[s] = cnt.get(s, 0) + 1\n    return ans\n", g_sub,
 [[[1,1,1],2],[[1,2,3],3]], [[[0,0,0],0],[[1],5]], hasbig=True,
 brute="def subarraySum(nums, k):\n    return sum(1 for i in range(len(nums)) for j in range(i+1, len(nums)+1) if sum(nums[i:j]) == k)\n")

P("longest-palindromic-substring-length", "Longest Palindromic Substring (Length)", "MEDIUM", ["String", "Dynamic Programming"],
 "Given a string `s`, return the length of the longest palindromic substring in `s`.",
 "1 <= s.length <= 1000\ns consists of lowercase English letters.", "longestPalindromeLength(s)",
 "def longestPalindromeLength(s):\n    best = 0\n    for c in range(len(s)):\n        for l, r in ((c, c), (c, c + 1)):\n            while l >= 0 and r < len(s) and s[l] == s[r]: l -= 1; r += 1\n            best = max(best, r - l - 1)\n    return best\n",
 lambda r, big: [S(r, 1000, "ab") if big else S(r, r.randint(1, 12), "ab")], [["babad"],["cbbd"],["a"]], [["abc"],["aaaa"]], hasbig=True,
 brute="def longestPalindromeLength(s):\n    return max(len(s[i:j]) for i in range(len(s)) for j in range(i+1, len(s)+1) if s[i:j] == s[i:j][::-1])\n")

P("jump-game", "Jump Game", "MEDIUM", ["Array", "Greedy", "Dynamic Programming"],
 "`nums[i]` is the maximum jump length from index `i`. Starting at index 0, return `true` if you can reach the last index, otherwise `false`.",
 "1 <= nums.length <= 10^4\n0 <= nums[i] <= 10^5", "canJump(nums)",
 "def canJump(nums):\n    far = 0\n    for i, x in enumerate(nums):\n        if i > far: return False\n        far = max(far, i + x)\n    return True\n",
 lambda r, big: [rl(r, 20000, 1, 3) if big else rl(r, r.randint(1, 8), 0, 4)], [[[2,3,1,1,4]],[[3,2,1,0,4]]], [[[0]],[[1,0]]], hasbig=True,
 brute="def canJump(nums):\n    ok = [False] * len(nums); ok[0] = True\n    for i in range(len(nums)):\n        if ok[i]:\n            for j in range(i + 1, min(len(nums), i + nums[i] + 1)): ok[j] = True\n    return ok[-1]\n")

P("rotate-array", "Rotate Array", "MEDIUM", ["Array", "Math"],
 "Given an integer array `nums` and a non-negative integer `k`, return the array rotated to the right by `k` steps.",
 "1 <= nums.length <= 10^5\n0 <= k <= 10^5", "rotate(nums, k)",
 "def rotate(nums, k):\n    k %= len(nums)\n    return nums[-k:] + nums[:-k] if k else list(nums)\n",
 lambda r, big: [rl(r, 10000, -10**4, 10**4), r.randint(0, 10**5)] if big else [rl(r, r.randint(1, 8), -9, 9), r.randint(0, 20)],
 [[[1,2,3,4,5,6,7],3],[[-1,-100,3,99],2]], [[[1],10],[[1,2],0]], hasbig=True,
 brute="def rotate(nums, k):\n    a = list(nums)\n    for _ in range(k):\n        a.insert(0, a.pop())\n    return a\n")
