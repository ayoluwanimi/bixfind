# Bixfind Agent - How to Use

The Bixfind Agent provides 4 main capabilities built directly into your codebase. These work without any external AI plugins.

---

## 🚀 Quick Start

Import the Agent in your code or use in browser console:

```typescript
import { Agent } from './lib/agent'
```

---

## 1. 🎨 UI Component Generator

Generates beautiful, consistent UI components based on Bixfind's design system.

### Usage

```typescript
// List available component templates
Agent.ui.list()
// Returns: ['Card', 'Button', 'Input', 'Modal', 'Table']

// Generate a specific component
const result = Agent.ui.generate('Button', {
  type: 'Button',
  props: { label: 'Click Me', variant: 'primary' }
})

console.log(result.name)  // 'Button.tsx'
console.log(result.code)  // The full component code
console.log(result.path)  // './components/Button.tsx'
```

### Available Components
| Component | Description |
|-----------|-------------|
| `Card` | Content card with title, description, badge |
| `Button` | Multi-variant button (primary, secondary, outline, ghost) |
| `Input` | Form input with label, validation, error states |
| `Modal` | Accessible modal dialog with backdrop blur |
| `Table` | Data table with custom column rendering |

---

## 2. 🔍 Code Reviewer

Scans codebase for security vulnerabilities and quality issues.

### Usage

**From terminal:**
```bash
npm run code-review
```

**From code:**
```typescript
const results = await Agent.codeReview.run('./app')
console.log(results.issues.length + ' issues found')
console.log(results.report)
```

### Checks Performed
| Check | Severity | Description |
|-------|----------|-------------|
| Hardcoded Secrets | 🔴 Critical | Detects passwords, API keys in code |
| eval() Usage | 🟠 High | Warns about dangerous eval() calls |
| innerHTML | 🟠 High | XSS vulnerability risk |
| SQL Injection | 🔴 Critical | Unsafe query concatenation |
| Console Logs | 🟢 Low | Debug statements in production |
| Large Files | 🟡 Medium | Files over 300 lines |
| Missing Types | 🟢 Low | "any" type usage |

---

## 3. ⚡ Workflow Engine

Creates and executes multi-step automation workflows with dependency management.

### Pre-built Workflows

| Workflow | Description |
|----------|-------------|
| `publish-website` | Validates, saves, and publishes a website |
| `user-onboarding` | Creates user profile + default website |
| `data-backup` | Backs up all data to localStorage |

### Usage

```typescript
// List available workflows
Agent.workflow.list()

// Execute a workflow
const results = await Agent.workflow.execute('publish-website', {
  websiteData: {
    id: 'site_123',
    companyName: 'My Business',
    category: 'Pharmacy',
    isPublished: true
  }
})

// View execution history
const history = Agent.workflow.history()

// Create custom workflow
const { WorkflowEngine } = await import('./lib/workflow-engine')
const engine = Agent.workflow.getEngine()

engine.register({
  id: 'my-workflow',
  name: 'My Custom Workflow',
  steps: [
    {
      id: 'step1',
      name: 'First Step',
      action: async (context) => {
        // Do something
        return { success: true, data: 'result' }
      }
    },
    {
      id: 'step2',
      name: 'Second Step',
      dependencies: ['step1'], // Runs after step1
      action: async (context) => {
        // Use data from step1
        console.log(context.step1)
        return { success: true }
      }
    }
  ]
})

await Agent.workflow.execute('my-workflow')
```

---

## 4. 🔒 Security

Comprehensive security utilities for input validation, sanitization, and auditing.

### Usage

```typescript
// Audit logging
Agent.security.auditLog('login', 'user123', 'Test User', 'User logged in successfully')

// View audit logs
const logs = Agent.security.getAuditLogs()

// Input sanitization
Agent.security.sanitize.email('  Test@Email.COM  ')  // 'test@email.com'
Agent.security.sanitize.string('  Hello World  ', 50) // 'Hello World'
Agent.security.sanitize.html('<script>alert("xss")</script>') // ''

// Validation
Agent.security.validateEmail('test@example.com')  // true
Agent.security.validatePassword('Strong@123')     // { valid: true, errors: [] }

// Security headers (for API routes)
const headers = Agent.security.getHeaders()
```

---

## 🚀 Quick Actions

Combined workflows for common tasks:

```typescript
// Publish a website (validates → saves → clears cache)
await Agent.actions.publishWebsite({ id: 'site_123', companyName: 'My Biz' })

// Onboard a new user (creates profile → creates default website)
await Agent.actions.onboardUser({
  userId: 'user_123',
  email: 'user@example.com',
  name: 'John Doe'
})

// Backup all data
await Agent.actions.backupData()

// Run full security audit
await Agent.actions.securityAudit()
```

---

## 📁 File Locations

| Capability | File |
|-----------|------|
| UI Generator | `lib/ui-generator.ts` |
| Code Reviewer | `scripts/code-review.js` |
| Workflow Engine | `lib/workflow-engine.ts` |
| Security | `lib/security.ts` |
| Agent Interface | `lib/agent.ts` |

---

## 💡 Example: Full Workflow in Action

```typescript
import { Agent } from './lib/agent'

async function setupNewProvider() {
  // 1. Security check
  Agent.security.auditLog('provider_signup', 'new_user', 'New Provider', 'Creating provider account')
  
  // 2. Onboard user
  await Agent.actions.onboardUser({
    userId: 'provider_123',
    email: 'provider@business.com',
    name: 'Business Name',
    role: 'provider'
  })
  
  // 3. Run code review to ensure no issues
  await Agent.codeReview.run('./app')
  
  console.log('✅ Provider setup complete!')
}
```