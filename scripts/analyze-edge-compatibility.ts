/**
 * Edge Runtime Compatibility Analyzer
 *
 * This script searches for Node.js-specific globals that are incompatible
 * with Vercel's Edge Runtime environment.
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { join, relative } from "path";

interface Finding {
  file: string;
  line: number;
  column: number;
  global: string;
  context: string;
}

const NODE_GLOBALS = [
  "__dirname",
  "__filename",
  "process.cwd()",
  "require.resolve",
  "module.exports",
];

const EXCLUDE_DIRS = [
  "node_modules",
  ".next",
  ".git",
  ".vercel",
  "dist",
  "build",
  "coverage",
  "uploads",
];

const EXCLUDE_FILES = ["analyze-edge-compatibility.ts", "setup-db.js"];

function searchForNodeGlobals(
  dir: string,
  findings: Finding[] = [],
  rootDir: string = dir
): Finding[] {
  try {
    const files = readdirSync(dir);

    for (const file of files) {
      const filePath = join(dir, file);
      const relativePath = relative(rootDir, filePath);

      // Skip excluded files
      if (EXCLUDE_FILES.some((excluded) => relativePath.includes(excluded))) {
        continue;
      }

      try {
        const stat = statSync(filePath);

        if (stat.isDirectory()) {
          // Skip excluded directories
          if (EXCLUDE_DIRS.includes(file)) {
            continue;
          }
          searchForNodeGlobals(filePath, findings, rootDir);
        } else if (
          file.endsWith(".ts") ||
          file.endsWith(".tsx") ||
          file.endsWith(".js") ||
          file.endsWith(".jsx") ||
          file.endsWith(".mjs")
        ) {
          const content = readFileSync(filePath, "utf-8");
          const lines = content.split("\n");

          for (const global of NODE_GLOBALS) {
            lines.forEach((line, index) => {
              // Skip comments
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith("//") || trimmedLine.startsWith("*")) {
                return;
              }

              const globalIndex = line.indexOf(global);
              if (globalIndex !== -1) {
                findings.push({
                  file: relativePath,
                  line: index + 1,
                  column: globalIndex + 1,
                  global,
                  context: line.trim(),
                });
              }
            });
          }
        }
      } catch (err) {
        // Skip files that can't be read
        console.warn(`Warning: Could not process ${filePath}`);
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
  }

  return findings;
}

function analyzeMiddlewareImports(): string[] {
  const middlewarePath = "middleware.ts";
  const imports: string[] = [];

  try {
    const content = readFileSync(middlewarePath, "utf-8");
    const lines = content.split("\n");

    for (const line of lines) {
      const importMatch = line.match(/import\s+.*\s+from\s+['"](.+)['"]/);
      if (importMatch) {
        imports.push(importMatch[1]);
      }
    }
  } catch (err) {
    console.error("Could not read middleware.ts:", err);
  }

  return imports;
}

function generateReport(
  findings: Finding[],
  middlewareImports: string[]
): string {
  let report = "# Edge Runtime Compatibility Analysis Report\n\n";
  report += `Generated: ${new Date().toISOString()}\n\n`;

  report += "## Summary\n\n";
  report += `- Total findings: ${findings.length}\n`;
  report += `- Files affected: ${new Set(findings.map((f) => f.file)).size}\n`;
  report += `- Middleware imports: ${middlewareImports.length}\n\n`;

  report += "## Middleware Import Chain\n\n";
  report += "The following modules are imported by middleware.ts:\n\n";
  middlewareImports.forEach((imp) => {
    report += `- \`${imp}\`\n`;
  });
  report += "\n";

  report += "## Node.js Global Usage Findings\n\n";

  if (findings.length === 0) {
    report += "No Node.js globals found in application code.\n\n";
  } else {
    // Group by file
    const byFile = findings.reduce(
      (acc, finding) => {
        if (!acc[finding.file]) {
          acc[finding.file] = [];
        }
        acc[finding.file].push(finding);
        return acc;
      },
      {} as Record<string, Finding[]>
    );

    Object.entries(byFile).forEach(([file, fileFindings]) => {
      report += `### ${file}\n\n`;
      fileFindings.forEach((finding) => {
        report += `- **Line ${finding.line}, Column ${finding.column}**: \`${finding.global}\`\n`;
        report += `  \`\`\`typescript\n  ${finding.context}\n  \`\`\`\n\n`;
      });
    });
  }

  report += "## Analysis\n\n";

  const criticalFiles = findings.filter(
    (f) =>
      f.file.includes("middleware") ||
      f.file.includes("auth.config") ||
      f.file.includes("auth.ts")
  );

  if (criticalFiles.length > 0) {
    report += "### Critical Issues (in middleware dependency chain)\n\n";
    criticalFiles.forEach((finding) => {
      report += `- **${finding.file}:${finding.line}** uses \`${finding.global}\`\n`;
    });
    report += "\n";
  }

  report += "### Recommendations\n\n";

  if (findings.length === 0) {
    report += "1. No Node.js globals found in application code\n";
    report += "2. The issue may be in third-party dependencies\n";
    report += "3. Check the middleware bundle for imported dependencies\n";
    report +=
      "4. Consider using Next.js build analysis to identify the source\n";
  } else {
    report += "1. Remove or conditionally execute code using Node.js globals\n";
    report +=
      "2. Ensure middleware.ts and auth.config.ts have no module-level side effects\n";
    report += '3. Add explicit `export const runtime = "edge"` declarations\n';
    report += "4. Use Edge Runtime-compatible alternatives where needed\n";
  }

  return report;
}

// Main execution
console.log("🔍 Analyzing codebase for Edge Runtime compatibility...\n");

const findings = searchForNodeGlobals(process.cwd());
const middlewareImports = analyzeMiddlewareImports();

console.log(`Found ${findings.length} instances of Node.js globals\n`);

if (findings.length > 0) {
  console.log("Findings by file:");
  const byFile = findings.reduce(
    (acc, finding) => {
      if (!acc[finding.file]) {
        acc[finding.file] = 0;
      }
      acc[finding.file]++;
      return acc;
    },
    {} as Record<string, number>
  );

  Object.entries(byFile).forEach(([file, count]) => {
    console.log(`  ${file}: ${count} instance(s)`);
  });
  console.log("");
}

const report = generateReport(findings, middlewareImports);

// Write report to file
const reportPath = ".kiro/specs/fix-dirname-edge-error/diagnostic-report.md";
writeFileSync(reportPath, report);

console.log(`✅ Report generated: ${reportPath}\n`);

// Print summary to console
console.log("Summary:");
console.log(`- Total findings: ${findings.length}`);
console.log(`- Files affected: ${new Set(findings.map((f) => f.file)).size}`);
console.log(`- Middleware imports: ${middlewareImports.length}`);
