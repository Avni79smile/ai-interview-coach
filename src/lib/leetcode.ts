import type { Assessment, TestCase } from "./course-types";

export type ParamType = "int" | "double" | "bool" | "string" | "int[]" | "int[][]" | "char[][]";
export type Signature = { params: { name: string; type: ParamType }[]; returns: ParamType };
export type Compare = "exact" | "sorted" | "float";

type P = {
  slug: string; id: number; title: string; difficulty: "Easy" | "Medium" | "Hard"; tags: string[];
  fn: string; sig: Signature; compare?: Compare; description: string; constraints: string[]; tests: TestCase[];
};

const p = (name: string, type: ParamType) => ({ name, type });
const g1 = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]];
const g2 = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]];

export const PROBLEMS: P[] = [
  { slug: "two-sum", id: 1, title: "Two Sum", difficulty: "Easy", tags: ["array", "hash table"], fn: "twoSum", sig: { params: [p("nums", "int[]"), p("target", "int")], returns: "int[]" }, compare: "sorted",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
    constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "Only one valid answer exists."],
    tests: [{ input: [[2,7,11,15],9], expected: [0,1] }, { input: [[3,2,4],6], expected: [1,2] }, { input: [[3,3],6], expected: [0,1] }, { input: [[1,5,8,10],18], expected: [2,3] }, { input: [[-3,4,3,90],0], expected: [0,2] }] },
  { slug: "valid-parentheses", id: 20, title: "Valid Parentheses", difficulty: "Easy", tags: ["string", "stack"], fn: "isValid", sig: { params: [p("s", "string")], returns: "bool" },
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if open brackets are closed by the same type of brackets, in the correct order, and every close bracket has a corresponding open bracket.",
    constraints: ["1 <= s.length <= 10^4", "s consists of parentheses only '()[]{}'."],
    tests: [{ input: ["()"], expected: true }, { input: ["()[]{}"], expected: true }, { input: ["(]"], expected: false }, { input: ["([)]"], expected: false }, { input: ["{[]}"], expected: true }] },
  { slug: "best-time-to-buy-and-sell-stock", id: 121, title: "Best Time to Buy and Sell Stock", difficulty: "Easy", tags: ["array", "greedy"], fn: "maxProfit", sig: { params: [p("prices", "int[]")], returns: "int" },
    description: "You are given an array prices where prices[i] is the price of a given stock on the ith day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve. If you cannot achieve any profit, return 0.",
    constraints: ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
    tests: [{ input: [[7,1,5,3,6,4]], expected: 5 }, { input: [[7,6,4,3,1]], expected: 0 }, { input: [[2,4,1]], expected: 2 }, { input: [[1,2]], expected: 1 }, { input: [[3,2,6,5,0,3]], expected: 4 }] },
  { slug: "contains-duplicate", id: 217, title: "Contains Duplicate", difficulty: "Easy", tags: ["array", "hash table"], fn: "containsDuplicate", sig: { params: [p("nums", "int[]")], returns: "bool" },
    description: "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
    constraints: ["1 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
    tests: [{ input: [[1,2,3,1]], expected: true }, { input: [[1,2,3,4]], expected: false }, { input: [[1,1,1,3,3,4,3,2,4,2]], expected: true }, { input: [[0]], expected: false }, { input: [[-1,-2,-3,-1]], expected: true }] },
  { slug: "valid-anagram", id: 242, title: "Valid Anagram", difficulty: "Easy", tags: ["string", "hash table", "sorting"], fn: "isAnagram", sig: { params: [p("s", "string"), p("t", "string")], returns: "bool" },
    description: "Given two strings s and t, return true if t is an anagram of s, and false otherwise.",
    constraints: ["1 <= s.length, t.length <= 5 * 10^4", "s and t consist of lowercase English letters."],
    tests: [{ input: ["anagram","nagaram"], expected: true }, { input: ["rat","car"], expected: false }, { input: ["a","ab"], expected: false }, { input: ["listen","silent"], expected: true }, { input: ["aacc","ccac"], expected: false }] },
  { slug: "climbing-stairs", id: 70, title: "Climbing Stairs", difficulty: "Easy", tags: ["dynamic programming", "math", "recursion"], fn: "climbStairs", sig: { params: [p("n", "int")], returns: "int" },
    description: "You are climbing a staircase. It takes n steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    constraints: ["1 <= n <= 45"],
    tests: [{ input: [2], expected: 2 }, { input: [3], expected: 3 }, { input: [5], expected: 8 }, { input: [1], expected: 1 }, { input: [10], expected: 89 }] },
  { slug: "binary-search", id: 704, title: "Binary Search", difficulty: "Easy", tags: ["array", "binary search"], fn: "search", sig: { params: [p("nums", "int[]"), p("target", "int")], returns: "int" },
    description: "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.",
    constraints: ["1 <= nums.length <= 10^4", "All the integers in nums are unique.", "nums is sorted in ascending order."],
    tests: [{ input: [[-1,0,3,5,9,12],9], expected: 4 }, { input: [[-1,0,3,5,9,12],2], expected: -1 }, { input: [[5],5], expected: 0 }, { input: [[1,3],3], expected: 1 }, { input: [[2,4,6,8],1], expected: -1 }] },
  { slug: "missing-number", id: 268, title: "Missing Number", difficulty: "Easy", tags: ["array", "math", "bit manipulation"], fn: "missingNumber", sig: { params: [p("nums", "int[]")], returns: "int" },
    description: "Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array.",
    constraints: ["n == nums.length", "1 <= n <= 10^4", "All the numbers of nums are unique."],
    tests: [{ input: [[3,0,1]], expected: 2 }, { input: [[0,1]], expected: 2 }, { input: [[9,6,4,2,3,5,7,0,1]], expected: 8 }, { input: [[0]], expected: 1 }, { input: [[1]], expected: 0 }] },
  { slug: "maximum-subarray", id: 53, title: "Maximum Subarray", difficulty: "Medium", tags: ["array", "dynamic programming", "divide and conquer"], fn: "maxSubArray", sig: { params: [p("nums", "int[]")], returns: "int" },
    description: "Given an integer array nums, find the subarray with the largest sum, and return its sum.",
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    tests: [{ input: [[-2,1,-3,4,-1,2,1,-5,4]], expected: 6 }, { input: [[1]], expected: 1 }, { input: [[5,4,-1,7,8]], expected: 23 }, { input: [[-3,-1,-2]], expected: -1 }, { input: [[2,-1,2]], expected: 3 }] },
  { slug: "longest-substring-without-repeating-characters", id: 3, title: "Longest Substring Without Repeating Characters", difficulty: "Medium", tags: ["string", "sliding window", "hash table"], fn: "lengthOfLongestSubstring", sig: { params: [p("s", "string")], returns: "int" },
    description: "Given a string s, find the length of the longest substring without repeating characters.",
    constraints: ["0 <= s.length <= 5 * 10^4", "s consists of English letters, digits, symbols and spaces."],
    tests: [{ input: ["abcabcbb"], expected: 3 }, { input: ["bbbbb"], expected: 1 }, { input: ["pwwkew"], expected: 3 }, { input: [""], expected: 0 }, { input: ["dvdf"], expected: 3 }] },
  { slug: "product-of-array-except-self", id: 238, title: "Product of Array Except Self", difficulty: "Medium", tags: ["array", "prefix sum"], fn: "productExceptSelf", sig: { params: [p("nums", "int[]")], returns: "int[]" },
    description: "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].\n\nYou must write an algorithm that runs in O(n) time and without using the division operation.",
    constraints: ["2 <= nums.length <= 10^5", "-30 <= nums[i] <= 30"],
    tests: [{ input: [[1,2,3,4]], expected: [24,12,8,6] }, { input: [[-1,1,0,-3,3]], expected: [0,0,9,0,0] }, { input: [[2,3]], expected: [3,2] }, { input: [[1,1,1]], expected: [1,1,1] }, { input: [[5,2,0]], expected: [0,0,10] }] },
  { slug: "merge-intervals", id: 56, title: "Merge Intervals", difficulty: "Medium", tags: ["array", "sorting"], fn: "merge", sig: { params: [p("intervals", "int[][]")], returns: "int[][]" },
    description: "Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input (sorted by start).",
    constraints: ["1 <= intervals.length <= 10^4", "intervals[i].length == 2", "0 <= start_i <= end_i <= 10^4"],
    tests: [{ input: [[[1,3],[2,6],[8,10],[15,18]]], expected: [[1,6],[8,10],[15,18]] }, { input: [[[1,4],[4,5]]], expected: [[1,5]] }, { input: [[[1,4],[0,4]]], expected: [[0,4]] }, { input: [[[1,4],[2,3]]], expected: [[1,4]] }, { input: [[[5,6]]], expected: [[5,6]] }] },
  { slug: "coin-change", id: 322, title: "Coin Change", difficulty: "Medium", tags: ["dynamic programming", "array", "bfs"], fn: "coinChange", sig: { params: [p("coins", "int[]"), p("amount", "int")], returns: "int" },
    description: "You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1. You have an infinite number of each kind of coin.",
    constraints: ["1 <= coins.length <= 12", "1 <= coins[i] <= 2^31 - 1", "0 <= amount <= 10^4"],
    tests: [{ input: [[1,2,5],11], expected: 3 }, { input: [[2],3], expected: -1 }, { input: [[1],0], expected: 0 }, { input: [[1,3,4],6], expected: 2 }, { input: [[186,419,83,408],6249], expected: 20 }] },
  { slug: "house-robber", id: 198, title: "House Robber", difficulty: "Medium", tags: ["dynamic programming", "array"], fn: "rob", sig: { params: [p("nums", "int[]")], returns: "int" },
    description: "You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed; adjacent houses have security systems connected and it will automatically contact the police if two adjacent houses were broken into on the same night.\n\nGiven an integer array nums representing the amount of money of each house, return the maximum amount of money you can rob tonight without alerting the police.",
    constraints: ["1 <= nums.length <= 100", "0 <= nums[i] <= 400"],
    tests: [{ input: [[1,2,3,1]], expected: 4 }, { input: [[2,7,9,3,1]], expected: 12 }, { input: [[2,1,1,2]], expected: 4 }, { input: [[5]], expected: 5 }, { input: [[1,3,1]], expected: 3 }] },
  { slug: "number-of-islands", id: 200, title: "Number of Islands", difficulty: "Medium", tags: ["graph", "bfs", "dfs", "matrix"], fn: "numIslands", sig: { params: [p("grid", "char[][]")], returns: "int" },
    description: "Given an m x n 2D binary grid which represents a map of '1's (land) and '0's (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.",
    constraints: ["1 <= m, n <= 300", "grid[i][j] is '0' or '1'."],
    tests: [{ input: [g1], expected: 1 }, { input: [g2], expected: 3 }, { input: [[["1"]]], expected: 1 }, { input: [[["0"]]], expected: 0 }, { input: [[["1","0","1"]]], expected: 2 }] },
  { slug: "trapping-rain-water", id: 42, title: "Trapping Rain Water", difficulty: "Hard", tags: ["array", "two pointers", "stack", "dynamic programming"], fn: "trap", sig: { params: [p("height", "int[]")], returns: "int" },
    description: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    constraints: ["1 <= n <= 2 * 10^4", "0 <= height[i] <= 10^5"],
    tests: [{ input: [[0,1,0,2,1,0,1,3,2,1,2,1]], expected: 6 }, { input: [[4,2,0,3,2,5]], expected: 9 }, { input: [[1,2,3]], expected: 0 }, { input: [[3,0,3]], expected: 3 }, { input: [[5,4,1,2]], expected: 1 }] },
  { slug: "median-of-two-sorted-arrays", id: 4, title: "Median of Two Sorted Arrays", difficulty: "Hard", tags: ["array", "binary search", "divide and conquer"], fn: "findMedianSortedArrays", sig: { params: [p("nums1", "int[]"), p("nums2", "int[]")], returns: "double" }, compare: "float",
    description: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.\n\nThe overall run time complexity should be O(log (m+n)).",
    constraints: ["0 <= m, n <= 1000", "1 <= m + n <= 2000"],
    tests: [{ input: [[1,3],[2]], expected: 2 }, { input: [[1,2],[3,4]], expected: 2.5 }, { input: [[],[1]], expected: 1 }, { input: [[0,0],[0,0]], expected: 0 }, { input: [[2],[]], expected: 2 }] },
  { slug: "edit-distance", id: 72, title: "Edit Distance", difficulty: "Hard", tags: ["string", "dynamic programming"], fn: "minDistance", sig: { params: [p("word1", "string"), p("word2", "string")], returns: "int" },
    description: "Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2.\n\nYou have the following three operations permitted on a word: insert a character, delete a character, replace a character.",
    constraints: ["0 <= word1.length, word2.length <= 500", "Lowercase English letters only."],
    tests: [{ input: ["horse","ros"], expected: 3 }, { input: ["intention","execution"], expected: 5 }, { input: ["","a"], expected: 1 }, { input: ["abc","abc"], expected: 0 }, { input: ["kitten","sitting"], expected: 3 }] },
  { slug: "longest-valid-parentheses", id: 32, title: "Longest Valid Parentheses", difficulty: "Hard", tags: ["string", "stack", "dynamic programming"], fn: "longestValidParentheses", sig: { params: [p("s", "string")], returns: "int" },
    description: "Given a string containing just the characters '(' and ')', return the length of the longest valid (well-formed) parentheses substring.",
    constraints: ["0 <= s.length <= 3 * 10^4", "s[i] is '(' or ')'."],
    tests: [{ input: ["(()"], expected: 2 }, { input: [")()())"], expected: 4 }, { input: [""], expected: 0 }, { input: ["()(()"], expected: 2 }, { input: ["()(())"], expected: 6 }] },
  { slug: "first-missing-positive", id: 41, title: "First Missing Positive", difficulty: "Hard", tags: ["array", "hash table"], fn: "firstMissingPositive", sig: { params: [p("nums", "int[]")], returns: "int" },
    description: "Given an unsorted integer array nums, return the smallest positive integer that is not present in nums.\n\nYou must implement an algorithm that runs in O(n) time and uses O(1) auxiliary space.",
    constraints: ["1 <= nums.length <= 10^5", "-2^31 <= nums[i] <= 2^31 - 1"],
    tests: [{ input: [[1,2,0]], expected: 3 }, { input: [[3,4,-1,1]], expected: 2 }, { input: [[7,8,9,11,12]], expected: 1 }, { input: [[1]], expected: 2 }, { input: [[2,1]], expected: 3 }] },
];

