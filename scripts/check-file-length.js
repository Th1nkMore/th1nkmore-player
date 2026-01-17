#!/usr/bin/env node

/**
 * Check file length script
 * Ensures no TypeScript/TSX source files exceed 500 lines
 */

const fs = require("fs");
const path = require("path");

const MAX_LINES = 500;
const ALLOWED_EXTENSIONS = [".ts", ".tsx"];

/**
 * Count lines in a file
 */
function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content.split("\n").length;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return 0;
  }
}

/**
 * Check if file should be validated
 */
function shouldCheckFile(filePath) {
  const ext = path.extname(filePath);
  return ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Main function
 */
function main() {
  // Get files from command line arguments or stdin
  const files = process.argv.slice(2);

  if (files.length === 0) {
    console.error("No files provided to check");
    process.exit(1);
  }

  const errors = [];

  for (const file of files) {
    // Skip if file doesn't exist (might have been deleted)
    if (!fs.existsSync(file)) {
      continue;
    }

    // Only check TypeScript files
    if (!shouldCheckFile(file)) {
      continue;
    }

    const lineCount = countLines(file);

    if (lineCount > MAX_LINES) {
      errors.push({
        file,
        lines: lineCount,
      });
    }
  }

  if (errors.length > 0) {
    console.error("\n❌ File length check failed:\n");
    for (const { file, lines } of errors) {
      console.error(
        `  ${file} exceeds ${MAX_LINES} lines (${lines} lines). Please refactor and split components.`,
      );
    }
    console.error("");
    process.exit(1);
  }

  console.log("✅ All files are within the 500 line limit");
  process.exit(0);
}

main();
