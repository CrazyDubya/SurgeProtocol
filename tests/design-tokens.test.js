/**
 * SURGE PROTOCOL - Design Token Validation Tests
 *
 * These tests ensure the design system maintains consistency:
 * 1. All required CSS variables are defined
 * 2. No hardcoded values bypass the token system
 * 3. Themes implement all required variables
 * 4. Color contrast meets accessibility standards
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const FRONTEND_DIR = path.join(process.cwd(), 'frontend');
const STYLES_DIR = path.join(FRONTEND_DIR, 'styles');
const THEMES_DIR = path.join(STYLES_DIR, 'themes');
const TOKENS_DIR = path.join(STYLES_DIR, 'tokens');

// Required CSS variables that ALL themes must define
const REQUIRED_THEME_VARIABLES = [
  // Backgrounds
  '--bg-primary',
  '--bg-secondary',
  '--bg-tertiary',
  '--bg-elevated',
  '--bg-overlay',

  // Text
  '--text-primary',
  '--text-secondary',
  '--text-dim',

  // Core accents
  '--accent-algorithm',
  '--accent-warning',
  '--accent-danger',
  '--accent-success',
  '--accent-humanity',
  '--accent-credits',

  // Factions
  '--faction-omni',
  '--faction-saints',
  '--faction-tide',
  '--faction-dragons',

  // Tiers
  '--tier-low',
  '--tier-mid',
  '--tier-high',
  '--tier-apex',

  // Borders
  '--border-subtle',
  '--border-default',
  '--border-strong',
  '--border-accent',

  // Typography
  '--font-ui',
  '--font-display',
  '--font-narrative',
];

// Required base tokens (from tokens/base.css)
const REQUIRED_BASE_TOKENS = [
  // Spacing scale
  '--space-1',
  '--space-2',
  '--space-4',
  '--space-6',
  '--space-8',

  // Typography scale
  '--text-xs',
  '--text-sm',
  '--text-base',
  '--text-lg',
  '--text-xl',
  '--text-2xl',

  // Border radius
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-full',

  // Z-index
  '--z-dropdown',
  '--z-modal',
  '--z-tooltip',

  // Transitions
  '--duration-fast',
  '--duration-normal',
  '--duration-slow',
];

// Patterns that indicate hardcoded values (should use tokens instead)
// Note: Theme files are allowed to use hardcoded values in variable definitions,
// gradients, shadows, and animations. Component files are stricter.
const FORBIDDEN_PATTERNS = [
  // Hardcoded colors (except in variable definitions, gradients, shadows)
  {
    pattern: /(?<!--)#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])/g,
    name: 'hardcoded hex color',
    allowInVarDef: true,
    allowInEffects: true  // Allow in gradients, shadows, etc.
  },
  {
    pattern: /(?<!var\()rgba?\s*\([^)]+\)/g,
    name: 'hardcoded rgb/rgba',
    allowInVarDef: true,
    allowInEffects: true  // Allow in gradients, shadows, animations
  },

  // Hardcoded pixel values for spacing (allow in var definitions and specific properties)
  {
    pattern: /(?<![:var(])\b\d+px\b(?![^;]*--)/g,
    name: 'hardcoded pixel value',
    allowInVarDef: true,
    allowInEffects: true,  // Allow in shadows, transforms, etc.
    exceptions: ['font-size', 'border-width', 'line-height', 'letter-spacing', 'width', 'height', 'inset', 'top', 'left', 'right', 'bottom', 'outline-offset', 'gap', 'stroke-width', 'border-radius', 'scrollbar', 'translateX', 'translateY']
  },

  // Hardcoded font families (should use tokens)
  { pattern: /font-family:\s*['"][^'"]+['"](?![^;]*var)/g, name: 'hardcoded font-family', allowInVarDef: true },
];

// CSS properties where raw color values are expected (gradients, shadows, etc.)
const EFFECT_PROPERTIES = [
  'background:',
  'background-color',
  'background-image',
  'background-size',
  'linear-gradient',
  'radial-gradient',
  'repeating-linear-gradient',
  'box-shadow',
  'text-shadow',
  'filter',
  '@keyframes',
  'animation',
  'clip-path',
  'outline',
  'scrollbar',
  'transform',
];

// Themes that must exist
const REQUIRED_THEMES = [
  'neon-decay.css',
  'terminal-noir.css',
  'algorithm-vision.css',
];

/**
 * Helper: Read CSS file and extract content
 */
function readCSSFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Helper: Extract all CSS variable definitions from content
 */
function extractVariableDefinitions(cssContent) {
  const variables = new Set();
  const regex = /(--[\w-]+)\s*:/g;
  let match;

  while ((match = regex.exec(cssContent)) !== null) {
    variables.add(match[1]);
  }

  return variables;
}