export function problemCatalogText() {
  return PROBLEMS.map((x) => `${x.slug} (${x.difficulty}; ${x.tags.join(", ")})`).join("\n");
}

function toAssessment(x: P): Assessment {
  const ex = x.tests.slice(0, 2).map((t, i) =>
    `Example ${i + 1}:\nInput: ${x.sig.params.map((pp, j) => `${pp.name} = ${JSON.stringify(t.input[j])}`).join(", ")}\nOutput: ${JSON.stringify(t.expected)}`);
  return {
    title: `${x.id}. ${x.title}`, difficulty: x.difficulty, functionName: x.fn,
    description: `${x.description}\n\nConstraints:\n${x.constraints.map((c) => `• ${c}`).join("\n")}`,
    starterCode: starterCode("javascript", x.fn, x.sig), examples: ex, tests: x.tests,
    slug: x.slug, signature: x.sig, compare: x.compare ?? "exact", url: `https://leetcode.com/problems/${x.slug}/`,
  };
}

/** Pick one Easy, one Medium, one Hard — preferring AI-suggested slugs. */
export function pickProblems(suggested: unknown): Assessment[] {
  const wanted = Array.isArray(suggested) ? suggested.map(String) : [];
  return (["Easy", "Medium", "Hard"] as const).map((d) => {
    const pool = PROBLEMS.filter((x) => x.difficulty === d);
    return toAssessment(pool.find((x) => wanted.includes(x.slug)) ?? pool[Math.floor(Math.random() * pool.length)]!);
  });
}

