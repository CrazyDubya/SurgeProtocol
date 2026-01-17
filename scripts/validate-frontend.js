#!/usr/bin/env node

/**
 * SURGE PROTOCOL - Frontend Validation Script
 *
 * This script validates the frontend design system:
 * 1. CSS token usage (no hardcoded values)
 * 2. Theme consistency (all themes define required vars)
 * 3. Component structure (proper naming, no conflicts)
 * 4. HTML accessibility basics
 *
 * Run: node scripts/validate-frontend.js
 * Exit codes: 0 = pass, 1 = fail
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const STYLES_DIR = path.join(FRONTEND_DIR, 'styles');
const THEMES_DIR = path.join(STYLES_DIR, 'themes');
const TOKENS_DIR = path.join(STYLES_DIR, 'tokens');

// ANSI color codes
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

let errorCount = 0;
let warningCount = 0;

function error(msg) {
  console.log(`${RED}[ERROR]${RESET} ${msg}`);
  errorCount++;
}

function warn(msg) {
  console.log(`${YELLOW}[WARN]${RESET} ${msg}`);
  warningCount++;
}

function success(msg) {
  console.log(`${GREEN}[OK]${RESET} ${msg}`);
}

function info(msg) {
  console.log(`${CYAN}[INFO]${RESET} ${msg}`);
}

// ============================================
// VALIDATION CHECKS
// ============================================

/**
 * Check 1: Validate directory structure exists
 */
function checkDirectoryStructure() {
  console.log('\n--- Checking Directory Structure ---');

  const requiredDirs = [
    { path: FRONTEND_DIR, name: 'frontend/' },
    { path: STYLES_DIR, name: 'frontend/styles/' },
    { path: THEMES_DIR, name: 'frontend/styles/themes/' },
    { path: TOKENS_DIR, name: 'frontend/styles/tokens/' },
  ];

  let allExist = true;
  for (const dir of requiredDirs) {
    if (fs.existsSync(dir.path)) {
      success(`Found ${dir.name}`);
    } else {
      warn(`Missing ${dir.name}`);
      allExist = false;
    }
  }

  return allExist;
}

/**
 * Check 2: Validate required theme files exist
 */
function checkThemeFiles() {
  console.log('\n--- Checking Theme Files ---');

  const requiredThemes = [
    'neon-decay.css',
    'terminal-noir.css',
    'algorithm-vision.css',
  ];

  if (!fs.existsSync(THEMES_DIR)) {
    warn('Themes directory does not exist');
    return false;
  }

  let allExist = true;
  for (const theme of requiredThemes) {
    const themePath = path.join(THEMES_DIR, theme);
    if (fs.existsSync(themePath)) {
      success(`Found theme: ${theme}`);
    } else {
      error(`Missing required theme: ${theme}`);
      allExist = false;
    }
  }

  return allExist;
}

/**
 * Check 3: Validate base tokens file
 */
function checkBaseTokens() {
  console.log('\n--- Checking Base Tokens ---');

  const basePath = path.join(TOKENS_DIR, 'base.css');

  if (!fs.existsSync(basePath)) {
    error('Missing base.css tokens file');
    return false;
  }

  const content = fs.readFileSync(basePath, 'utf-8');

  // Check for required token categories
  const requiredCategories = [
    { pattern: /--space-\d+/g, name: 'spacing tokens', min: 5 },
    { pattern: /--text-(xs|sm|base|lg|xl)/g, name: 'typography tokens', min: 5 },
    { pattern: /--radius-(sm|md|lg)/g, name: 'border-radius tokens', min: 3 },
    { pattern: /--z-\w+/g, name: 'z-index tokens', min: 3 },
    { pattern: /--duration-\w+/g, name: 'transition tokens', min: 2 },
  ];

  let allValid = true;
  for (const category of requiredCategories) {
    const matches = content.match(category.pattern) || [];
    if (matches.length >= category.min) {
      success(`Found ${matches.length} ${category.name}`);
    } else {
      error(`Missing ${category.name} (found ${matches.length}, need ${category.min})`);
      allValid = false;
    }
  }

  return allValid;
}

/**
 * Check 4: Validate theme variable definitions
 */
