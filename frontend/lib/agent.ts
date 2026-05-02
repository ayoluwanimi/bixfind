// Agent Interface - Central entry point for all AI capabilities
// Call these functions to use the different capabilities

import { generateComponent, getAvailableComponents } from './ui-generator'
import { WorkflowEngine, createBixfindWorkflows, WorkflowContext } from './workflow-engine'
import { auditLogger, securityHeaders, cspHeaders, sanitizeInput } from './security'

// Initialize workflow engine
const workflowEngine = new WorkflowEngine()
createBixfindWorkflows(workflowEngine)

export const Agent = {
  // ──────────────────────────────────────────────
  // 🎨 UI COMPONENT GENERATOR
  // Call: Agent.ui.generateComponent('Button', { type: 'Button', props: { label: 'Click Me', variant: 'primary' } })
  // Call: Agent.ui.getAvailableComponents()
  // ──────────────────────────────────────────────
  ui: {
    generate: (type: string, config: any) => {
      console.log(`🎨 Generating ${type} component...`)
      const result = generateComponent(type, config)
      console.log(`✅ Generated ${result.name} -> ${result.path}`)
      return result
    },
    list: () => {
      const components = getAvailableComponents()
      console.log(`📦 Available components: ${components.join(', ')}`)
      return components
    }
  },

  // ──────────────────────────────────────────────
  // 🔍 CODE REVIEWER
  // Call: Agent.codeReview.run('./app')
  // ──────────────────────────────────────────────
  codeReview: {
    run: async (targetDir: string = './app') => {
      console.log('🔍 Starting code review...')
      const { scanDirectory, formatReport } = await import('../scripts/code-review')
      const ignorePatterns = ['node_modules', '.next', '.git', 'out', 'functions/node_modules']
      const issues = scanDirectory(targetDir, ignorePatterns)
      
      if (issues.length === 0) {
        console.log('✅ No issues found!')
        return { success: true, issues: [] }
      }
      
      const report = formatReport(issues)
      console.log(report)
      return { success: true, issues, report }
    }
  },

  // ──────────────────────────────────────────────
  // ⚡ WORKFLOW ENGINE
  // Call: Agent.workflow.execute('publish-website', { websiteData: {...} })
  // Call: Agent.workflow.execute('user-onboarding', { userId: '123', email: 'test@test.com', name: 'Test' })
  // Call: Agent.workflow.execute('data-backup')
  // Call: Agent.workflow.list()
  // ──────────────────────────────────────────────
  workflow: {
    execute: async (workflowId: string, context: WorkflowContext = {}) => {
      console.log(`⚡ Executing workflow: ${workflowId}`)
      const results = await workflowEngine.execute(workflowId, context)
      console.log(`✅ Workflow completed: ${workflowId}`)
      return results
    },
    list: () => {
      const workflows = workflowEngine.getRegisteredWorkflows()
      console.log(`📋 Registered workflows: ${workflows.join(', ')}`)
      return workflows
    },
    history: () => {
      return workflowEngine.getExecutionHistory()
    },
    getEngine: () => workflowEngine
  },

  // ──────────────────────────────────────────────
  // 🔒 SECURITY
  // Call: Agent.security.auditLog('login', 'user123', 'Test User', 'User logged in')
  // Call: Agent.security.getHeaders()
  // Call: Agent.security.sanitize.email('Test@Email.COM ')
  // ──────────────────────────────────────────────
  security: {
    auditLog: (action: string, userId: string, userName: string, details: string) => {
      return auditLogger.log(action, userId, userName, details)
    },
    getAuditLogs: () => auditLogger.getLogs(),
    clearAuditLogs: () => auditLogger.clearLogs(),
    getHeaders: () => ({ ...securityHeaders, ...cspHeaders }),
    sanitize: {
      string: (input: string, maxLength?: number) => sanitizeInput.string(input, maxLength),
      email: (input: string) => sanitizeInput.email(input),
      url: (input: string) => sanitizeInput.url(input),
      html: (input: string) => sanitizeInput.html(input)
    },
    validateEmail: (email: string) => {
      const { validateEmail } = require('./security')
      return validateEmail(email)
    },
    validatePassword: (password: string) => {
      const { validatePassword } = require('./security')
      return validatePassword(password)
    },
    validateFile: (file: File, options?: any) => {
      const { validateFile } = require('./security')
      return validateFile(file, options || {})
    }
  },

  // ──────────────────────────────────────────────
  // 🚀 QUICK ACTIONS
  // Combined workflows for common tasks
  // ──────────────────────────────────────────────
  actions: {
    publishWebsite: async (websiteData: any) => {
      console.log('🚀 Publishing website...')
      await Agent.workflow.execute('publish-website', { websiteData })
      console.log('✅ Website published successfully!')
    },

    onboardUser: async (userData: { userId: string; email: string; name: string; role?: string }) => {
      console.log('👤 Onboarding new user...')
      await Agent.workflow.execute('user-onboarding', userData)
      console.log('✅ User onboarded successfully!')
    },

    backupData: async () => {
      console.log('💾 Creating backup...')
      await Agent.workflow.execute('data-backup')
      console.log('✅ Backup created successfully!')
    },

    securityAudit: async () => {
      console.log('🔒 Running security audit...')
      const headers = Agent.security.getHeaders()
      console.log('Security headers configured:')
      console.log(headers)
      
      const review = await Agent.codeReview.run('./app')
      return { headers, review }
    }
  }
}

// Export for use in console or other modules
if (typeof window !== 'undefined') {
  ;(window as any).Agent = Agent
  console.log('🤖 Bixfind Agent initialized! Type "Agent" in console to see available commands.')
}

export default Agent