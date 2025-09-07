/**
 * Testing library & framework: Jest + TypeScript (follows NestJS defaults).
 *
 * Purpose: Validate the structure and critical content of the Coding Standards document
 * that exists at test/coding-standards.spec.ts. Since that file contains Markdown-like
 * documentation (not executable tests), we add content validation tests here.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Coding Standards Document', () => {
  const docPath = path.join(process.cwd(), 'test', 'coding-standards.spec.ts');
  let content = '';

  beforeAll(() => {
    content = fs.readFileSync(docPath, 'utf8');
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(100); // sanity check: non-trivial document
  });

  describe('Top-level structure', () => {
    it('includes the main title and primary sections', () => {
      const requiredHeadings = [
        /^#\s+Coding Standards\b/m,
        /^##\s+General Principles\b/m,
        /^##\s+Project Structure\b/m,
        /^##\s+TypeScript Standards\b/m,
        /^##\s+NestJS Best Practices\b/m,
        /^##\s+Database Standards\b/m,
        /^##\s+Testing Standards\b/m,
        /^##\s+Error Handling\b/m,
        /^##\s+Environment Configuration\b/m,
        /^##\s+Security Standards\b/m,
        /^##\s+Performance Guidelines\b/m,
        /^##\s+Documentation Standards\b/m,
        /^##\s+Git Standards\b/m,
        /^##\s+Code Review Guidelines\b/m,
        /^##\s+Tools and Linting\b/m,
        /^##\s+Deployment Standards\b/m,
        /^##\s+Quick Reference\b/m,
      ];
      for (const h of requiredHeadings) {
        expect(content).toMatch(h);
      }
    });

    it('contains no obvious TODO markers', () => {
      expect(content).not.toMatch(/\bTODO\b/i);
      expect(content).not.toMatch(/\bTBD\b/i);
    });

    it('has balanced fenced code blocks', () => {
      const ticks = (content.match(/```/g) || []).length;
      expect(ticks % 2).toBe(0);
    });
  });

  describe('General Principles', () => {
    it('lists core principles: Consistency, Readability, Maintainability, Performance', () => {
      expect(content).toMatch(/- \*\*Consistency\*\*:/m);
      expect(content).toMatch(/- \*\*Readability\*\*:/m);
      expect(content).toMatch(/- \*\*Maintainability\*\*:/m);
      expect(content).toMatch(/- \*\*Performance\*\*:/m);
    });
  });

  describe('Project Structure and Naming', () => {
    it('documents NestJS-style directory layout with controllers/services/modules', () => {
      expect(content).toMatch(/src\/\s*\n├── app\.controller\.ts/m);
      expect(content).toMatch(/├── app\.module\.ts/m);
      expect(content).toMatch(/├── app\.service\.ts/m);
      expect(content).toMatch(/├── main\.ts/m);
    });

    it('defines file naming conventions including tests', () => {
      expect(content).toMatch(/- \*\*Controllers\*\*: \`\\\*\.controller\.ts\`/m);
      expect(content).toMatch(/- \*\*Services\*\*: \`\\\*\.service\.ts\`/m);
      expect(content).toMatch(/- \*\*Modules\*\*: \`\\\*\.module\.ts\`/m);
      expect(content).toMatch(/- \*\*Tests\*\*: \`\\\*\.spec\.ts\` \(unit tests\), \`\\\*\.e2e-spec\.ts\` \(integration tests\)/m);
    });
  });

  describe('TypeScript Standards', () => {
    it('advises strict mode and explicit returns; discourages any', () => {
      expect(content).toMatch(/Use \*\*strict mode\*\* TypeScript configuration/);
      expect(content).toMatch(/Use explicit return types for public methods/);
      expect(content).toMatch(/Avoid `any` type/);
    });

    it('documents naming conventions for classes, methods, variables, constants, private members', () => {
      expect(content).toMatch(/\*\*Classes\*\*: PascalCase/);
      expect(content).toMatch(/\*\*Methods\/Functions\*\*: camelCase/);
      expect(content).toMatch(/\*\*Variables\*\*: camelCase/);
      expect(content).toMatch(/\*\*Constants\*\*: UPPER_SNAKE_CASE/);
      expect(content).toMatch(/\*\*Private members\*\*: Prefix with underscore/);
    });

    it('includes a TypeScript code example with a class and async method signature', () => {
      expect(content).toMatch(/```typescript[\s\S]*export class UserService[\s\S]*async getUserById\(userId: string\): Promise<[\s\S]*```/m);
    });
  });

  describe('NestJS Best Practices', () => {
    it('includes controller example with decorators and status code', () => {
      expect(content).toMatch(/@Controller\('users'\)[\s\S]*@Get\(':id'\)[\s\S]*@HttpCode\(HttpStatus\.OK\)/m);
    });

    it('encourages DTOs and thin controllers', () => {
      expect(content).toMatch(/Use DTOs for request\/response validation/);
      expect(content).toMatch(/Keep controllers thin - delegate business logic to services/);
    });
  });

  describe('Testing Standards section', () => {
    it('defines AAA pattern and mocking guidance', () => {
      expect(content).toMatch(/Follow AAA pattern \(Arrange, Act, Assert\)/);
      expect(content).toMatch(/Mock external dependencies/);
    });

    it('contains an example Jest test with describe and it', () => {
      expect(content).toMatch(/describe\('UserService', \(\) => {[\s\S]*it\('should return user when found', async \(\) => {/m);
    });
  });

  describe('Error Handling', () => {
    it('recommends NestJS exceptions and shows an error response JSON schema', () => {
      expect(content).toMatch(/Use NestJS built-in exceptions/);
      expect(content).toMatch(/"statusCode": 400/);
      expect(content).toMatch(/"message": "Validation failed"/);
      expect(content).toMatch(/"error": "Bad Request"/);
      expect(content).toMatch(/"path": "\/api\/users"/);
    });
  });

  describe('Security and Performance', () => {
    it('mentions JWT auth and RBAC', () => {
      expect(content).toMatch(/Use JWT tokens for authentication/);
      expect(content).toMatch(/role-based access control/);
    });

    it('mentions rate limiting and input sanitization', () => {
      expect(content).toMatch(/Sanitize user inputs/);
      expect(content).toMatch(/Implement rate limiting/);
    });

    it('covers DB performance topics like indexing and pagination', () => {
      expect(content).toMatch(/Use proper indexing/);
      expect(content).toMatch(/Implement pagination for large datasets/);
    });
  });

  describe('Linting and CI/CD', () => {
    it('mentions ESLint with Prettier and pre-commit hooks', () => {
      expect(content).toMatch(/ESLint/);
      expect(content).toMatch(/Prettier/);
      expect(content).toMatch(/Pre-commit Hooks/);
    });
  });

  describe('Quality gates', () => {
    it('includes a review checklist with checkboxes', () => {
      const checklistItems = [
        /- \[ \] Code follows established patterns/,
        /- \[ \] Tests are included and meaningful/,
        /- \[ \] Error handling is appropriate/,
        /- \[ \] Performance considerations addressed/,
        /- \[ \] Security best practices followed/,
        /- \[ \] Documentation updated if needed/,
      ];
      for (const item of checklistItems) {
        expect(content).toMatch(item);
      }
    });
  });

  describe('Formatting sanity checks', () => {
    it('does not have Windows CRLF line endings (optional but encouraged)', () => {
      // This check is lenient: it passes if CRLF count is small relative to content size.
      const crlfCount = (content.match(/\r\n/g) || []).length;
      expect(crlfCount).toBeLessThan(5);
    });

    it('does not contain tab characters (prefer spaces)', () => {
      expect(content).not.toMatch(/\t/);
    });
  });

  describe('Quick Reference section', () => {
    it('includes Service Method, Controller Endpoint, and Module Structure snippets', () => {
      expect(content).toMatch(/`\`\`typescript[\s\S]*async methodName\(param: Type\): Promise<ReturnType>[\s\S]*\`\`\`/m);
      expect(content).toMatch(/@Post\(\)[\s\S]*@HttpCode\(HttpStatus\.CREATED\)/m);
      expect(content).toMatch(/@Module\({[\s\S]*controllers: \[FeatureController\],[\s\S]*\}\)[\s\S]*export class FeatureModule/m);
    });
  });
});