function checkThemeVariables() {
  console.log('\n--- Checking Theme Variables ---');

  if (!fs.existsSync(THEMES_DIR)) {
    warn('Themes directory does not exist');
    return true; // Not an error if themes dir doesn't exist yet
  }

  const requiredVars = [
    '--bg-primary',
    '--bg-secondary',
    '--text-primary',
    '--text-secondary',
    '--accent-algorithm',
    '--accent-danger',
    '--accent-humanity',
    '--font-ui',
  ];

  const themeFiles = fs.readdirSync(THEMES_DIR).filter(f => f.endsWith('.css'));
  let allValid = true;

  for (const themeFile of themeFiles) {
    const themePath = path.join(THEMES_DIR, themeFile);
    const content = fs.readFileSync(themePath, 'utf-8');

    const missing = requiredVars.filter(v => !content.includes(v));

    if (missing.length === 0) {
      success(`${themeFile}: All required variables defined`);
    } else {
      error(`${themeFile}: Missing variables: ${missing.join(', ')}`);
      allValid = false;
    }
  }

  return allValid;
}

/**
 * Check 5: Look for hardcoded values that should use tokens
 */
function checkHardcodedValues() {
  console.log('\n--- Checking for Hardcoded Values ---');

  if (!fs.existsSync(STYLES_DIR)) {
    warn('Styles directory does not exist');
    return true;
  }

  // Patterns to flag
  const patterns = [
    // Hardcoded colors outside variable definitions
    { regex: /[^-]color:\s*#[0-9a-fA-F]{3,8}/g, name: 'hardcoded color' },
    { regex: /[^-]background:\s*#[0-9a-fA-F]{3,8}/g, name: 'hardcoded background' },

    // Magic numbers in margins/padding (should use spacing tokens)
    { regex: /(margin|padding):\s*\d{2,}px/g, name: 'large hardcoded spacing' },
  ];

  let issueCount = 0;
  const maxIssues = 10;
  const issues = [];

  // Recursively find all CSS files
  function findCSSFiles(dir) {
    const files = [];
    if (!fs.existsSync(dir)) return files;

    for (const item of fs.readdirSync(dir)) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        files.push(...findCSSFiles(itemPath));
      } else if (item.endsWith('.css')) {
        files.push(itemPath);
      }
    }
    return files;
  }

  const cssFiles = findCSSFiles(STYLES_DIR);

  for (const cssFile of cssFiles) {
    const content = fs.readFileSync(cssFile, 'utf-8');
    const fileName = path.relative(ROOT_DIR, cssFile);

    // Skip token definition files (they're allowed to have raw values)
    if (fileName.includes('tokens/')) continue;

    // Remove comments
    const contentClean = content
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '');

    // Remove variable definitions (--var-name: value)
    const contentNoVars = contentClean.replace(/--[\w-]+:\s*[^;]+;/g, '');

    for (const { regex, name } of patterns) {
      const matches = contentNoVars.match(regex) || [];
      for (const match of matches) {
        if (issueCount < maxIssues) {
          issues.push(`${fileName}: ${name} - "${match.trim()}"`);
        }
        issueCount++;
      }
    }
  }

  if (issues.length > 0) {
    warn(`Found ${issueCount} potential hardcoded values (showing first ${maxIssues}):`);
    issues.forEach(i => console.log(`  ${i}`));
    return true; // Warning, not error
  }

  success('No problematic hardcoded values found');
  return true;
}

/**
 * Check 6: Validate HTML files have required accessibility attributes
 */
