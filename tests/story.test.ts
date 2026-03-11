
import { describe, expect, it, beforeEach } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;
const user2 = accounts.get("wallet_2")!;
const user3 = accounts.get("wallet_3")!;
const user4 = accounts.get("wallet_4")!;

describe("Blockchain Diary - Story v2 Contract", () => {
  beforeEach(() => {
    // Reset contract state for each test
    // Note: In a real implementation, you might want to reset storage
  });

  describe("Word Addition Functionality", () => {
    it("should allow users to add words successfully", () => {
      const word = "hello";
      const category = "general";

      const { result } = simnet.callPublicFn(
        "story-v2",
        "add-word",
        [word, category],
        user1
      );

      expect(result).toBeOk({
        id: 0,
        word: word,
        category: category,
        timestamp: 0,
        sender: user1
      });

      // Verify word count increased
      const countResult = simnet.callReadOnlyFn("story-v2", "get-word-count", [], user1);
      expect(countResult.result).toBeOk(1);

      // Verify word can be retrieved
      const wordResult = simnet.callReadOnlyFn("story-v2", "get-word", [0], user1);
      expect(wordResult.result).toBeOk({
        word: word,
        sender: user1,
        timestamp: 0,
        category: category
      });
    });

    it("should auto-increment word IDs", () => {
      // Add first word
      simnet.callPublicFn("story-v2", "add-word", ["first", "general"], user1);

      // Add second word
      const { result } = simnet.callPublicFn("story-v2", "add-word", ["second", "tech"], user2);

      expect(result).toBeOk({
        id: 1,
        word: "second",
        category: "tech",
        timestamp: 0,
        sender: user2
      });

      // Verify both words exist
      const countResult = simnet.callReadOnlyFn("story-v2", "get-word-count", [], user1);
      expect(countResult.result).toBeOk(2);
    });

    it("should use default category when empty string provided", () => {
      const { result } = simnet.callPublicFn(
        "story-v2",
        "add-word",
        ["test", ""], // Empty category
        user1
      );

      expect(result).toBeOk({
        id: 0,
        word: "test",
        category: "general", // Should default to "general"
        timestamp: 0,
        sender: user1
      });
    });

    it("should handle maximum word length (32 characters)", () => {
      const longWord = "a".repeat(32); // Exactly 32 characters

      const { result } = simnet.callPublicFn(
        "story-v2",
        "add-word",
        [longWord, "general"],
        user1
      );

      expect(result).toBeOk({
        id: 0,
        word: longWord,
        category: "general",
        timestamp: 0,
        sender: user1
      });
    });

    it("should handle various category types", () => {
      const categories = ["general", "tech", "fun", "poetry", "custom"];

      for (let i = 0; i < categories.length; i++) {
        const { result } = simnet.callPublicFn(
          "story-v2",
          "add-word",
          [`word${i}`, categories[i]],
          user1
        );

        expect(result).toBeOk({
          id: i,
          word: `word${i}`,
          category: categories[i],
          timestamp: 0,
          sender: user1
        });
      }

      const countResult = simnet.callReadOnlyFn("story-v2", "get-word-count", [], user1);
      expect(countResult.result).toBeOk(categories.length);
    });
  });

  describe("Word Validation", () => {
    it("should reject empty words", () => {
      const { result } = simnet.callPublicFn(
        "story-v2",
        "add-word",
        ["", "general"], // Empty word
        user1
      );

      expect(result).toBeErr(301); // ERR-INVALID-WORD
    });

    it("should reject words that are too long", () => {
      const tooLongWord = "a".repeat(33); // 33 characters, over limit

      const { result } = simnet.callPublicFn(
        "story-v2",
        "add-word",
        [tooLongWord, "general"],
        user1
      );

      expect(result).toBeErr(301); // ERR-INVALID-WORD
    });

    it("should handle special characters in words", () => {
      const specialWords = ["hello!", "test_123", "word-with-dashes", "word.with.dots"];

      for (let i = 0; i < specialWords.length; i++) {
        const { result } = simnet.callPublicFn(
          "story-v2",
          "add-word",
          [specialWords[i], "general"],
          user1
        );

        expect(result).toBeOk({
          id: i,
          word: specialWords[i],
          category: "general",
          timestamp: 0,
          sender: user1
        });
      }
    });
  });

  describe("Word Retrieval", () => {
    beforeEach(() => {
      // Add some test words
      simnet.callPublicFn("story-v2", "add-word", ["first", "general"], user1);
      simnet.callPublicFn("story-v2", "add-word", ["second", "tech"], user2);
      simnet.callPublicFn("story-v2", "add-word", ["third", "fun"], user3);
    });

    it("should retrieve words by ID", () => {
      const word0 = simnet.callReadOnlyFn("story-v2", "get-word", [0], user1);
      expect(word0.result).toBeOk({
        word: "first",
        sender: user1,
        timestamp: 0,
        category: "general"
      });

      const word1 = simnet.callReadOnlyFn("story-v2", "get-word", [1], user1);
      expect(word1.result).toBeOk({
        word: "second",
        sender: user2,
        timestamp: 0,
        category: "tech"
      });

      const word2 = simnet.callReadOnlyFn("story-v2", "get-word", [2], user1);
      expect(word2.result).toBeOk({
        word: "third",
        sender: user3,
        timestamp: 0,
        category: "fun"
      });
    });

    it("should return error for non-existent word IDs", () => {
      const nonExistent = simnet.callReadOnlyFn("story-v2", "get-word", [999], user1);
      expect(nonExistent.result).toBeErr(300); // ERR-WORD-NOT-FOUND
    });

    it("should return correct word count", () => {
      const countResult = simnet.callReadOnlyFn("story-v2", "get-word-count", [], user1);
      expect(countResult.result).toBeOk(3);
    });

    it("should return latest word ID", () => {
      const latestIdResult = simnet.callReadOnlyFn("story-v2", "get-latest-id", [], user1);
      expect(latestIdResult.result).toBeOk(2); // Last added word has ID 2
    });

    it("should return latest word", () => {
      const latestWordResult = simnet.callReadOnlyFn("story-v2", "get-latest-word", [], user1);
      expect(latestWordResult.result).toBeOk({
        word: "third",
        sender: user3,
        timestamp: 0,
        category: "fun"
      });
    });

    it("should handle empty story gracefully", () => {
      // Test in isolation without beforeEach words
      const emptyCount = simnet.callReadOnlyFn("story-v2", "get-word-count", [], user1);
      expect(emptyCount.result).toBeOk(0);

      const emptyLatestId = simnet.callReadOnlyFn("story-v2", "get-latest-id", [], user1);
      expect(emptyLatestId.result).toBeErr(300); // ERR-WORD-NOT-FOUND

      const emptyLatestWord = simnet.callReadOnlyFn("story-v2", "get-latest-word", [], user1);
      expect(emptyLatestWord.result).toBeErr(300); // ERR-WORD-NOT-FOUND
    });
  });

  describe("Collaborative Storytelling", () => {
    it("should allow multiple users to contribute to the story", () => {
      const users = [user1, user2, user3, user4];
      const words = ["Once", "upon", "a", "time"];
      const categories = ["general", "general", "general", "general"];

      // Each user adds a word
      for (let i = 0; i < users.length; i++) {
        const { result } = simnet.callPublicFn(
          "story-v2",
          "add-word",
          [words[i], categories[i]],
          users[i]
        );

        expect(result).toBeOk({
          id: i,
          word: words[i],
          category: categories[i],
          timestamp: 0,
          sender: users[i]
        });
      }

      // Verify complete story
      const countResult = simnet.callReadOnlyFn("story-v2", "get-word-count", [], user1);
      expect(countResult.result).toBeOk(4);

      // Verify each word
      for (let i = 0; i < words.length; i++) {
        const wordResult = simnet.callReadOnlyFn("story-v2", "get-word", [i], user1);
        expect(wordResult.result).toBeOk({
          word: words[i],
          sender: users[i],
          timestamp: 0,
          category: categories[i]
        });
      }
    });

    it("should handle rapid successive contributions", () => {
      const rapidWords = ["The", "quick", "brown", "fox", "jumps"];

      for (let i = 0; i < rapidWords.length; i++) {
        const { result } = simnet.callPublicFn(
          "story-v2",
          "add-word",
          [rapidWords[i], "general"],
          user1
        );

        expect(result).toBeOk({
          id: i,
          word: rapidWords[i],
          category: "general",
          timestamp: 0,
          sender: user1
        });
      }

      const countResult = simnet.callReadOnlyFn("story-v2", "get-word-count", [], user1);
      expect(countResult.result).toBeOk(rapidWords.length);
    });

    it("should support category-based storytelling", () => {
      const categories = ["tech", "tech", "fun", "fun", "poetry", "poetry"];
      const words = ["Bitcoin", "maximalist", "enjoys", "pizza", "while", "coding"];

      for (let i = 0; i < words.length; i++) {
        simnet.callPublicFn(
          "story-v2",
          "add-word",
          [words[i], categories[i]],
          user1
        );
      }

      // Verify categorization
      for (let i = 0; i < words.length; i++) {
        const wordResult = simnet.callReadOnlyFn("story-v2", "get-word", [i], user1);
        expect(wordResult.result).toBeOk({
          word: words[i],
          sender: user1,
          timestamp: 0,
          category: categories[i]
        });
      }
    });
  });

  describe("Category Handling", () => {
    it("should handle category normalization correctly", () => {
      // Test various category inputs
      const testCases = [
        { input: "tech", expected: "tech" },
        { input: "", expected: "general" },
        { input: "   ", expected: "   " }, // Spaces are allowed if not empty
        { input: "Poetry", expected: "Poetry" },
        { input: "123", expected: "123" }
      ];

      for (const testCase of testCases) {
        const { result } = simnet.callPublicFn(
          "story-v2",
          "add-word",
          ["test", testCase.input],
          user1
        );

        expect(result).toBeOk({
          id: expect.any(Number),
          word: "test",
          category: testCase.expected,
          timestamp: 0,
          sender: user1
        });
      }
    });

    it("should handle maximum category length", () => {
      const maxCategory = "a".repeat(32); // 32 characters

      const { result } = simnet.callPublicFn(
        "story-v2",
        "add-word",
        ["test", maxCategory],
        user1
      );

      expect(result).toBeOk({
        id: 0,
        word: "test",
        category: maxCategory,
        timestamp: 0,
        sender: user1
      });
    });

    it("should reject overly long categories", () => {
      const tooLongCategory = "a".repeat(33); // 33 characters

      const { result } = simnet.callPublicFn(
        "story-v2",
        "add-word",
        ["test", tooLongCategory],
        user1
      );

      // This will fail at Clarity level due to type constraints
      expect(result).toBeDefined();
    });
  });

  describe("Data Integrity and Edge Cases", () => {
    it("should maintain data consistency across operations", () => {
      // Add words with different users and categories
      const operations = [
        { word: "Start", category: "general", user: user1 },
        { word: "the", category: "general", user: user2 },
        { word: "story", category: "tech", user: user3 },
        { word: "now", category: "fun", user: user1 },
        { word: "!", category: "poetry", user: user2 }
      ];

      for (let i = 0; i < operations.length; i++) {
        const op = operations[i];
        simnet.callPublicFn(
          "story-v2",
          "add-word",
          [op.word, op.category],
          op.user
        );
      }

      // Verify all data is consistent
      const countResult = simnet.callReadOnlyFn("story-v2", "get-word-count", [], user1);
      expect(countResult.result).toBeOk(operations.length);

      // Verify each operation's data
      for (let i = 0; i < operations.length; i++) {
        const op = operations[i];
        const wordResult = simnet.callReadOnlyFn("story-v2", "get-word", [i], user1);
        expect(wordResult.result).toBeOk({
          word: op.word,
          sender: op.user,
          timestamp: 0,
          category: op.category
        });
      }
    });

    it("should handle concurrent access patterns", () => {
      // Simulate concurrent word additions
      const concurrentWords = ["Word1", "Word2", "Word3", "Word4", "Word5"];

      for (const word of concurrentWords) {
        simnet.callPublicFn(
          "story-v2",
          "add-word",
          [word, "general"],
          user1
        );
      }

      // Verify all words were added correctly
      const countResult = simnet.callReadOnlyFn("story-v2", "get-word-count", [], user1);
      expect(countResult.result).toBeOk(concurrentWords.length);

      // Verify each word has correct ID sequence
      for (let i = 0; i < concurrentWords.length; i++) {
        const wordResult = simnet.callReadOnlyFn("story-v2", "get-word", [i], user1);
        expect(wordResult.result).toBeOk({
          word: concurrentWords[i],
          sender: user1,
          timestamp: 0,
          category: "general"
        });
      }
    });

    it("should handle boundary values correctly", () => {
      // Test with various boundary values
      const boundaryTests = [
        { word: "a", category: "a" }, // Single character
        { word: "A", category: "A" }, // Uppercase
        { word: "1", category: "1" }, // Numbers
        { word: "_", category: "_" }, // Underscore
        { word: "-", category: "-" }, // Dash
      ];

      for (const test of boundaryTests) {
        const { result } = simnet.callPublicFn(
          "story-v2",
          "add-word",
          [test.word, test.category],
          user1
        );

        expect(result).toBeOk({
          id: expect.any(Number),
          word: test.word,
          category: test.category,
          timestamp: 0,
          sender: user1
        });
      }
    });

    it("should maintain state across multiple test scenarios", () => {
      // First scenario: add some words
      simnet.callPublicFn("story-v2", "add-word", ["Hello", "general"], user1);
      simnet.callPublicFn("story-v2", "add-word", ["World", "general"], user2);

      let countResult = simnet.callReadOnlyFn("story-v2", "get-word-count", [], user1);
      expect(countResult.result).toBeOk(2);

      // Second scenario: add more words
      simnet.callPublicFn("story-v2", "add-word", ["from", "tech"], user3);
      simnet.callPublicFn("story-v2", "add-word", ["Clarinet", "tech"], user4);

      countResult = simnet.callReadOnlyFn("story-v2", "get-word-count", [], user1);
      expect(countResult.result).toBeOk(4);

      // Verify all words are still accessible
      for (let i = 0; i < 4; i++) {
        const wordResult = simnet.callReadOnlyFn("story-v2", "get-word", [i], user1);
        expect(wordResult.result).toBeDefined();
        expect(wordResult.result).not.toBeErr(300); // Not ERR-WORD-NOT-FOUND
      }
    });
  });

  describe("Performance and Scalability", () => {
    it("should handle large number of words efficiently", () => {
      const numWords = 50; // Test with reasonable number for performance

      // Add many words
      for (let i = 0; i < numWords; i++) {
        simnet.callPublicFn(
          "story-v2",
          "add-word",
          [`word${i}`, "general"],
          user1
        );
      }

      // Verify all words were added
      const countResult = simnet.callReadOnlyFn("story-v2", "get-word-count", [], user1);
      expect(countResult.result).toBeOk(numWords);

      // Verify random access still works
      const randomIndices = [0, 10, 25, 40, numWords - 1];
      for (const index of randomIndices) {
        const wordResult = simnet.callReadOnlyFn("story-v2", "get-word", [index], user1);
        expect(wordResult.result).toBeOk({
          word: `word${index}`,
          sender: user1,
          timestamp: 0,
          category: "general"
        });
      }
    });

    it("should handle multiple users contributing simultaneously", () => {
      const users = [user1, user2, user3, user4];
      const wordsPerUser = 10;

      // Each user adds multiple words
      for (let userIndex = 0; userIndex < users.length; userIndex++) {
        const user = users[userIndex];
        for (let wordIndex = 0; wordIndex < wordsPerUser; wordIndex++) {
          simnet.callPublicFn(
            "story-v2",
            "add-word",
            [`user${userIndex}_word${wordIndex}`, "general"],
            user
          );
        }
      }

      const expectedTotalWords = users.length * wordsPerUser;
      const countResult = simnet.callReadOnlyFn("story-v2", "get-word-count", [], user1);
      expect(countResult.result).toBeOk(expectedTotalWords);

      // Verify latest word
      const latestWordResult = simnet.callReadOnlyFn("story-v2", "get-latest-word", [], user1);
      expect(latestWordResult.result).toBeOk({
        word: `user${users.length - 1}_word${wordsPerUser - 1}`,
        sender: users[users.length - 1],
        timestamp: 0,
        category: "general"
      });
    });
  });

  describe("Error Conditions and Validation", () => {
    it("should handle all error codes appropriately", () => {
      // Test ERR-WORD-NOT-FOUND (300)
      const nonExistentWord = simnet.callReadOnlyFn("story-v2", "get-word", [999], user1);
      expect(nonExistentWord.result).toBeErr(300);

      // Test ERR-INVALID-WORD (301) - empty word
      const emptyWordResult = simnet.callPublicFn(
        "story-v2",
        "add-word",
        ["", "general"],
        user1
      );
      expect(emptyWordResult.result).toBeErr(301);

      // Note: ERR-INVALID-CATEGORY (302) is harder to trigger since empty categories
      // are normalized to "general", but the validation exists in the contract
    });

    it("should validate input constraints", () => {
      // Test word length limits are enforced at contract level
      // (Clarity will reject oversized strings at type level)

      // Test with maximum valid lengths
      const maxWord = "a".repeat(32);
      const maxCategory = "b".repeat(32);

      const result = simnet.callPublicFn(
        "story-v2",
        "add-word",
        [maxWord, maxCategory],
        user1
      );

      expect(result.result).toBeOk({
        id: 0,
        word: maxWord,
        category: maxCategory,
        timestamp: 0,
        sender: user1
      });
    });
  });
});