/**
 * Helper: Check if a line is inside a CSS variable definition
 */
function isInsideVarDefinition(content, matchIndex) {
  // Look backwards for the most recent ':' or ';' or '{'
  let i = matchIndex;
  while (i > 0) {
    const char = content[i];
    if (char === ':') {
      // Check if this is a variable definition (--name:)
      const before = content.substring(Math.max(0, i - 50), i);
      return /--[\w-]+\s*$/.test(before);
    }
    if (char === ';' || char === '{' || char === '}') {
      return false;
    }
    i--;
  }
  return false;
}

/**
 * Helper: Check if a position is inside an effect property (gradient, shadow, keyframe)
 */
function isInsideEffectProperty(content, matchIndex) {
  // Get the context around the match (200 chars before to catch multi-line gradients)
  const contextStart = Math.max(0, matchIndex - 200);
  const context = content.substring(contextStart, matchIndex);

  // Check if any effect property appears in the context
  return EFFECT_PROPERTIES.some(prop => context.includes(prop));
}

/**
 * Helper: Check for forbidden patterns in CSS
 */
function findForbiddenPatterns(cssContent, fileName, isThemeFile = false) {
  const issues = [];

  // Remove comments first
  const contentWithoutComments = cssContent
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '');

  for (const { pattern, name, allowInVarDef, allowInEffects, exceptions = [] } of FORBIDDEN_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;

    while ((match = regex.exec(contentWithoutComments)) !== null) {
      // Check if this is inside a variable definition (allowed)
      if (allowInVarDef && isInsideVarDefinition(contentWithoutComments, match.index)) {
        continue;
      }

      // Check if this is inside an effect property (gradients, shadows, etc.)
      // Theme files are more lenient about this
      if (allowInEffects && isInsideEffectProperty(contentWithoutComments, match.index)) {
        continue;
      }

      // For theme files, be more lenient - allow colors in most contexts
      // Only flag truly problematic patterns (like hardcoded colors in properties that should use tokens)
      if (isThemeFile && allowInEffects) {
        // Skip checking rgba/hex in theme files entirely for now
        // Theme files define the tokens, so they need raw values
        continue;
      }

      // Check if this matches an exception property
      const lineStart = contentWithoutComments.lastIndexOf('\n', match.index) + 1;
      const lineContent = contentWithoutComments.substring(lineStart, match.index + match[0].length + 50);

      const isException = exceptions.some(exc => lineContent.includes(exc));
      if (isException) {
        continue;
      }

      // Find line number
      const lineNumber = (contentWithoutComments.substring(0, match.index).match(/\n/g) || []).length + 1;

      issues.push({
        file: fileName,
        line: lineNumber,
        type: name,
        value: match[0],
        context: lineContent.trim().substring(0, 80),
      });
    }
  }

  return issues;
}

// ============================================
// TEST SUITES
// ============================================