function checkHTMLAccessibility() {
  console.log('\n--- Checking HTML Accessibility ---');

  if (!fs.existsSync(FRONTEND_DIR)) {
    warn('Frontend directory does not exist');
    return true;
  }

  const htmlFiles = [];

  function findHTMLFiles(dir) {
    if (!fs.existsSync(dir)) return;

    for (const item of fs.readdirSync(dir)) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        findHTMLFiles(itemPath);
      } else if (item.endsWith('.html')) {
        htmlFiles.push(itemPath);
      }
    }
  }

  findHTMLFiles(FRONTEND_DIR);

  if (htmlFiles.length === 0) {
    info('No HTML files found to check');
    return true;
  }

  let allValid = true;
  const checks = [
    { pattern: /<html[^>]*lang=/i, name: 'lang attribute on <html>' },
    { pattern: /<meta[^>]*viewport/i, name: 'viewport meta tag' },
    { pattern: /<title>/i, name: '<title> tag' },
  ];

  for (const htmlFile of htmlFiles) {
    const content = fs.readFileSync(htmlFile, 'utf-8');
    const fileName = path.relative(ROOT_DIR, htmlFile);
    const issues = [];

    for (const check of checks) {
      if (!check.pattern.test(content)) {
        issues.push(check.name);
      }
    }

    // Check for images without alt
    const imgWithoutAlt = (content.match(/<img(?![^>]*alt=)/gi) || []).length;
    if (imgWithoutAlt > 0) {
      issues.push(`${imgWithoutAlt} <img> without alt attribute`);
    }

    // Check for buttons without accessible name
    const buttonWithoutText = (content.match(/<button[^>]*>\s*<\/button>/gi) || []).length;
    if (buttonWithoutText > 0) {
      issues.push(`${buttonWithoutText} empty <button> elements`);
    }

    if (issues.length === 0) {
      success(`${fileName}: Accessibility checks passed`);
    } else {
      warn(`${fileName}: Missing ${issues.join(', ')}`);
    }
  }

  return allValid;
}

/**
 * Check 7: Validate CSS naming conventions
 */
function checkNamingConventions() {
  console.log('\n--- Checking Naming Conventions ---');

  if (!fs.existsSync(STYLES_DIR)) {
    warn('Styles directory does not exist');
    return true;
  }

  // BEM-ish pattern: .component or .component__element or .component--modifier
  const validClassPattern = /^\.([\w-]+)(__[\w-]+)?(--[\w-]+)?$/;

  // Patterns that suggest poor naming
  const badPatterns = [
    { regex: /\.(red|blue|green|yellow|big|small)\s*\{/gi, name: 'utility class that should be semantic' },
    { regex: /\.(?:style|class)\d+\s*\{/gi, name: 'numbered class names' },
    { regex: /\#[\w-]+\s*\{/g, name: 'ID selector (prefer classes)' },
  ];

  let issueCount = 0;
  const maxIssues = 10;
  const issues = [];

  function findCSSFiles(dir) {
    const files = [];
    if (!fs.existsSync(dir)) return files;

    for (const item of fs.readdirSync(dir)) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        files.push(...findCSSFiles(itemPath));
      } else if (item.endsWith('.css')) {
        files.push(itemPath);
      }
    }
    return files;
  }

  const cssFiles = findCSSFiles(STYLES_DIR);

  for (const cssFile of cssFiles) {
    const content = fs.readFileSync(cssFile, 'utf-8');
    const fileName = path.relative(ROOT_DIR, cssFile);

    // Remove comments
    const contentClean = content.replace(/\/\*[\s\S]*?\*\//g, '');

    for (const { regex, name } of badPatterns) {
      const matches = contentClean.match(regex) || [];
      for (const match of matches) {
        if (issueCount < maxIssues) {
          issues.push(`${fileName}: ${name} - "${match.trim()}"`);
        }
        issueCount++;
      }
    }
  }

  if (issues.length > 0) {
    warn(`Found ${issueCount} naming convention issues (showing first ${maxIssues}):`);
    issues.forEach(i => console.log(`  ${i}`));
    return true; // Warning, not error
  }

  success('Naming conventions look good');
  return true;
}

// ============================================
// MAIN
// ============================================

function main() {
  console.log('========================================');
  console.log('  SURGE PROTOCOL - Frontend Validation');
  console.log('========================================');

  // Run all checks
  checkDirectoryStructure();
  checkThemeFiles();
  checkBaseTokens();
  checkThemeVariables();
  checkHardcodedValues();
  checkHTMLAccessibility();
  checkNamingConventions();

  // Summary
  console.log('\n========================================');
  console.log('  SUMMARY');
  console.log('========================================');

  if (errorCount > 0) {
    console.log(`${RED}Errors: ${errorCount}${RESET}`);
  }
  if (warningCount > 0) {
    console.log(`${YELLOW}Warnings: ${warningCount}${RESET}`);
  }
  if (errorCount === 0 && warningCount === 0) {
    console.log(`${GREEN}All checks passed!${RESET}`);
  }

  console.log('');

  // Exit with error code if there were errors
  if (errorCount > 0) {
    console.log(`${RED}Frontend validation FAILED${RESET}`);
    process.exit(1);
  }

  console.log(`${GREEN}Frontend validation PASSED${RESET}`);
  process.exit(0);
}

main();
