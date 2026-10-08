export const INDUSTRY_PROBLEMS = [
  {
    "id": "3sum",
    "slug": "3sum",
    "num": 1,
    "title": "3Sum",
    "difficulty": "Medium",
    "acceptance": "48%",
    "category": "array",
    "topics": [
      "Array",
      "Two Pointers",
      "Sorting"
    ],
    "likes": "7.4k",
    "dislikes": "377",
    "statement": "Given an integer array `nums`, return all unique triplets `[nums[i], nums[j], nums[k]]` with distinct indices such that the three numbers sum to `0`. The answer must not contain duplicate triplets. Order of triplets and of numbers inside a triplet does not matter.\n\nExample 1:\nInput: nums = [-1,0,1,2,-1,-4]\nOutput: [[-1,-1,2],[-1,0,1]]\n\nExample 2:\nInput: nums = [0,1,1]\nOutput: []",
    "desc": "Given an integer array `nums`, return all unique triplets `[nums[i], nums[j], nums[k]]` with distinct indices such that the three numbers sum to `0`. The answer must not contain duplicate triplets. Order of triplets and of numbers inside a triplet does not matter.",
    "constraints": "0 <= nums.length <= 3000\n-10^5 <= nums[i] <= 10^5",
    "hint": "",
    "functionName": "threeSum",
    "starterCode": {
      "python": "def threeSum(nums):\n    # Write your solution here\n    pass\n",
      "javascript": "function threeSum(nums) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            -1,
            0,
            1,
            2,
            -1,
            -4
          ]
        ],
        "expected": [
          [
            -1,
            -1,
            2
          ],
          [
            -1,
            0,
            1
          ]
        ]
      },
      {
        "input": [
          [
            0,
            1,
            1
          ]
        ],
        "expected": []
      },
      {
        "input": [
          [
            0,
            0,
            0
          ]
        ],
        "expected": [
          [
            0,
            0,
            0
          ]
        ]
      }
    ],
    "totalTestsCount": 18
  },
  {
    "id": "best-time-to-buy-and-sell-stock",
    "slug": "best-time-to-buy-and-sell-stock",
    "num": 2,
    "title": "Best Time to Buy and Sell Stock",
    "difficulty": "Easy",
    "acceptance": "65%",
    "category": "array",
    "topics": [
      "Array",
      "Dynamic Programming"
    ],
    "likes": "15.6k",
    "dislikes": "95",
    "statement": "`prices[i]` is the price of a stock on day `i`. Choose one day to buy and a later day to sell. Return the maximum profit, or `0` if no profit is possible.\n\nExample 1:\nInput: prices = [7,1,5,3,6,4]\nOutput: 5\n\nExample 2:\nInput: prices = [7,6,4,3,1]\nOutput: 0",
    "desc": "`prices[i]` is the price of a stock on day `i`. Choose one day to buy and a later day to sell. Return the maximum profit, or `0` if no profit is possible.",
    "constraints": "1 <= prices.length <= 10^5\n0 <= prices[i] <= 10^4",
    "hint": "",
    "functionName": "maxProfit",
    "starterCode": {
      "python": "def maxProfit(prices):\n    # Write your solution here\n    pass\n",
      "javascript": "function maxProfit(prices) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            7,
            1,
            5,
            3,
            6,
            4
          ]
        ],
        "expected": 5
      },
      {
        "input": [
          [
            7,
            6,
            4,
            3,
            1
          ]
        ],
        "expected": 0
      }
    ],
    "totalTestsCount": 17
  },
  {
    "id": "binary-search",
    "slug": "binary-search",
    "num": 3,
    "title": "Binary Search",
    "difficulty": "Easy",
    "acceptance": "65%",
    "category": "array",
    "topics": [
      "Array",
      "Binary Search"
    ],
    "likes": "15.9k",
    "dislikes": "274",
    "statement": "Given a sorted (ascending) array `nums` of distinct integers and an integer `target`, return the index of `target` in `nums`, or `-1` if it is not present. Your solution must run in O(log n).\n\nExample 1:\nInput: nums = [-1,0,3,5,9,12], target = 9\nOutput: 4\n\nExample 2:\nInput: nums = [-1,0,3,5,9,12], target = 2\nOutput: -1",
    "desc": "Given a sorted (ascending) array `nums` of distinct integers and an integer `target`, return the index of `target` in `nums`, or `-1` if it is not present. Your solution must run in O(log n).",
    "constraints": "1 <= nums.length <= 10^5\nAll integers in nums are distinct and sorted ascending.",
    "hint": "",
    "functionName": "search",
    "starterCode": {
      "python": "def search(nums, target):\n    # Write your solution here\n    pass\n",
      "javascript": "function search(nums, target) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            -1,
            0,
            3,
            5,
            9,
            12
          ],
          9
        ],
        "expected": 4
      },
      {
        "input": [
          [
            -1,
            0,
            3,
            5,
            9,
            12
          ],
          2
        ],
        "expected": -1
      }
    ],
    "totalTestsCount": 17
  },
  {
    "id": "climbing-stairs",
    "slug": "climbing-stairs",
    "num": 4,
    "title": "Climbing Stairs",
    "difficulty": "Easy",
    "acceptance": "65%",
    "category": "dynamic-programming",
    "topics": [
      "Dynamic Programming",
      "Math"
    ],
    "likes": "15.5k",
    "dislikes": "196",
    "statement": "You are climbing a staircase with `n` steps. Each time you can climb 1 or 2 steps. Return the number of distinct ways to reach the top.\n\nExample 1:\nInput: n = 2\nOutput: 2\n\nExample 2:\nInput: n = 3\nOutput: 3",
    "desc": "You are climbing a staircase with `n` steps. Each time you can climb 1 or 2 steps. Return the number of distinct ways to reach the top.",
    "constraints": "1 <= n <= 45",
    "hint": "",
    "functionName": "climbStairs",
    "starterCode": {
      "python": "def climbStairs(n):\n    # Write your solution here\n    pass\n",
      "javascript": "function climbStairs(n) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          2
        ],
        "expected": 2
      },
      {
        "input": [
          3
        ],
        "expected": 3
      }
    ],
    "totalTestsCount": 14
  },
  {
    "id": "coin-change",
    "slug": "coin-change",
    "num": 5,
    "title": "Coin Change",
    "difficulty": "Medium",
    "acceptance": "48%",
    "category": "dynamic-programming",
    "topics": [
      "Dynamic Programming",
      "Array"
    ],
    "likes": "9.4k",
    "dislikes": "205",
    "statement": "Given coin denominations `coins` (unlimited supply of each) and a target `amount`, return the fewest coins needed to make that amount, or `-1` if impossible.\n\nExample 1:\nInput: coins = [1,2,5], amount = 11\nOutput: 3\n\nExample 2:\nInput: coins = [2], amount = 3\nOutput: -1",
    "desc": "Given coin denominations `coins` (unlimited supply of each) and a target `amount`, return the fewest coins needed to make that amount, or `-1` if impossible.",
    "constraints": "1 <= coins.length <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4",
    "hint": "",
    "functionName": "coinChange",
    "starterCode": {
      "python": "def coinChange(coins, amount):\n    # Write your solution here\n    pass\n",
      "javascript": "function coinChange(coins, amount) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            1,
            2,
            5
          ],
          11
        ],
        "expected": 3
      },
      {
        "input": [
          [
            2
          ],
          3
        ],
        "expected": -1
      },
      {
        "input": [
          [
            1
          ],
          0
        ],
        "expected": 0
      }
    ],
    "totalTestsCount": 18
  },
  {
    "id": "container-with-most-water",
    "slug": "container-with-most-water",
    "num": 6,
    "title": "Container With Most Water",
    "difficulty": "Medium",
    "acceptance": "48%",
    "category": "array",
    "topics": [
      "Array",
      "Two Pointers",
      "Greedy"
    ],
    "likes": "14.9k",
    "dislikes": "418",
    "statement": "`height[i]` is the height of a vertical line at position `i`. Choose two lines that, with the x-axis, form a container holding the most water. Return that maximum amount.\n\nExample 1:\nInput: height = [1,8,6,2,5,4,8,3,7]\nOutput: 49\n\nExample 2:\nInput: height = [1,1]\nOutput: 1",
    "desc": "`height[i]` is the height of a vertical line at position `i`. Choose two lines that, with the x-axis, form a container holding the most water. Return that maximum amount.",
    "constraints": "2 <= height.length <= 10^5\n0 <= height[i] <= 10^4",
    "hint": "",
    "functionName": "maxArea",
    "starterCode": {
      "python": "def maxArea(height):\n    # Write your solution here\n    pass\n",
      "javascript": "function maxArea(height) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            1,
            8,
            6,
            2,
            5,
            4,
            8,
            3,
            7
          ]
        ],
        "expected": 49
      },
      {
        "input": [
          [
            1,
            1
          ]
        ],
        "expected": 1
      }
    ],
    "totalTestsCount": 17
  },
  {
    "id": "contains-duplicate",
    "slug": "contains-duplicate",
    "num": 7,
    "title": "Contains Duplicate",
    "difficulty": "Easy",
    "acceptance": "65%",
    "category": "array",
    "topics": [
      "Array",
      "Hash Table"
    ],
    "likes": "9.2k",
    "dislikes": "427",
    "statement": "Given an integer array `nums`, return `true` if any value appears at least twice, and `false` if every element is distinct.\n\nExample 1:\nInput: nums = [1,2,3,1]\nOutput: true\n\nExample 2:\nInput: nums = [1,2,3,4]\nOutput: false",
    "desc": "Given an integer array `nums`, return `true` if any value appears at least twice, and `false` if every element is distinct.",
    "constraints": "1 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9",
    "hint": "",
    "functionName": "containsDuplicate",
    "starterCode": {
      "python": "def containsDuplicate(nums):\n    # Write your solution here\n    pass\n",
      "javascript": "function containsDuplicate(nums) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            1,
            2,
            3,
            1
          ]
        ],
        "expected": true
      },
      {
        "input": [
          [
            1,
            2,
            3,
            4
          ]
        ],
        "expected": false
      }
    ],
    "totalTestsCount": 17
  },
  {
    "id": "count-primes",
    "slug": "count-primes",
    "num": 8,
    "title": "Count Primes",
    "difficulty": "Medium",
    "acceptance": "48%",
    "category": "math",
    "topics": [
      "Math",
      "Sieve"
    ],
    "likes": "17.2k",
    "dislikes": "308",
    "statement": "Given an integer `n`, return the number of prime numbers strictly less than `n`.\n\nExample 1:\nInput: n = 10\nOutput: 4\n\nExample 2:\nInput: n = 0\nOutput: 0",
    "desc": "Given an integer `n`, return the number of prime numbers strictly less than `n`.",
    "constraints": "0 <= n <= 5 * 10^6",
    "hint": "",
    "functionName": "countPrimes",
    "starterCode": {
      "python": "def countPrimes(n):\n    # Write your solution here\n    pass\n",
      "javascript": "function countPrimes(n) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          10
        ],
        "expected": 4
      },
      {
        "input": [
          0
        ],
        "expected": 0
      },
      {
        "input": [
          1
        ],
        "expected": 0
      }
    ],
    "totalTestsCount": 19
  },
  {
    "id": "daily-temperatures",
    "slug": "daily-temperatures",
    "num": 9,
    "title": "Daily Temperatures",
    "difficulty": "Medium",
    "acceptance": "48%",
    "category": "array",
    "topics": [
      "Array",
      "Stack",
      "Monotonic Stack"
    ],
    "likes": "11.9k",
    "dislikes": "70",
    "statement": "Given an array `temperatures` of daily temperatures, return an array `answer` where `answer[i]` is the number of days you must wait after day `i` for a warmer temperature. If there is none, `answer[i] = 0`.\n\nExample 1:\nInput: temperatures = [73,74,75,71,69,72,76,73]\nOutput: [1,1,4,2,1,1,0,0]\n\nExample 2:\nInput: temperatures = [30,40,50,60]\nOutput: [1,1,1,0]",
    "desc": "Given an array `temperatures` of daily temperatures, return an array `answer` where `answer[i]` is the number of days you must wait after day `i` for a warmer temperature. If there is none, `answer[i] = 0`.",
    "constraints": "1 <= temperatures.length <= 10^5\n30 <= temperatures[i] <= 100",
    "hint": "",
    "functionName": "dailyTemperatures",
    "starterCode": {
      "python": "def dailyTemperatures(temperatures):\n    # Write your solution here\n    pass\n",
      "javascript": "function dailyTemperatures(temperatures) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            73,
            74,
            75,
            71,
            69,
            72,
            76,
            73
          ]
        ],
        "expected": [
          1,
          1,
          4,
          2,
          1,
          1,
          0,
          0
        ]
      },
      {
        "input": [
          [
            30,
            40,
            50,
            60
          ]
        ],
        "expected": [
          1,
          1,
          1,
          0
        ]
      }
    ],
    "totalTestsCount": 17
  },
  {
    "id": "find-minimum-in-rotated-sorted-array",
    "slug": "find-minimum-in-rotated-sorted-array",
    "num": 10,
    "title": "Find Minimum in Rotated Sorted Array",
    "difficulty": "Medium",
    "acceptance": "48%",
    "category": "array",
    "topics": [
      "Array",
      "Binary Search"
    ],
    "likes": "16.4k",
    "dislikes": "249",
    "statement": "A sorted array of unique integers was rotated between 1 and n times. Given the rotated array `nums`, return its minimum element. Your algorithm must run in O(log n).\n\nExample 1:\nInput: nums = [3,4,5,1,2]\nOutput: 1\n\nExample 2:\nInput: nums = [4,5,6,7,0,1,2]\nOutput: 0",
    "desc": "A sorted array of unique integers was rotated between 1 and n times. Given the rotated array `nums`, return its minimum element. Your algorithm must run in O(log n).",
    "constraints": "1 <= nums.length <= 5000\nAll values are unique.",
    "hint": "",
    "functionName": "findMin",
    "starterCode": {
      "python": "def findMin(nums):\n    # Write your solution here\n    pass\n",
      "javascript": "function findMin(nums) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            3,
            4,
            5,
            1,
            2
          ]
        ],
        "expected": 1
      },
      {
        "input": [
          [
            4,
            5,
            6,
            7,
            0,
            1,
            2
          ]
        ],
        "expected": 0
      }
    ],
    "totalTestsCount": 17
  },
  {
    "id": "fizz-buzz",
    "slug": "fizz-buzz",
    "num": 11,
    "title": "Fizz Buzz",
    "difficulty": "Easy",
    "acceptance": "65%",
    "category": "math",
    "topics": [
      "Math",
      "String"
    ],
    "likes": "8.6k",
    "dislikes": "338",
    "statement": "Given an integer `n`, return a string array `answer` (1-indexed) where `answer[i]` is `\"FizzBuzz\"` if i is divisible by 3 and 5, `\"Fizz\"` if divisible by 3, `\"Buzz\"` if divisible by 5, otherwise `i` as a string.\n\nExample 1:\nInput: n = 3\nOutput: [\"1\",\"2\",\"Fizz\"]\n\nExample 2:\nInput: n = 5\nOutput: [\"1\",\"2\",\"Fizz\",\"4\",\"Buzz\"]",
    "desc": "Given an integer `n`, return a string array `answer` (1-indexed) where `answer[i]` is `\"FizzBuzz\"` if i is divisible by 3 and 5, `\"Fizz\"` if divisible by 3, `\"Buzz\"` if divisible by 5, otherwise `i` as a string.",
    "constraints": "1 <= n <= 10^4",
    "hint": "",
    "functionName": "fizzBuzz",
    "starterCode": {
      "python": "def fizzBuzz(n):\n    # Write your solution here\n    pass\n",
      "javascript": "function fizzBuzz(n) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          3
        ],
        "expected": [
          "1",
          "2",
          "Fizz"
        ]
      },
      {
        "input": [
          5
        ],
        "expected": [
          "1",
          "2",
          "Fizz",
          "4",
          "Buzz"
        ]
      },
      {
        "input": [
          15
        ],
        "expected": [
          "1",
          "2",
          "Fizz",
          "4",
          "Buzz",
          "Fizz",
          "7",
          "8",
          "Fizz",
          "Buzz",
          "11",
          "Fizz",
          "13",
          "14",
          "FizzBuzz"
        ]
      }
    ],
    "totalTestsCount": 17
  },
  {
    "id": "group-anagrams",
    "slug": "group-anagrams",
    "num": 12,
    "title": "Group Anagrams",
    "difficulty": "Medium",
    "acceptance": "48%",
    "category": "array",
    "topics": [
      "Array",
      "Hash Table",
      "String",
      "Sorting"
    ],
    "likes": "15.9k",
    "dislikes": "225",
    "statement": "Given an array of strings `strs`, group the anagrams together. Return the groups in any order, and the strings inside each group in any order.\n\nExample 1:\nInput: strs = [\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]\nOutput: [[\"eat\",\"tea\",\"ate\"],[\"tan\",\"nat\"],[\"bat\"]]\n\nExample 2:\nInput: strs = [\"a\"]\nOutput: [[\"a\"]]",
    "desc": "Given an array of strings `strs`, group the anagrams together. Return the groups in any order, and the strings inside each group in any order.",
    "constraints": "1 <= strs.length <= 10^4\n1 <= strs[i].length <= 100\nstrs[i] consists of lowercase English letters.",
    "hint": "",
    "functionName": "groupAnagrams",
    "starterCode": {
      "python": "def groupAnagrams(strs):\n    # Write your solution here\n    pass\n",
      "javascript": "function groupAnagrams(strs) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            "eat",
            "tea",
            "tan",
            "ate",
            "nat",
            "bat"
          ]
        ],
        "expected": [
          [
            "eat",
            "tea",
            "ate"
          ],
          [
            "tan",
            "nat"
          ],
          [
            "bat"
          ]
        ]
      },
      {
        "input": [
          [
            "a"
          ]
        ],
        "expected": [
          [
            "a"
          ]
        ]
      }
    ],
    "totalTestsCount": 15
  },
  {
    "id": "house-robber",
    "slug": "house-robber",
    "num": 13,
    "title": "House Robber",
    "difficulty": "Medium",
    "acceptance": "48%",
    "category": "array",
    "topics": [
      "Array",
      "Dynamic Programming"
    ],
    "likes": "16.1k",
    "dislikes": "119",
    "statement": "`nums[i]` is the money in house `i`. Adjacent houses have linked alarms, so you cannot rob two adjacent houses. Return the maximum amount you can rob.\n\nExample 1:\nInput: nums = [1,2,3,1]\nOutput: 4\n\nExample 2:\nInput: nums = [2,7,9,3,1]\nOutput: 12",
    "desc": "`nums[i]` is the money in house `i`. Adjacent houses have linked alarms, so you cannot rob two adjacent houses. Return the maximum amount you can rob.",
    "constraints": "1 <= nums.length <= 100\n0 <= nums[i] <= 400",
    "hint": "",
    "functionName": "rob",
    "starterCode": {
      "python": "def rob(nums):\n    # Write your solution here\n    pass\n",
      "javascript": "function rob(nums) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            1,
            2,
            3,
            1
          ]
        ],
        "expected": 4
      },
      {
        "input": [
          [
            2,
            7,
            9,
            3,
            1
          ]
        ],
        "expected": 12
      }
    ],
    "totalTestsCount": 16
  },
  {
    "id": "jump-game",
    "slug": "jump-game",
    "num": 14,
    "title": "Jump Game",
    "difficulty": "Medium",
    "acceptance": "48%",
    "category": "array",
    "topics": [
      "Array",
      "Greedy",
      "Dynamic Programming"
    ],
    "likes": "10.8k",
    "dislikes": "373",
    "statement": "`nums[i]` is the maximum jump length from index `i`. Starting at index 0, return `true` if you can reach the last index, otherwise `false`.\n\nExample 1:\nInput: nums = [2,3,1,1,4]\nOutput: true\n\nExample 2:\nInput: nums = [3,2,1,0,4]\nOutput: false",
    "desc": "`nums[i]` is the maximum jump length from index `i`. Starting at index 0, return `true` if you can reach the last index, otherwise `false`.",
    "constraints": "1 <= nums.length <= 10^4\n0 <= nums[i] <= 10^5",
    "hint": "",
    "functionName": "canJump",
    "starterCode": {
      "python": "def canJump(nums):\n    # Write your solution here\n    pass\n",
      "javascript": "function canJump(nums) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            2,
            3,
            1,
            1,
            4
          ]
        ],
        "expected": true
      },
      {
        "input": [
          [
            3,
            2,
            1,
            0,
            4
          ]
        ],
        "expected": false
      }
    ],
    "totalTestsCount": 17
  },
  {
    "id": "longest-common-prefix",
    "slug": "longest-common-prefix",
    "num": 15,
    "title": "Longest Common Prefix",
    "difficulty": "Easy",
    "acceptance": "65%",
    "category": "string",
    "topics": [
      "String"
    ],
    "likes": "5.1k",
    "dislikes": "288",
    "statement": "Write a function to find the longest common prefix string amongst an array of strings. If there is none, return an empty string.\n\nExample 1:\nInput: strs = [\"flower\",\"flow\",\"flight\"]\nOutput: \"fl\"\n\nExample 2:\nInput: strs = [\"dog\",\"racecar\",\"car\"]\nOutput: \"\"",
    "desc": "Write a function to find the longest common prefix string amongst an array of strings. If there is none, return an empty string.",
    "constraints": "1 <= strs.length <= 200\n0 <= strs[i].length <= 200\nstrs[i] consists of lowercase English letters.",
    "hint": "",
    "functionName": "longestCommonPrefix",
    "starterCode": {
      "python": "def longestCommonPrefix(strs):\n    # Write your solution here\n    pass\n",
      "javascript": "function longestCommonPrefix(strs) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            "flower",
            "flow",
            "flight"
          ]
        ],
        "expected": "fl"
      },
      {
        "input": [
          [
            "dog",
            "racecar",
            "car"
          ]
        ],
        "expected": ""
      }
    ],
    "totalTestsCount": 16
  },
  {
    "id": "longest-increasing-subsequence",
    "slug": "longest-increasing-subsequence",
    "num": 16,
    "title": "Longest Increasing Subsequence",
    "difficulty": "Medium",
    "acceptance": "48%",
    "category": "array",
    "topics": [
      "Array",
      "Binary Search",
      "Dynamic Programming"
    ],
    "likes": "9.2k",
    "dislikes": "99",
    "statement": "Given an integer array `nums`, return the length of the longest strictly increasing subsequence.\n\nExample 1:\nInput: nums = [10,9,2,5,3,7,101,18]\nOutput: 4\n\nExample 2:\nInput: nums = [0,1,0,3,2,3]\nOutput: 4",
    "desc": "Given an integer array `nums`, return the length of the longest strictly increasing subsequence.",
    "constraints": "1 <= nums.length <= 2500\n-10^4 <= nums[i] <= 10^4",
    "hint": "",
    "functionName": "lengthOfLIS",
    "starterCode": {
      "python": "def lengthOfLIS(nums):\n    # Write your solution here\n    pass\n",
      "javascript": "function lengthOfLIS(nums) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            10,
            9,
            2,
            5,
            3,
            7,
            101,
            18
          ]
        ],
        "expected": 4
      },
      {
        "input": [
          [
            0,
            1,
            0,
            3,
            2,
            3
          ]
        ],
        "expected": 4
      },
      {
        "input": [
          [
            7,
            7,
            7,
            7
          ]
        ],
        "expected": 1
      }
    ],
    "totalTestsCount": 18
  },
  {
    "id": "longest-palindromic-substring-length",
    "slug": "longest-palindromic-substring-length",
    "num": 17,
    "title": "Longest Palindromic Substring (Length)",
    "difficulty": "Medium",
    "acceptance": "48%",
    "category": "string",
    "topics": [
      "String",
      "Dynamic Programming"
    ],
    "likes": "19.9k",
    "dislikes": "374",
    "statement": "Given a string `s`, return the length of the longest palindromic substring in `s`.\n\nExample 1:\nInput: s = \"babad\"\nOutput: 3\n\nExample 2:\nInput: s = \"cbbd\"\nOutput: 2",
    "desc": "Given a string `s`, return the length of the longest palindromic substring in `s`.",
    "constraints": "1 <= s.length <= 1000\ns consists of lowercase English letters.",
    "hint": "",
    "functionName": "longestPalindromeLength",
    "starterCode": {
      "python": "def longestPalindromeLength(s):\n    # Write your solution here\n    pass\n",
      "javascript": "function longestPalindromeLength(s) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          "babad"
        ],
        "expected": 3
      },
      {
        "input": [
          "cbbd"
        ],
        "expected": 2
      },
      {
        "input": [
          "a"
        ],
        "expected": 1
      }
    ],
    "totalTestsCount": 18
  },
  {
    "id": "longest-substring-without-repeating-characters",
    "slug": "longest-substring-without-repeating-characters",
    "num": 18,
    "title": "Longest Substring Without Repeating Characters",
    "difficulty": "Medium",
    "acceptance": "48%",
    "category": "string",
    "topics": [
      "String",
      "Sliding Window",
      "Hash Table"
    ],
    "likes": "16.1k",
    "dislikes": "63",
    "statement": "Given a string `s`, return the length of the longest substring that contains no repeated characters.\n\nExample 1:\nInput: s = \"abcabcbb\"\nOutput: 3\n\nExample 2:\nInput: s = \"bbbbb\"\nOutput: 1",
    "desc": "Given a string `s`, return the length of the longest substring that contains no repeated characters.",
    "constraints": "0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.",
    "hint": "",
    "functionName": "lengthOfLongestSubstring",
    "starterCode": {
      "python": "def lengthOfLongestSubstring(s):\n    # Write your solution here\n    pass\n",
      "javascript": "function lengthOfLongestSubstring(s) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          "abcabcbb"
        ],
        "expected": 3
      },
      {
        "input": [
          "bbbbb"
        ],
        "expected": 1
      },
      {
        "input": [
          "pwwkew"
        ],
        "expected": 3
      }
    ],
    "totalTestsCount": 18
  },
  {
    "id": "majority-element",
    "slug": "majority-element",
    "num": 19,
    "title": "Majority Element",
    "difficulty": "Easy",
    "acceptance": "65%",
    "category": "array",
    "topics": [
      "Array",
      "Hash Table",
      "Counting"
    ],
    "likes": "18.9k",
    "dislikes": "196",
    "statement": "Given an array `nums` of size `n`, return the majority element: the element that appears more than `n / 2` times. It always exists.\n\nExample 1:\nInput: nums = [3,2,3]\nOutput: 3\n\nExample 2:\nInput: nums = [2,2,1,1,1,2,2]\nOutput: 2",
    "desc": "Given an array `nums` of size `n`, return the majority element: the element that appears more than `n / 2` times. It always exists.",
    "constraints": "1 <= n <= 5 * 10^4\nA majority element always exists.",
    "hint": "",
    "functionName": "majorityElement",
    "starterCode": {
      "python": "def majorityElement(nums):\n    # Write your solution here\n    pass\n",
      "javascript": "function majorityElement(nums) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            3,
            2,
            3
          ]
        ],
        "expected": 3
      },
      {
        "input": [
          [
            2,
            2,
            1,
            1,
            1,
            2,
            2
          ]
        ],
        "expected": 2
      }
    ],
    "totalTestsCount": 16
  },
  {
    "id": "maximum-subarray",
    "slug": "maximum-subarray",
    "num": 20,
    "title": "Maximum Subarray",
    "difficulty": "Medium",
    "acceptance": "48%",
    "category": "array",
    "topics": [
      "Array",
      "Dynamic Programming"
    ],
    "likes": "15.4k",
    "dislikes": "115",
    "statement": "Given an integer array `nums`, find the contiguous subarray (at least one element) with the largest sum and return that sum.\n\nExample 1:\nInput: nums = [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6\n\nExample 2:\nInput: nums = [1]\nOutput: 1",
    "desc": "Given an integer array `nums`, find the contiguous subarray (at least one element) with the largest sum and return that sum.",
    "constraints": "1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4",
    "hint": "",
    "functionName": "maxSubArray",
    "starterCode": {
      "python": "def maxSubArray(nums):\n    # Write your solution here\n    pass\n",
      "javascript": "function maxSubArray(nums) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            -2,
            1,
            -3,
            4,
            -1,
            2,
            1,
            -5,
            4
          ]
        ],
        "expected": 6
      },
      {
        "input": [
          [
            1
          ]
        ],
        "expected": 1
      }
    ],
    "totalTestsCount": 17
  },
  {
    "id": "merge-intervals",
    "slug": "merge-intervals",
    "num": 21,
    "title": "Merge Intervals",
    "difficulty": "Medium",
    "acceptance": "48%",
    "category": "array",
    "topics": [
      "Array",
      "Sorting",
      "Intervals"
    ],
    "likes": "7.3k",
    "dislikes": "364",
    "statement": "Given an array of `intervals` where `intervals[i] = [start, end]`, merge all overlapping intervals (intervals that touch, like `[1,4]` and `[4,5]`, overlap) and return the non-overlapping intervals sorted by start.\n\nExample 1:\nInput: intervals = [[1,3],[2,6],[8,10],[15,18]]\nOutput: [[1,6],[8,10],[15,18]]\n\nExample 2:\nInput: intervals = [[1,4],[4,5]]\nOutput: [[1,5]]",
    "desc": "Given an array of `intervals` where `intervals[i] = [start, end]`, merge all overlapping intervals (intervals that touch, like `[1,4]` and `[4,5]`, overlap) and return the non-overlapping intervals sorted by start.",
    "constraints": "1 <= intervals.length <= 10^4\n0 <= start <= end <= 10^4",
    "hint": "",
    "functionName": "merge",
    "starterCode": {
      "python": "def merge(intervals):\n    # Write your solution here\n    pass\n",
      "javascript": "function merge(intervals) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            [
              1,
              3
            ],
            [
              2,
              6
            ],
            [
              8,
              10
            ],
            [
              15,
              18
            ]
          ]
        ],
        "expected": [
          [
            1,
            6
          ],
          [
            8,
            10
          ],
          [
            15,
            18
          ]
        ]
      },
      {
        "input": [
          [
            [
              1,
              4
            ],
            [
              4,
              5
            ]
          ]
        ],
        "expected": [
          [
            1,
            5
          ]
        ]
      }
    ],
    "totalTestsCount": 16
  },
  {
    "id": "missing-number",
    "slug": "missing-number",
    "num": 22,
    "title": "Missing Number",
    "difficulty": "Easy",
    "acceptance": "65%",
    "category": "array",
    "topics": [
      "Array",
      "Math",
      "Bit Manipulation"
    ],
    "likes": "8.3k",
    "dislikes": "65",
    "statement": "Given an array `nums` containing `n` distinct numbers in the range `[0, n]`, return the only number in the range that is missing.\n\nExample 1:\nInput: nums = [3,0,1]\nOutput: 2\n\nExample 2:\nInput: nums = [0,1]\nOutput: 2",
    "desc": "Given an array `nums` containing `n` distinct numbers in the range `[0, n]`, return the only number in the range that is missing.",
    "constraints": "1 <= n <= 10^4\nAll numbers are unique.",
    "hint": "",
    "functionName": "missingNumber",
    "starterCode": {
      "python": "def missingNumber(nums):\n    # Write your solution here\n    pass\n",
      "javascript": "function missingNumber(nums) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            3,
            0,
            1
          ]
        ],
        "expected": 2
      },
      {
        "input": [
          [
            0,
            1
          ]
        ],
        "expected": 2
      },
      {
        "input": [
          [
            9,
            6,
            4,
            2,
            3,
            5,
            7,
            0,
            1
          ]
        ],
        "expected": 8
      }
    ],
    "totalTestsCount": 17
  },
  {
    "id": "move-zeroes",
    "slug": "move-zeroes",
    "num": 23,
    "title": "Move Zeroes",
    "difficulty": "Easy",
    "acceptance": "65%",
    "category": "array",
    "topics": [
      "Array",
      "Two Pointers"
    ],
    "likes": "15.9k",
    "dislikes": "394",
    "statement": "Given an integer array `nums`, return the array with all `0`s moved to the end while keeping the relative order of the non-zero elements.\n\nExample 1:\nInput: nums = [0,1,0,3,12]\nOutput: [1,3,12,0,0]\n\nExample 2:\nInput: nums = [0]\nOutput: [0]",
    "desc": "Given an integer array `nums`, return the array with all `0`s moved to the end while keeping the relative order of the non-zero elements.",
    "constraints": "1 <= nums.length <= 10^4\n-2^31 <= nums[i] <= 2^31 - 1",
    "hint": "",
    "functionName": "moveZeroes",
    "starterCode": {
      "python": "def moveZeroes(nums):\n    # Write your solution here\n    pass\n",
      "javascript": "function moveZeroes(nums) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            0,
            1,
            0,
            3,
            12
          ]
        ],
        "expected": [
          1,
          3,
          12,
          0,
          0
        ]
      },
      {
        "input": [
          [
            0
          ]
        ],
        "expected": [
          0
        ]
      }
    ],
    "totalTestsCount": 17
  },
  {
    "id": "palindrome-number",
    "slug": "palindrome-number",
    "num": 24,
    "title": "Palindrome Number",
    "difficulty": "Easy",
    "acceptance": "65%",
    "category": "math",
    "topics": [
      "Math"
    ],
    "likes": "16.5k",
    "dislikes": "100",
    "statement": "Given an integer `x`, return `true` if `x` is a palindrome (reads the same forward and backward), otherwise `false`. Negative numbers are never palindromes.\n\nExample 1:\nInput: x = 121\nOutput: true\n\nExample 2:\nInput: x = -121\nOutput: false",
    "desc": "Given an integer `x`, return `true` if `x` is a palindrome (reads the same forward and backward), otherwise `false`. Negative numbers are never palindromes.",
    "constraints": "-2^31 <= x <= 2^31 - 1",
    "hint": "",
    "functionName": "isPalindrome",
    "starterCode": {
      "python": "def isPalindrome(x):\n    # Write your solution here\n    pass\n",
      "javascript": "function isPalindrome(x) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          121
        ],
        "expected": true
      },
      {
        "input": [
          -121
        ],
        "expected": false
      },
      {
        "input": [
          10
        ],
        "expected": false
      }
    ],
    "totalTestsCount": 17
  },
  {
    "id": "product-of-array-except-self",
    "slug": "product-of-array-except-self",
    "num": 25,
    "title": "Product of Array Except Self",
    "difficulty": "Medium",
    "acceptance": "48%",
    "category": "array",
    "topics": [
      "Array",
      "Prefix Sum"
    ],
    "likes": "8.3k",
    "dislikes": "227",
    "statement": "Given an integer array `nums`, return an array `answer` where `answer[i]` is the product of all elements of `nums` except `nums[i]`. Do it without using division, in O(n) time.\n\nExample 1:\nInput: nums = [1,2,3,4]\nOutput: [24,12,8,6]\n\nExample 2:\nInput: nums = [-1,1,0,-3,3]\nOutput: [0,0,9,0,0]",
    "desc": "Given an integer array `nums`, return an array `answer` where `answer[i]` is the product of all elements of `nums` except `nums[i]`. Do it without using division, in O(n) time.",
    "constraints": "2 <= nums.length <= 10^5\nThe product of any prefix or suffix fits in a 32-bit integer.",
    "hint": "",
    "functionName": "productExceptSelf",
    "starterCode": {
      "python": "def productExceptSelf(nums):\n    # Write your solution here\n    pass\n",
      "javascript": "function productExceptSelf(nums) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            1,
            2,
            3,
            4
          ]
        ],
        "expected": [
          24,
          12,
          8,
          6
        ]
      },
      {
        "input": [
          [
            -1,
            1,
            0,
            -3,
            3
          ]
        ],
        "expected": [
          0,
          0,
          9,
          0,
          0
        ]
      }
    ],
    "totalTestsCount": 17
  },
  {
    "id": "reverse-words-in-a-string",
    "slug": "reverse-words-in-a-string",
    "num": 26,
    "title": "Reverse Words in a String",
    "difficulty": "Medium",
    "acceptance": "48%",
    "category": "string",
    "topics": [
      "String",
      "Two Pointers"
    ],
    "likes": "14.7k",
    "dislikes": "302",
    "statement": "Given a string `s`, reverse the order of its words. Words are separated by one or more spaces. Return the words in reverse order joined by a single space, with no leading or trailing spaces.\n\nExample 1:\nInput: s = \"the sky is blue\"\nOutput: \"blue is sky the\"\n\nExample 2:\nInput: s = \"  hello world  \"\nOutput: \"world hello\"",
    "desc": "Given a string `s`, reverse the order of its words. Words are separated by one or more spaces. Return the words in reverse order joined by a single space, with no leading or trailing spaces.",
    "constraints": "1 <= s.length <= 10^4\ns contains at least one word.",
    "hint": "",
    "functionName": "reverseWords",
    "starterCode": {
      "python": "def reverseWords(s):\n    # Write your solution here\n    pass\n",
      "javascript": "function reverseWords(s) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          "the sky is blue"
        ],
        "expected": "blue is sky the"
      },
      {
        "input": [
          "  hello world  "
        ],
        "expected": "world hello"
      }
    ],
    "totalTestsCount": 16
  },
  {
    "id": "roman-to-integer",
    "slug": "roman-to-integer",
    "num": 27,
    "title": "Roman to Integer",
    "difficulty": "Easy",
    "acceptance": "65%",
    "category": "math",
    "topics": [
      "Math",
      "String"
    ],
    "likes": "16.3k",
    "dislikes": "294",
    "statement": "Roman numerals use `I=1, V=5, X=10, L=50, C=100, D=500, M=1000`. When a smaller value precedes a larger one it is subtracted (`IV=4`, `IX=9`, `XL=40`, `XC=90`, `CD=400`, `CM=900`). Given a valid Roman numeral `s`, return its integer value.\n\nExample 1:\nInput: s = \"III\"\nOutput: 3\n\nExample 2:\nInput: s = \"LVIII\"\nOutput: 58",
    "desc": "Roman numerals use `I=1, V=5, X=10, L=50, C=100, D=500, M=1000`. When a smaller value precedes a larger one it is subtracted (`IV=4`, `IX=9`, `XL=40`, `XC=90`, `CD=400`, `CM=900`). Given a valid Roman numeral `s`, return its integer value.",
    "constraints": "1 <= s.length <= 15\ns is a valid Roman numeral in the range [1, 3999].",
    "hint": "",
    "functionName": "romanToInt",
    "starterCode": {
      "python": "def romanToInt(s):\n    # Write your solution here\n    pass\n",
      "javascript": "function romanToInt(s) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          "III"
        ],
        "expected": 3
      },
      {
        "input": [
          "LVIII"
        ],
        "expected": 58
      },
      {
        "input": [
          "MCMXCIV"
        ],
        "expected": 1994
      }
    ],
    "totalTestsCount": 17
  },
  {
    "id": "rotate-array",
    "slug": "rotate-array",
    "num": 28,
    "title": "Rotate Array",
    "difficulty": "Medium",
    "acceptance": "48%",
    "category": "array",
    "topics": [
      "Array",
      "Math"
    ],
    "likes": "16.6k",
    "dislikes": "229",
    "statement": "Given an integer array `nums` and a non-negative integer `k`, return the array rotated to the right by `k` steps.\n\nExample 1:\nInput: nums = [1,2,3,4,5,6,7], k = 3\nOutput: [5,6,7,1,2,3,4]\n\nExample 2:\nInput: nums = [-1,-100,3,99], k = 2\nOutput: [3,99,-1,-100]",
    "desc": "Given an integer array `nums` and a non-negative integer `k`, return the array rotated to the right by `k` steps.",
    "constraints": "1 <= nums.length <= 10^5\n0 <= k <= 10^5",
    "hint": "",
    "functionName": "rotate",
    "starterCode": {
      "python": "def rotate(nums, k):\n    # Write your solution here\n    pass\n",
      "javascript": "function rotate(nums, k) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            1,
            2,
            3,
            4,
            5,
            6,
            7
          ],
          3
        ],
        "expected": [
          5,
          6,
          7,
          1,
          2,
          3,
          4
        ]
      },
      {
        "input": [
          [
            -1,
            -100,
            3,
            99
          ],
          2
        ],
        "expected": [
          3,
          99,
          -1,
          -100
        ]
      }
    ],
    "totalTestsCount": 17
  },
  {
    "id": "search-in-rotated-sorted-array",
    "slug": "search-in-rotated-sorted-array",
    "num": 29,
    "title": "Search in Rotated Sorted Array",
    "difficulty": "Medium",
    "acceptance": "48%",
    "category": "array",
    "topics": [
      "Array",
      "Binary Search"
    ],
    "likes": "16.1k",
    "dislikes": "410",
    "statement": "A sorted array of distinct integers was rotated at an unknown pivot (for example `[0,1,2,4,5,6,7]` may become `[4,5,6,7,0,1,2]`). Given the rotated array `nums` and an integer `target`, return the index of `target`, or `-1` if absent. Your solution must run in O(log n).\n\nExample 1:\nInput: nums = [4,5,6,7,0,1,2], target = 0\nOutput: 4\n\nExample 2:\nInput: nums = [4,5,6,7,0,1,2], target = 3\nOutput: -1",
    "desc": "A sorted array of distinct integers was rotated at an unknown pivot (for example `[0,1,2,4,5,6,7]` may become `[4,5,6,7,0,1,2]`). Given the rotated array `nums` and an integer `target`, return the index of `target`, or `-1` if absent. Your solution must run in O(log n).",
    "constraints": "1 <= nums.length <= 5000\nAll values are distinct.",
    "hint": "",
    "functionName": "search",
    "starterCode": {
      "python": "def search(nums, target):\n    # Write your solution here\n    pass\n",
      "javascript": "function search(nums, target) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            4,
            5,
            6,
            7,
            0,
            1,
            2
          ],
          0
        ],
        "expected": 4
      },
      {
        "input": [
          [
            4,
            5,
            6,
            7,
            0,
            1,
            2
          ],
          3
        ],
        "expected": -1
      },
      {
        "input": [
          [
            1
          ],
          0
        ],
        "expected": -1
      }
    ],
    "totalTestsCount": 18
  },
  {
    "id": "single-number",
    "slug": "single-number",
    "num": 30,
    "title": "Single Number",
    "difficulty": "Easy",
    "acceptance": "65%",
    "category": "array",
    "topics": [
      "Array",
      "Bit Manipulation"
    ],
    "likes": "10.7k",
    "dislikes": "349",
    "statement": "Every element in `nums` appears twice except for one that appears once. Return that single element. Use linear time and constant extra space.\n\nExample 1:\nInput: nums = [2,2,1]\nOutput: 1\n\nExample 2:\nInput: nums = [4,1,2,1,2]\nOutput: 4",
    "desc": "Every element in `nums` appears twice except for one that appears once. Return that single element. Use linear time and constant extra space.",
    "constraints": "1 <= nums.length <= 3 * 10^4\nEvery element appears twice except one.",
    "hint": "",
    "functionName": "singleNumber",
    "starterCode": {
      "python": "def singleNumber(nums):\n    # Write your solution here\n    pass\n",
      "javascript": "function singleNumber(nums) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            2,
            2,
            1
          ]
        ],
        "expected": 1
      },
      {
        "input": [
          [
            4,
            1,
            2,
            1,
            2
          ]
        ],
        "expected": 4
      }
    ],
    "totalTestsCount": 16
  },
  {
    "id": "subarray-sum-equals-k",
    "slug": "subarray-sum-equals-k",
    "num": 31,
    "title": "Subarray Sum Equals K",
    "difficulty": "Medium",
    "acceptance": "48%",
    "category": "array",
    "topics": [
      "Array",
      "Hash Table",
      "Prefix Sum"
    ],
    "likes": "9.2k",
    "dislikes": "135",
    "statement": "Given an integer array `nums` and an integer `k`, return the total number of contiguous subarrays whose sum equals `k`.\n\nExample 1:\nInput: nums = [1,1,1], k = 2\nOutput: 2\n\nExample 2:\nInput: nums = [1,2,3], k = 3\nOutput: 2",
    "desc": "Given an integer array `nums` and an integer `k`, return the total number of contiguous subarrays whose sum equals `k`.",
    "constraints": "1 <= nums.length <= 2 * 10^4\n-1000 <= nums[i] <= 1000\n-10^7 <= k <= 10^7",
    "hint": "",
    "functionName": "subarraySum",
    "starterCode": {
      "python": "def subarraySum(nums, k):\n    # Write your solution here\n    pass\n",
      "javascript": "function subarraySum(nums, k) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            1,
            1,
            1
          ],
          2
        ],
        "expected": 2
      },
      {
        "input": [
          [
            1,
            2,
            3
          ],
          3
        ],
        "expected": 2
      }
    ],
    "totalTestsCount": 17
  },
  {
    "id": "top-k-frequent",
    "slug": "top-k-frequent",
    "num": 32,
    "title": "Top K Frequent Elements",
    "difficulty": "Medium",
    "acceptance": "48%",
    "category": "array",
    "topics": [
      "Array",
      "Hash Table",
      "Heap",
      "Sorting"
    ],
    "likes": "18.2k",
    "dislikes": "282",
    "statement": "Given an integer array `nums` and an integer `k`, return the `k` most frequent elements in any order. The answer is guaranteed to be unique.\n\nExample 1:\nInput: nums = [1,1,1,2,2,3], k = 2\nOutput: [1,2]\n\nExample 2:\nInput: nums = [1], k = 1\nOutput: [1]",
    "desc": "Given an integer array `nums` and an integer `k`, return the `k` most frequent elements in any order. The answer is guaranteed to be unique.",
    "constraints": "1 <= nums.length <= 10^5\n1 <= k <= number of distinct elements\nThe answer is guaranteed unique.",
    "hint": "",
    "functionName": "topKFrequent",
    "starterCode": {
      "python": "def topKFrequent(nums, k):\n    # Write your solution here\n    pass\n",
      "javascript": "function topKFrequent(nums, k) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            1,
            1,
            1,
            2,
            2,
            3
          ],
          2
        ],
        "expected": [
          1,
          2
        ]
      },
      {
        "input": [
          [
            1
          ],
          1
        ],
        "expected": [
          1
        ]
      }
    ],
    "totalTestsCount": 16
  },
  {
    "id": "two-sum",
    "slug": "two-sum",
    "num": 33,
    "title": "Two Sum",
    "difficulty": "Easy",
    "acceptance": "65%",
    "category": "array",
    "topics": [
      "Array",
      "Hash Table"
    ],
    "likes": "9.6k",
    "dislikes": "373",
    "statement": "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`. Exactly one solution exists, and you may not use the same element twice. The answer may be returned in any order.\n\nExample 1:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\n\nExample 2:\nInput: nums = [3,2,4], target = 6\nOutput: [1,2]",
    "desc": "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`. Exactly one solution exists, and you may not use the same element twice. The answer may be returned in any order.",
    "constraints": "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nExactly one valid answer exists.",
    "hint": "Store each number's index in a hash map as you scan.",
    "functionName": "twoSum",
    "starterCode": {
      "python": "def twoSum(nums, target):\n    # Write your solution here\n    pass\n",
      "javascript": "function twoSum(nums, target) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          [
            2,
            7,
            11,
            15
          ],
          9
        ],
        "expected": [
          0,
          1
        ]
      },
      {
        "input": [
          [
            3,
            2,
            4
          ],
          6
        ],
        "expected": [
          1,
          2
        ]
      },
      {
        "input": [
          [
            3,
            3
          ],
          6
        ],
        "expected": [
          0,
          1
        ]
      }
    ],
    "totalTestsCount": 18
  },
  {
    "id": "unique-paths",
    "slug": "unique-paths",
    "num": 34,
    "title": "Unique Paths",
    "difficulty": "Medium",
    "acceptance": "48%",
    "category": "math",
    "topics": [
      "Math",
      "Dynamic Programming",
      "Combinatorics"
    ],
    "likes": "14.5k",
    "dislikes": "276",
    "statement": "A robot starts at the top-left of an `m x n` grid and can only move right or down. Return the number of unique paths to the bottom-right corner.\n\nExample 1:\nInput: m = 3, n = 7\nOutput: 28\n\nExample 2:\nInput: m = 3, n = 2\nOutput: 3",
    "desc": "A robot starts at the top-left of an `m x n` grid and can only move right or down. Return the number of unique paths to the bottom-right corner.",
    "constraints": "1 <= m, n <= 18",
    "hint": "",
    "functionName": "uniquePaths",
    "starterCode": {
      "python": "def uniquePaths(m, n):\n    # Write your solution here\n    pass\n",
      "javascript": "function uniquePaths(m, n) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          3,
          7
        ],
        "expected": 28
      },
      {
        "input": [
          3,
          2
        ],
        "expected": 3
      }
    ],
    "totalTestsCount": 16
  },
  {
    "id": "valid-anagram",
    "slug": "valid-anagram",
    "num": 35,
    "title": "Valid Anagram",
    "difficulty": "Easy",
    "acceptance": "65%",
    "category": "string",
    "topics": [
      "String",
      "Hash Table"
    ],
    "likes": "9.4k",
    "dislikes": "169",
    "statement": "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s` (same letters, same counts, any order), otherwise `false`.\n\nExample 1:\nInput: s = \"anagram\", t = \"nagaram\"\nOutput: true\n\nExample 2:\nInput: s = \"rat\", t = \"car\"\nOutput: false",
    "desc": "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s` (same letters, same counts, any order), otherwise `false`.",
    "constraints": "1 <= s.length, t.length <= 5 * 10^4\ns and t consist of lowercase English letters.",
    "hint": "",
    "functionName": "isAnagram",
    "starterCode": {
      "python": "def isAnagram(s, t):\n    # Write your solution here\n    pass\n",
      "javascript": "function isAnagram(s, t) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          "anagram",
          "nagaram"
        ],
        "expected": true
      },
      {
        "input": [
          "rat",
          "car"
        ],
        "expected": false
      }
    ],
    "totalTestsCount": 17
  },
  {
    "id": "valid-palindrome",
    "slug": "valid-palindrome",
    "num": 36,
    "title": "Valid Palindrome",
    "difficulty": "Easy",
    "acceptance": "65%",
    "category": "string",
    "topics": [
      "String",
      "Two Pointers"
    ],
    "likes": "6.6k",
    "dislikes": "341",
    "statement": "After converting all uppercase letters to lowercase and removing every character that is not a letter or digit, a phrase is a palindrome if it reads the same forward and backward. Given a string `s`, return `true` if it is a palindrome, otherwise `false`.\n\nExample 1:\nInput: s = \"A man, a plan, a canal: Panama\"\nOutput: true\n\nExample 2:\nInput: s = \"race a car\"\nOutput: false",
    "desc": "After converting all uppercase letters to lowercase and removing every character that is not a letter or digit, a phrase is a palindrome if it reads the same forward and backward. Given a string `s`, return `true` if it is a palindrome, otherwise `false`.",
    "constraints": "1 <= s.length <= 2 * 10^5\ns consists of printable ASCII characters.",
    "hint": "",
    "functionName": "isPalindrome",
    "starterCode": {
      "python": "def isPalindrome(s):\n    # Write your solution here\n    pass\n",
      "javascript": "function isPalindrome(s) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          "A man, a plan, a canal: Panama"
        ],
        "expected": true
      },
      {
        "input": [
          "race a car"
        ],
        "expected": false
      }
    ],
    "totalTestsCount": 16
  },
  {
    "id": "valid-parentheses",
    "slug": "valid-parentheses",
    "num": 37,
    "title": "Valid Parentheses",
    "difficulty": "Easy",
    "acceptance": "65%",
    "category": "string",
    "topics": [
      "String",
      "Stack"
    ],
    "likes": "13.5k",
    "dislikes": "440",
    "statement": "Given a string `s` containing only the characters `()[]{}`, determine if it is valid: every open bracket is closed by the same type of bracket, in the correct order.\n\nExample 1:\nInput: s = \"()\"\nOutput: true\n\nExample 2:\nInput: s = \"()[]{}\"\nOutput: true",
    "desc": "Given a string `s` containing only the characters `()[]{}`, determine if it is valid: every open bracket is closed by the same type of bracket, in the correct order.",
    "constraints": "1 <= s.length <= 10^4",
    "hint": "",
    "functionName": "isValid",
    "starterCode": {
      "python": "def isValid(s):\n    # Write your solution here\n    pass\n",
      "javascript": "function isValid(s) {\n  // Write your solution here\n}\n"
    },
    "sampleTests": [
      {
        "input": [
          "()"
        ],
        "expected": true
      },
      {
        "input": [
          "()[]{}"
        ],
        "expected": true
      },
      {
        "input": [
          "(]"
        ],
        "expected": false
      }
    ],
    "totalTestsCount": 18
  }
];
export default INDUSTRY_PROBLEMS;
