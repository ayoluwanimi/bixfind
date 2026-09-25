// Automation Workflow Engine
// Creates and executes multi-step automation workflows

export interface WorkflowStep {
  id: string
  name: string
  action: (context: WorkflowContext) => Promise<WorkflowResult>
  onError?: (error: Error, context: WorkflowContext) => Promise<WorkflowResult>
  dependencies?: string[]
  retryCount?: number
  timeoutMs?: number
}

export interface WorkflowContext {
  [key: string]: any
}

export interface WorkflowResult {
  success: boolean
  data?: any
  error?: string
  stepId?: string
}

export interface WorkflowConfig {
  id: string
  name: string
  description?: string
  steps: WorkflowStep[]
  onComplete?: (results: WorkflowResult[], context: WorkflowContext) => Promise<void>
  onError?: (error: Error, results: WorkflowResult[], context: WorkflowContext) => Promise<void>
}

export class WorkflowEngine {
  private workflows: Map<string, WorkflowConfig> = new Map()
  private executionLog: Array<{ workflowId: string, status: string, timestamp: number, duration: number }> = []

  register(workflow: WorkflowConfig): void {
    this.workflows.set(workflow.id, workflow)
  }

  async execute(workflowId: string, context: WorkflowContext = {}): Promise<WorkflowResult[]> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow "${workflowId}" not found`)
    }

    const startTime = Date.now()
    const results: WorkflowResult[] = []
    const executedSteps = new Set<string>()

    try {
      for (const step of workflow.steps) {
        if (!this.canExecute(step, executedSteps)) {
          results.push({ success: false, error: `Dependencies not met for step: ${step.name}`, stepId: step.id })
          continue
        }

        const result = await this.executeStep(step, context)
        results.push(result)

        if (result.success) {
          executedSteps.add(step.id)
          if (result.data) {
            context[step.id] = result.data
          }
        } else {
          if (step.onError) {
            const errorResult = await step.onError(new Error(result.error || 'Unknown error'), context)
            results[results.length - 1] = errorResult
          } else {
            throw new Error(`Step "${step.name}" failed: ${result.error}`)
          }
        }
      }

      if (workflow.onComplete) {
        await workflow.onComplete(results, context)
      }

      this.logExecution(workflowId, 'success', startTime)
      return results
    } catch (error) {
      if (workflow.onError) {
        await workflow.onError(error as Error, results, context)
      }
      this.logExecution(workflowId, 'failed', startTime)
      throw error
    }
  }

  private canExecute(step: WorkflowStep, executedSteps: Set<string>): boolean {
    if (!step.dependencies || step.dependencies.length === 0) {
      return true
    }
    return step.dependencies.every(dep => executedSteps.has(dep))
  }

  private async executeStep(step: WorkflowStep, context: WorkflowContext): Promise<WorkflowResult> {
    const retries = step.retryCount || 0
    const timeout = step.timeoutMs || 30000

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Step "${step.name}" timed out after ${timeout}ms`)), timeout)
        })

        const result = await Promise.race([
          step.action(context),
          timeoutPromise
        ])

        return { success: true, data: result, stepId: step.id }
      } catch (error) {
        if (attempt === retries) {
          return { success: false, error: (error as Error).message, stepId: step.id }
        }
        await this.delay(1000 * (attempt + 1))
      }
    }

    return { success: false, error: 'Max retries exceeded', stepId: step.id }
  }

  private logExecution(workflowId: string, status: string, startTime: number): void {
    this.executionLog.push({
      workflowId,
      status,
      timestamp: Date.now(),
      duration: Date.now() - startTime
    })
  }

  getExecutionHistory(): typeof this.executionLog {
    return [...this.executionLog]
  }

  getRegisteredWorkflows(): string[] {
    return Array.from(this.workflows.keys())
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Pre-built Bixfind workflows
export const createBixfindWorkflows = (engine: WorkflowEngine): void => {
  // Workflow: Publish Website
  engine.register({
    id: 'publish-website',
    name: 'Publish Website Workflow',
    description: 'Validates, saves, and publishes a website',
    steps: [
      {
        id: 'validate',
        name: 'Validate Website Data',
        action: async (context) => {
          const website = context.websiteData
          if (!website || !website.companyName) {
            return { success: false, error: 'Company name is required' }
          }
          return { success: true, data: { validated: true } }
        }
      },
      {
        id: 'save-to-db',
        name: 'Save to Database',
        dependencies: ['validate'],
        action: async (context) => {
          try {
            const { supabase } = await import('../lib/supabase')
            const { data, error } = await supabase?.from('websites').upsert({
              ...context.websiteData,
              isPublished: true
            }, { onConflict: 'id' })
            
            if (error) throw error
            return { success: true, data }
          } catch (error) {
            return { success: false, error: (error as Error).message }
          }
        }
      },
      {
        id: 'clear-cache',
        name: 'Clear Cache',
        dependencies: ['save-to-db'],
        action: async (context) => {
          const { realtimeDb } = await import('../lib/supabase')
          realtimeDb.clearCache()
          return { success: true, data: { cacheCleared: true } }
        }
      }
    ]
  })

  // Workflow: User Onboarding
  engine.register({
    id: 'user-onboarding',
    name: 'User Onboarding Workflow',
    description: 'Creates user profile and initializes their account',
    steps: [
      {
        id: 'create-profile',
        name: 'Create User Profile',
        action: async (context) => {
          const { supabase } = await import('../lib/supabase')
          const { data, error } = await supabase?.from('users').insert({
            id: context.userId,
            email: context.email,
            name: context.name,
            role: context.role || 'user',
            createdAt: new Date().toISOString()
          })
          
          if (error) throw error
          return { success: true, data }
        }
      },
      {
        id: 'create-default-website',
        name: 'Create Default Website',
        dependencies: ['create-profile'],
        action: async (context) => {
          const { supabase } = await import('../lib/supabase')
          const { data, error } = await supabase?.from('websites').insert({
            id: `site_${context.userId}`,
            user_id: context.userId,
            company_name: `${context.name}'s Website`,
            is_published: false
          })
          
          if (error) throw error
          return { success: true, data }
        }
      }
    ]
  })

  // Workflow: Data Backup
  engine.register({
    id: 'data-backup',
    name: 'Data Backup Workflow',
    description: 'Backs up all website data to localStorage',
    steps: [
      {
        id: 'fetch-websites',
        name: 'Fetch All Websites',
        action: async () => {
          const { supabase } = await import('../lib/supabase')
          const { data, error } = await supabase?.from('websites').select('*')
          
          if (error) throw error
          return { success: true, data }
        }
      },
      {
        id: 'save-backup',
        name: 'Save Backup to LocalStorage',
        dependencies: ['fetch-websites'],
        action: async (context) => {
          if (typeof window === 'undefined') {
            return { success: false, error: 'LocalStorage not available' }
          }
          localStorage.setItem('bixfind_backup_websites', JSON.stringify(context['fetch-websites']))
          localStorage.setItem('bixfind_backup_timestamp', new Date().toISOString())
          return { success: true, data: { backupSaved: true } }
        }
      }
    ]
  })
}

export default WorkflowEngine