export interface Problem {
  id: number
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  description: string
  examples: { input: string; output: string; explanation?: string }[]
  constraints: string[]
  starterCode: { python: string; javascript: string }
  testCases: { input: any; expected: any }[]
  hints: string[]
  link: string
  tags: string[]
  acceptance?: string
}

export const PROBLEMS: Problem[] = [
  {
    id: 1,
    title: 'Two Sum',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table'],
    link: 'https://leetcode.com/problems/two-sum/',
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
      { input: 'nums = [3,3], target = 6', output: '[0,1]' },
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    starterCode: {
      python: `def twoSum(nums, target):
    # Your code here
    pass`,
      javascript: `function twoSum(nums, target) {
    // Your code here
    
}`,
    },
    testCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
      { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2] },
      { input: { nums: [3, 3], target: 6 }, expected: [0, 1] },
    ],
    hints: [
      'A brute force approach would be O(n²). Can you do better?',
      'Think about using a hash map to store values you\'ve seen.',
      'For each number, check if (target - number) exists in your map.',
    ],
    acceptance: '49.1%',
  },
  {
    id: 121,
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'Easy',
    tags: ['Array', 'Dynamic Programming'],
    link: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
    description: `You are given an array prices where prices[i] is the price of a given stock on the ith day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.`,
    examples: [
      { input: 'prices = [7,1,5,3,6,4]', output: '5', explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.' },
      { input: 'prices = [7,6,4,3,1]', output: '0', explanation: 'No transactions are done, max profit = 0.' },
    ],
    constraints: [
      '1 <= prices.length <= 10^5',
      '0 <= prices[i] <= 10^4',
    ],
    starterCode: {
      python: `def maxProfit(prices):
    # Your code here
    pass`,
      javascript: `function maxProfit(prices) {
    // Your code here
    
}`,
    },
    testCases: [
      { input: { prices: [7, 1, 5, 3, 6, 4] }, expected: 5 },
      { input: { prices: [7, 6, 4, 3, 1] }, expected: 0 },
      { input: { prices: [2, 4, 1] }, expected: 2 },
    ],
    hints: [
      'Think about tracking the minimum price seen so far.',
      'At each step, calculate the potential profit if you sold today.',
      'This is a one-pass problem with O(n) time complexity.',
    ],
    acceptance: '54.1%',
  },
  {
    id: 20,
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    tags: ['String', 'Stack'],
    link: 'https://leetcode.com/problems/valid-parentheses/',
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
    ],
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only \'()[]{}\'.',
    ],
    starterCode: {
      python: `def isValid(s):
    # Your code here
    pass`,
      javascript: `function isValid(s) {
    // Your code here
    
}`,
    },
    testCases: [
      { input: { s: '()' }, expected: true },
      { input: { s: '()[]{}' }, expected: true },
      { input: { s: '(]' }, expected: false },
      { input: { s: '([)]' }, expected: false },
      { input: { s: '{[]}' }, expected: true },
    ],
    hints: [
      'Use a stack data structure.',
      'Push opening brackets onto the stack.',
      'When you see a closing bracket, check if it matches the top of the stack.',
    ],
    acceptance: '40.5%',
  },
  {
    id: 217,
    title: 'Contains Duplicate',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table', 'Sorting'],
    link: 'https://leetcode.com/problems/contains-duplicate/',
    description: `Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.`,
    examples: [
      { input: 'nums = [1,2,3,1]', output: 'true' },
      { input: 'nums = [1,2,3,4]', output: 'false' },
      { input: 'nums = [1,1,1,3,3,4,3,2,4,2]', output: 'true' },
    ],
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^9 <= nums[i] <= 10^9',
    ],
    starterCode: {
      python: `def containsDuplicate(nums):
    # Your code here
    pass`,
      javascript: `function containsDuplicate(nums) {
    // Your code here
    
}`,
    },
    testCases: [
      { input: { nums: [1, 2, 3, 1] }, expected: true },
      { input: { nums: [1, 2, 3, 4] }, expected: false },
      { input: { nums: [1, 1, 1, 3, 3, 4, 3, 2, 4, 2] }, expected: true },
    ],
    hints: [
      'Think about what data structure allows O(1) lookup.',
      'A Set can help detect duplicates efficiently.',
      'Compare the length of the array with the size of a Set created from it.',
    ],
    acceptance: '61.0%',
  },
  {
    id: 242,
    title: 'Valid Anagram',
    difficulty: 'Easy',
    tags: ['Hash Table', 'String', 'Sorting'],
    link: 'https://leetcode.com/problems/valid-anagram/',
    description: `Given two strings s and t, return true if t is an anagram of s, and false otherwise.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: 'true' },
      { input: 's = "rat", t = "car"', output: 'false' },
    ],
    constraints: [
      '1 <= s.length, t.length <= 5 * 10^4',
      's and t consist of lowercase English letters.',
    ],
    starterCode: {
      python: `def isAnagram(s, t):
    # Your code here
    pass`,
      javascript: `function isAnagram(s, t) {
    // Your code here
    
}`,
    },
    testCases: [
      { input: { s: 'anagram', t: 'nagaram' }, expected: true },
      { input: { s: 'rat', t: 'car' }, expected: false },
      { input: { s: 'a', t: 'a' }, expected: true },
    ],
    hints: [
      'If lengths differ, they cannot be anagrams.',
      'Count the frequency of each character in both strings.',
      'Sorting both strings and comparing is another approach.',
    ],
    acceptance: '62.7%',
  },
  {
    id: 3,
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    tags: ['Hash Table', 'String', 'Sliding Window'],
    link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
    description: `Given a string s, find the length of the longest substring without repeating characters.`,
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with the length of 1.' },
      { input: 's = "pwwkew"', output: '3', explanation: 'The answer is "wke", with the length of 3.' },
    ],
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.',
    ],
    starterCode: {
      python: `def lengthOfLongestSubstring(s):
    # Your code here
    pass`,
      javascript: `function lengthOfLongestSubstring(s) {
    // Your code here
    
}`,
    },
    testCases: [
      { input: { s: 'abcabcbb' }, expected: 3 },
      { input: { s: 'bbbbb' }, expected: 1 },
      { input: { s: 'pwwkew' }, expected: 3 },
      { input: { s: '' }, expected: 0 },
    ],
    hints: [
      'Use the sliding window technique.',
      'Track characters in your current window with a Set or Map.',
      'When you find a duplicate, shrink the window from the left.',
    ],
    acceptance: '33.8%',
  },
]

export const getProblemById = (id: number): Problem | undefined => {
  return PROBLEMS.find(p => p.id === id)
}

export const getRandomProblem = (difficulty?: 'Easy' | 'Medium' | 'Hard'): Problem => {
  const filtered = difficulty ? PROBLEMS.filter(p => p.difficulty === difficulty) : PROBLEMS
  return filtered[Math.floor(Math.random() * filtered.length)]
}