export const LANGUAGES = [
  { id: "javascript", label: "JavaScript", file: "solution.js", local: true },
  { id: "python", label: "Python 3", file: "solution.py", local: true },
  { id: "typescript", label: "TypeScript", file: "solution.ts", local: false },
  { id: "java", label: "Java", file: "Solution.java", local: false },
  { id: "cpp", label: "C++", file: "solution.cpp", local: false },
  { id: "csharp", label: "C#", file: "Solution.cs", local: false },
  { id: "go", label: "Go", file: "solution.go", local: false },
  { id: "rust", label: "Rust", file: "solution.rs", local: false },
] as const;
export type LangId = (typeof LANGUAGES)[number]["id"];

const T: Record<ParamType, Record<Exclude<LangId, "javascript">, string> & { js: string }> = {
  int: { js: "number", typescript: "number", python: "int", java: "int", cpp: "int", csharp: "int", go: "int", rust: "i32" },
  double: { js: "number", typescript: "number", python: "float", java: "double", cpp: "double", csharp: "double", go: "float64", rust: "f64" },
  bool: { js: "boolean", typescript: "boolean", python: "bool", java: "boolean", cpp: "bool", csharp: "bool", go: "bool", rust: "bool" },
  string: { js: "string", typescript: "string", python: "str", java: "String", cpp: "string", csharp: "string", go: "string", rust: "String" },
  "int[]": { js: "number[]", typescript: "number[]", python: "List[int]", java: "int[]", cpp: "vector<int>", csharp: "int[]", go: "[]int", rust: "Vec<i32>" },
  "int[][]": { js: "number[][]", typescript: "number[][]", python: "List[List[int]]", java: "int[][]", cpp: "vector<vector<int>>", csharp: "int[][]", go: "[][]int", rust: "Vec<Vec<i32>>" },
  "char[][]": { js: "character[][]", typescript: "string[][]", python: "List[List[str]]", java: "char[][]", cpp: "vector<vector<char>>", csharp: "char[][]", go: "[][]byte", rust: "Vec<Vec<char>>" },
};
const snake = (s: string) => s.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());