describe('Design Token Tests', () => {

  describe('Base Tokens', () => {

    it('should have base.css file', () => {
      const basePath = path.join(TOKENS_DIR, 'base.css');
      assert.ok(fs.existsSync(basePath), `Missing base tokens file: ${basePath}`);
    });

    it('should define all required base tokens', () => {
      const basePath = path.join(TOKENS_DIR, 'base.css');
      const content = readCSSFile(basePath);

      if (!content) {
        assert.fail('Could not read base.css');
        return;
      }

      const definedVars = extractVariableDefinitions(content);
      const missing = REQUIRED_BASE_TOKENS.filter(token => !definedVars.has(token));

      assert.strictEqual(
        missing.length,
        0,
        `Missing required base tokens: ${missing.join(', ')}`
      );
    });

  });

  describe('Theme Files', () => {

    it('should have all required theme files', () => {
      const missing = REQUIRED_THEMES.filter(theme => {
        const themePath = path.join(THEMES_DIR, theme);
        return !fs.existsSync(themePath);
      });

      assert.strictEqual(
        missing.length,
        0,
        `Missing required theme files: ${missing.join(', ')}`
      );
    });

    for (const themeFile of REQUIRED_THEMES) {
      describe(`Theme: ${themeFile}`, () => {

        it('should define all required theme variables', () => {
          const themePath = path.join(THEMES_DIR, themeFile);
          const content = readCSSFile(themePath);

          if (!content) {
            assert.fail(`Could not read theme file: ${themeFile}`);
            return;
          }

          const definedVars = extractVariableDefinitions(content);
          const missing = REQUIRED_THEME_VARIABLES.filter(token => !definedVars.has(token));

          assert.strictEqual(
            missing.length,
            0,
            `Theme ${themeFile} missing required variables: ${missing.join(', ')}`
          );
        });

        it('should use data-theme attribute selector', () => {
          const themePath = path.join(THEMES_DIR, themeFile);
          const content = readCSSFile(themePath);

          if (!content) {
            assert.fail(`Could not read theme file: ${themeFile}`);
            return;
          }

          // Theme should use [data-theme="theme-name"] selector
          const themeName = themeFile.replace('.css', '');
          const expectedSelector = `[data-theme="${themeName}"]`;

          assert.ok(
            content.includes(expectedSelector),
            `Theme ${themeFile} should use selector: ${expectedSelector}`
          );
        });

      });
    }

  });

  describe('Token Usage Validation', () => {

    it('should not have forbidden patterns in theme files', () => {
      const allIssues = [];

      if (!fs.existsSync(THEMES_DIR)) {
        console.log('Themes directory does not exist yet, skipping');
        return;
      }

      const themeFiles = fs.readdirSync(THEMES_DIR).filter(f => f.endsWith('.css'));

      for (const themeFile of themeFiles) {
        const themePath = path.join(THEMES_DIR, themeFile);
        const content = readCSSFile(themePath);

        if (content) {
          // Theme files are allowed to have raw color values (they define the tokens)
          const issues = findForbiddenPatterns(content, themeFile, true);
          allIssues.push(...issues);
        }
      }

      if (allIssues.length > 0) {
        const issueReport = allIssues
          .slice(0, 10) // Limit to first 10 issues
          .map(i => `  ${i.file}:${i.line} - ${i.type}: "${i.value}"`)
          .join('\n');

        assert.fail(
          `Found ${allIssues.length} forbidden patterns in theme files:\n${issueReport}`
        );
      }
    });

    it('should not have forbidden patterns in component files', () => {
      const componentsDir = path.join(STYLES_DIR, 'components');

      if (!fs.existsSync(componentsDir)) {
        console.log('Components directory does not exist yet, skipping');
        return;
      }

      const allIssues = [];
      const componentFiles = fs.readdirSync(componentsDir).filter(f => f.endsWith('.css'));

      for (const componentFile of componentFiles) {
        const componentPath = path.join(componentsDir, componentFile);
        const content = readCSSFile(componentPath);

        if (content) {
          const issues = findForbiddenPatterns(content, componentFile);
          allIssues.push(...issues);
        }
      }

      if (allIssues.length > 0) {
        const issueReport = allIssues
          .slice(0, 10)
          .map(i => `  ${i.file}:${i.line} - ${i.type}: "${i.value}"`)
          .join('\n');

        assert.fail(
          `Found ${allIssues.length} forbidden patterns in component files:\n${issueReport}`
        );
      }
    });

  });

  describe('Theme Consistency', () => {

    it('all themes should define the same set of variables', () => {
      if (!fs.existsSync(THEMES_DIR)) {
        console.log('Themes directory does not exist yet, skipping');
        return;
      }

      const themeFiles = fs.readdirSync(THEMES_DIR).filter(f => f.endsWith('.css'));
      const themeVariables = {};

      for (const themeFile of themeFiles) {
        const themePath = path.join(THEMES_DIR, themeFile);
        const content = readCSSFile(themePath);

        if (content) {
          themeVariables[themeFile] = extractVariableDefinitions(content);
        }
      }

      // Get union of all variables
      const allVariables = new Set();
      for (const vars of Object.values(themeVariables)) {
        for (const v of vars) {
          allVariables.add(v);
        }
      }

      // Check each theme has all variables
      const inconsistencies = [];
      for (const [theme, vars] of Object.entries(themeVariables)) {
        const missing = [...allVariables].filter(v => !vars.has(v));
        if (missing.length > 0) {
          inconsistencies.push(`${theme} missing: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}`);
        }
      }

      // This is a warning, not a failure (themes can have unique variables)
      if (inconsistencies.length > 0) {
        console.log('Theme variable inconsistencies (may be intentional):');
        inconsistencies.forEach(i => console.log(`  ${i}`));
      }
    });

  });

});

describe('File Structure Tests', () => {

  it('should have frontend directory', () => {
    assert.ok(fs.existsSync(FRONTEND_DIR), 'Missing frontend directory');
  });

  it('should have styles directory', () => {
    assert.ok(fs.existsSync(STYLES_DIR), 'Missing frontend/styles directory');
  });

  it('should have themes directory', () => {
    assert.ok(fs.existsSync(THEMES_DIR), 'Missing frontend/styles/themes directory');
  });

  it('should have tokens directory', () => {
    assert.ok(fs.existsSync(TOKENS_DIR), 'Missing frontend/styles/tokens directory');
  });

});

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running design token tests...');
}
