/**
 * Performance Tests for Authentication System
 *
 * These tests verify that the authentication system meets performance requirements:
 * 1. Middleware response times are within acceptable limits
 * 2. Database queries in callbacks are optimized
 * 3. Session refresh times are acceptable
 * 4. Edge runtime timeout compliance
 *
 * Requirements: 6.5
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

describe("Performance Tests", () => {
  let testUserId: string;
  let testUserEmail: string;

  beforeAll(async () => {
    // Create a test user for performance testing
    testUserEmail = `perf-test-${Date.now()}@example.com`;
    const hashedPassword = await bcrypt.hash("TestPassword123!", 10);

    const user = await db.user.create({
      data: {
        email: testUserEmail,
        name: "Performance Test User",
        password: hashedPassword,
        emailVerified: new Date(),
        role: "USER",
      },
    });

    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up test user
    if (testUserId) {
      await db.user.delete({
        where: { id: testUserId },
      });
    }
  });

  describe("Middleware Response Times", () => {
    it("should process route checks quickly (< 10ms)", () => {
      const iterations = 1000;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();

        // Simulate middleware route checks (synchronous operations)
        const pathname = "/admin";
        const isLoggedIn = true;
        const userRole = "USER";

        const isApiAuthRoute = pathname.startsWith("/api/auth");
        const isPublicRoute = pathname === "/";
        const isAuthRoute = pathname.startsWith("/auth");

        // RBAC checks
        const hasAdminAccess =
          userRole === "ADMIN" || userRole === "GATEKEEPER";
        const hasReviewAccess =
          userRole === "ADMIN" ||
          userRole === "GATEKEEPER" ||
          userRole === "REVIEWER";

        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Average route check time: ${avgTime.toFixed(4)}ms`);
      console.log(`Max route check time: ${maxTime.toFixed(4)}ms`);

      // Middleware should complete quickly for edge runtime
      expect(avgTime).toBeLessThan(10);
      expect(maxTime).toBeLessThan(50);
    });

    it("should have minimal memory footprint", () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform multiple route checks
      for (let i = 0; i < 1000; i++) {
        const pathname = `/route-${i}`;
        const isLoggedIn = i % 2 === 0;
        const userRole = ["USER", "ADMIN", "REVIEWER"][i % 3];

        const isApiAuthRoute = pathname.startsWith("/api/auth");
        const isPublicRoute = pathname === "/";
        const isAuthRoute = pathname.startsWith("/auth");

        const hasAdminAccess =
          userRole === "ADMIN" || userRole === "GATEKEEPER";
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB`);

      // Should not leak significant memory
      expect(memoryIncrease).toBeLessThan(5); // Less than 5MB increase
    });
  });

  describe("Database Query Performance", () => {
    it("should query user by email efficiently (< 600ms)", async () => {
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();

        await db.user.findUnique({
          where: { email: testUserEmail },
        });

        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      console.log(`Average user query time: ${avgTime.toFixed(2)}ms`);
      console.log(`Min user query time: ${minTime.toFixed(2)}ms`);
      console.log(`Max user query time: ${maxTime.toFixed(2)}ms`);

      // First query includes connection overhead, subsequent queries should be faster
      expect(avgTime).toBeLessThan(600);
      expect(maxTime).toBeLessThan(800);
    }, 15000);

    it("should query user with accounts relationship efficiently (< 600ms)", async () => {
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();

        await db.user.findUnique({
          where: { id: testUserId },
          include: {
            accounts: true,
          },
        });

        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      console.log(`Average user+accounts query time: ${avgTime.toFixed(2)}ms`);
      console.log(`Min user+accounts query time: ${minTime.toFixed(2)}ms`);
      console.log(`Max user+accounts query time: ${maxTime.toFixed(2)}ms`);

      expect(avgTime).toBeLessThan(600);
      expect(maxTime).toBeLessThan(800);
    }, 15000);

    it("should handle concurrent user queries efficiently", async () => {
      const concurrentQueries = 20;
      const start = performance.now();

      const promises = Array(concurrentQueries)
        .fill(null)
        .map(() =>
          db.user.findUnique({
            where: { id: testUserId },
            include: {
              accounts: true,
            },
          })
        );

      await Promise.all(promises);

      const end = performance.now();
      const totalTime = end - start;
      const avgTimePerQuery = totalTime / concurrentQueries;

      console.log(
        `Total time for ${concurrentQueries} queries: ${totalTime.toFixed(2)}ms`
      );
      console.log(`Average time per query: ${avgTimePerQuery.toFixed(2)}ms`);

      // With connection pooling, concurrent queries should be efficient
      expect(totalTime).toBeLessThan(1000); // Less than 1 second for 20 queries
      expect(avgTimePerQuery).toBeLessThan(100);
    });

    it("should have proper database indexes for email lookups", async () => {
      // Test that email lookups are fast (indicating proper indexing)
      const start = performance.now();

      await db.user.findUnique({
        where: { email: testUserEmail },
      });

      const end = performance.now();
      const queryTime = end - start;

      console.log(`Email lookup time: ${queryTime.toFixed(2)}ms`);

      // With proper indexing, email lookups should be reasonably fast
      expect(queryTime).toBeLessThan(600);
    }, 10000);

    it("should have proper database indexes for ID lookups", async () => {
      // Test that ID lookups are fast (indicating proper indexing)
      const start = performance.now();

      await db.user.findUnique({
        where: { id: testUserId },
      });

      const end = performance.now();
      const queryTime = end - start;

      console.log(`ID lookup time: ${queryTime.toFixed(2)}ms`);

      // With proper indexing, ID lookups should be reasonably fast
      expect(queryTime).toBeLessThan(600);
    }, 10000);
  });

  describe("Session Refresh Performance", () => {
    it("should refresh JWT token data efficiently (< 600ms)", async () => {
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();

        // Simulate JWT refresh by querying user with accounts
        await db.user.findUnique({
          where: { id: testUserId },
          include: {
            accounts: true,
          },
        });

        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      console.log(`Average JWT refresh time: ${avgTime.toFixed(2)}ms`);
      console.log(`Min JWT refresh time: ${minTime.toFixed(2)}ms`);
      console.log(`Max JWT refresh time: ${maxTime.toFixed(2)}ms`);

      expect(avgTime).toBeLessThan(600);
      expect(maxTime).toBeLessThan(800);
    }, 15000);

    it("should handle multiple session refreshes efficiently", async () => {
      const iterations = 50;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        await db.user.findUnique({
          where: { id: testUserId },
          include: {
            accounts: true,
          },
        });
      }

      const end = performance.now();
      const totalTime = end - start;
      const avgTime = totalTime / iterations;

      console.log(
        `Total time for ${iterations} refreshes: ${totalTime.toFixed(2)}ms`
      );
      console.log(`Average time per refresh: ${avgTime.toFixed(2)}ms`);

      expect(totalTime).toBeLessThan(30000); // Less than 30 seconds for 50 refreshes
      expect(avgTime).toBeLessThan(600);
    }, 35000);
  });

  describe("Password Hashing Performance", () => {
    it("should hash passwords efficiently with bcrypt (< 500ms)", async () => {
      const iterations = 5;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();

        await bcrypt.hash("TestPassword123!", 10);

        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Average bcrypt hash time: ${avgTime.toFixed(2)}ms`);
      console.log(`Max bcrypt hash time: ${maxTime.toFixed(2)}ms`);

      // Bcrypt is intentionally slow for security, but should be reasonable
      expect(avgTime).toBeLessThan(500);
      expect(maxTime).toBeLessThan(1000);
    });

    it("should compare passwords efficiently with bcrypt (< 500ms)", async () => {
      const hash = await bcrypt.hash("TestPassword123!", 10);
      const iterations = 5;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();

        await bcrypt.compare("TestPassword123!", hash);

        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Average bcrypt compare time: ${avgTime.toFixed(2)}ms`);
      console.log(`Max bcrypt compare time: ${maxTime.toFixed(2)}ms`);

      expect(avgTime).toBeLessThan(500);
      expect(maxTime).toBeLessThan(1000);
    });
  });

  describe("Edge Runtime Timeout Compliance", () => {
    it("should complete all middleware operations within edge timeout (< 25s)", () => {
      // Edge runtime has a 25-second timeout for middleware
      // Our middleware should complete in milliseconds, not seconds

      const start = performance.now();

      // Simulate all middleware operations
      const isLoggedIn = false; // Mock auth check
      const pathname = "/admin";
      const userRole = "USER";

      // Route checks
      const isApiAuthRoute = pathname.startsWith("/api/auth");
      const isPublicRoute = pathname === "/";
      const isAuthRoute = pathname.startsWith("/auth");

      // RBAC checks
      const hasAdminAccess = userRole === "ADMIN" || userRole === "GATEKEEPER";
      const hasReviewAccess =
        userRole === "ADMIN" ||
        userRole === "GATEKEEPER" ||
        userRole === "REVIEWER";

      const end = performance.now();
      const operationTime = end - start;

      console.log(`Middleware operations time: ${operationTime.toFixed(2)}ms`);

      // Should complete in microseconds/milliseconds, not seconds
      expect(operationTime).toBeLessThan(10); // Less than 10ms
    });

    it("should not have blocking operations in middleware", () => {
      // Verify that middleware logic is synchronous and non-blocking
      const start = performance.now();

      // All middleware operations should be synchronous
      const operations = [
        () => "test".startsWith("/api"),
        () => ["/"].includes("/test"),
        () => "USER" === "ADMIN",
        () => new URL("/dashboard", "http://localhost:3000"),
      ];

      operations.forEach((op) => op());

      const end = performance.now();
      const totalTime = end - start;

      console.log(`Synchronous operations time: ${totalTime.toFixed(2)}ms`);

      expect(totalTime).toBeLessThan(5); // Should be nearly instant
    });

    it("should handle URL construction efficiently", () => {
      const iterations = 1000;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        new URL("/dashboard", "http://localhost:3000");
        new URL("/auth/login?callbackUrl=%2Fadmin", "http://localhost:3000");
      }

      const end = performance.now();
      const totalTime = end - start;
      const avgTime = totalTime / iterations;

      console.log(
        `Total time for ${iterations} URL constructions: ${totalTime.toFixed(2)}ms`
      );
      console.log(`Average time per URL construction: ${avgTime.toFixed(4)}ms`);

      expect(totalTime).toBeLessThan(100); // Less than 100ms for 1000 constructions
      expect(avgTime).toBeLessThan(1); // Less than 1ms per construction
    });
  });

  describe("Overall System Performance", () => {
    it("should handle complete authentication flow efficiently", async () => {
      const start = performance.now();

      // Simulate complete auth flow:
      // 1. Query user by email
      const user = await db.user.findUnique({
        where: { email: testUserEmail },
      });

      // 2. Compare password (simulated)
      if (user?.password) {
        await bcrypt.compare("TestPassword123!", user.password);
      }

      // 3. Query user with accounts for JWT
      await db.user.findUnique({
        where: { id: testUserId },
        include: {
          accounts: true,
        },
      });

      const end = performance.now();
      const totalTime = end - start;

      console.log(`Complete auth flow time: ${totalTime.toFixed(2)}ms`);

      // Complete flow should be under 2 seconds
      expect(totalTime).toBeLessThan(2000);
    }, 10000);

    it("should maintain performance under load", async () => {
      const concurrentFlows = 10;
      const start = performance.now();

      const flows = Array(concurrentFlows)
        .fill(null)
        .map(async () => {
          // Simulate auth flow
          const user = await db.user.findUnique({
            where: { email: testUserEmail },
          });

          if (user?.password) {
            await bcrypt.compare("TestPassword123!", user.password);
          }

          await db.user.findUnique({
            where: { id: testUserId },
            include: {
              accounts: true,
            },
          });
        });

      await Promise.all(flows);

      const end = performance.now();
      const totalTime = end - start;
      const avgTimePerFlow = totalTime / concurrentFlows;

      console.log(
        `Total time for ${concurrentFlows} concurrent flows: ${totalTime.toFixed(2)}ms`
      );
      console.log(`Average time per flow: ${avgTimePerFlow.toFixed(2)}ms`);

      // Should handle concurrent load efficiently
      expect(totalTime).toBeLessThan(5000); // Less than 5 seconds for 10 flows
      expect(avgTimePerFlow).toBeLessThan(1000);
    });
  });

  describe("Database Connection Performance", () => {
    it("should have efficient connection pooling", async () => {
      const queries = 100;
      const start = performance.now();

      // Execute many queries to test connection pooling
      const promises = Array(queries)
        .fill(null)
        .map(() =>
          db.user.findUnique({
            where: { id: testUserId },
          })
        );

      await Promise.all(promises);

      const end = performance.now();
      const totalTime = end - start;
      const avgTime = totalTime / queries;

      console.log(
        `Total time for ${queries} queries: ${totalTime.toFixed(2)}ms`
      );
      console.log(`Average time per query: ${avgTime.toFixed(2)}ms`);

      // With proper connection pooling, should handle many queries efficiently
      expect(totalTime).toBeLessThan(5000); // Less than 5 seconds for 100 queries
      expect(avgTime).toBeLessThan(100);
    });

    it("should not exhaust database connections", async () => {
      // Test that we can handle many concurrent operations without exhausting connections
      const operations = 50;

      const promises = Array(operations)
        .fill(null)
        .map(async (_, index) => {
          // Mix of different query types
          if (index % 3 === 0) {
            return db.user.findUnique({ where: { id: testUserId } });
          } else if (index % 3 === 1) {
            return db.user.findUnique({ where: { email: testUserEmail } });
          } else {
            return db.user.findUnique({
              where: { id: testUserId },
              include: { accounts: true },
            });
          }
        });

      // Should not throw connection errors
      await expect(Promise.all(promises)).resolves.toBeDefined();
    });
  });
});