export function starterCode(lang: LangId, fn: string, sig?: Signature, legacy?: string): string {
  if (!sig) {
    if (lang === "javascript") return legacy ?? `function ${fn}() {\n  \n}`;
    if (lang === "python") return `def ${fn}(*args):\n    pass`;
    return `// Write a function named ${fn} in this language.\n`;
  }
  const ps = sig.params;
  const r = sig.returns;
  switch (lang) {
    case "javascript":
      return `/**\n${ps.map((x) => ` * @param {${T[x.type].js}} ${x.name}`).join("\n")}\n * @return {${T[r].js}}\n */\nvar ${fn} = function(${ps.map((x) => x.name).join(", ")}) {\n    \n};`;
    case "typescript":
      return `function ${fn}(${ps.map((x) => `${x.name}: ${T[x.type].typescript}`).join(", ")}): ${T[r].typescript} {\n    \n};`;
    case "python":
      return `class Solution:\n    def ${fn}(self, ${ps.map((x) => `${x.name}: ${T[x.type].python}`).join(", ")}) -> ${T[r].python}:\n        `;
    case "java":
      return `class Solution {\n    public ${T[r].java} ${fn}(${ps.map((x) => `${T[x.type].java} ${x.name}`).join(", ")}) {\n        \n    }\n}`;
    case "cpp":
      return `class Solution {\npublic:\n    ${T[r].cpp} ${fn}(${ps.map((x) => `${T[x.type].cpp}${x.type.includes("[") ? "&" : ""} ${x.name}`).join(", ")}) {\n        \n    }\n};`;
    case "csharp":
      return `public class Solution {\n    public ${T[r].csharp} ${fn[0]!.toUpperCase() + fn.slice(1)}(${ps.map((x) => `${T[x.type].csharp} ${x.name}`).join(", ")}) {\n        \n    }\n}`;
    case "go":
      return `func ${fn}(${ps.map((x) => `${x.name} ${T[x.type].go}`).join(", ")}) ${T[r].go} {\n    \n}`;
    case "rust":
      return `impl Solution {\n    pub fn ${snake(fn)}(${ps.map((x) => `${snake(x.name)}: ${T[x.type].rust}`).join(", ")}) -> ${T[r].rust} {\n        \n    }\n}`;
  }
}
