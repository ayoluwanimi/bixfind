// Code Quality & Security Reviewer
// Scans codebase for issues, vulnerabilities, and best practices violations

const fs = require('fs')
const path = require('path')

const severity = {
  CRITICAL: '🔴 CRITICAL',
  HIGH: '🟠 HIGH',
  MEDIUM: '🟡 MEDIUM',
  LOW: '🟢 LOW',
  INFO: '🔵 INFO'
}

const securityRules = [
  {
    name: 'Hardcoded Secrets',
    pattern: /(password|secret|key|token|api_key)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    severity: severity.CRITICAL,
    message: 'Possible hardcoded secret detected. Use environment variables instead.'
  },
  {
    name: 'Eval Usage',
    pattern: /eval\s*\(/g,
    severity: severity.HIGH,
    message: 'Avoid eval() - can execute arbitrary code. Use safer alternatives.'
  },
  {
    name: 'InnerHTML Usage',
    pattern: /\.innerHTML\s*=/g,
    severity: severity.HIGH,
    message: 'Avoid innerHTML - vulnerable to XSS. Use textContent or React dangerouslySetInnerHTML with sanitization.'
  },
  {
    name: 'Console Log in Production',
    pattern: /console\.(log|warn|error|debug)\(/g,
    severity: severity.LOW,
    message: 'Remove console statements before production deployment.'
  },
  {
    name: 'Missing Error Handling',
    pattern: /async\s+\w+\([^)]*\)\s*{[^}]*await[^}]*}\s*$/gm,
    severity: severity.MEDIUM,
    message: 'Ensure async functions have try/catch blocks for error handling.'
  },
  {
    name: 'SQL Injection Risk',
    pattern: /query\s*\(\s*`[^`]*\$\{[^}]+\}[^`]*`\s*\)/g,
    severity: severity.CRITICAL,
    message: 'Possible SQL injection. Use parameterized queries.'
  },
  {
    name: 'Missing Input Validation',
    pattern: /req\.(body|params|query)\.(\w+)/g,
    severity: severity.MEDIUM,
    message: 'Ensure all user input is validated before use.'
  },
  {
    name: 'TODO/FIXME Comments',
    pattern: /(TODO|FIXME|HACK|XXX|BUG)/gi,
    severity: severity.INFO,
    message: 'Outstanding TODO or FIXME comment found.'
  }
]

const qualityRules = [
  {
    name: 'Large File',
    check: (content, filePath) => content.split('\n').length > 300,
    severity: severity.MEDIUM,
    message: 'File exceeds 300 lines. Consider splitting into smaller modules.'
  },
  {
    name: 'Long Function',
    check: (content, filePath) => {
    const functionPattern = /(?:function|const|let|var)\s+\w+\s*\(.*?\)\s*{[^}]*?return[^}]*?}/gs
    const matches = content.match(functionPattern) || []
    return matches.some(fn => fn.split('\n').length > 50)
  },
    severity: severity.MEDIUM,
    message: 'Function exceeds 50 lines. Consider refactoring into smaller functions.'
  },
  {
    name: 'Missing TypeScript Types',
    check: (content, filePath) => {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      return content.includes('any') && !content.includes(': any //')
    }
    return false
  },
    severity: severity.LOW,
    message: 'Avoid using "any" type. Define proper TypeScript interfaces.'
  },
  {
    name: 'Unused Imports',
    check: (content, filePath) => {
    const importLines = content.match(/import\s+.*?from\s+['"].*?['"]/g) || []
    const issues = []
    importLines.forEach(imp => {
      const match = imp.match(/import\s+{([^}]+)}/)
      if (match) {
        const imports = match[1].split(',').map(i => i.trim())
        imports.forEach(impName => {
          if (!content.includes(impName) || content.split(impName).length <= 2) {
            issues.push(`Possible unused import: ${impName}`)
          }
        })
      }
    })
    return issues.length > 0 ? issues : false
  },
    severity: severity.LOW,
    message: 'Possible unused imports detected.'
  }
]

function scanDirectory(dirPath, ignorePatterns = ['node_modules', '.next', '.git', 'out']) {
  const results = []
  
  function scan(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name)
      
      if (ignorePatterns.some(p => entry.name.includes(p))) continue
      
      if (entry.isDirectory()) {
        scan(fullPath)
      } else if (entry.name.match(/\.(ts|tsx|js|jsx)$/)) {
        const content = fs.readFileSync(fullPath, 'utf8')
        const fileResults = scanFile(content, fullPath)
        results.push(...fileResults)
      }
    }
  }
  
  scan(dirPath)
  return results
}

function scanFile(content, filePath) {
  const issues = []
  const relativePath = path.relative(process.cwd(), filePath)
  
  // Run security rules
  securityRules.forEach(rule => {
    const matches = content.match(rule.pattern)
    if (matches && matches.length > 0) {
      matches.forEach((match, idx) => {
        const lineNumber = content.substring(0, content.indexOf(match, idx > 0 ? content.indexOf(match, idx - 1) + 1 : 0)).split('\n').length
        issues.push({
          file: relativePath,
          line: lineNumber,
          severity: rule.severity,
          rule: rule.name,
          message: rule.message,
          match: match.trim().substring(0, 100)
        })
      })
    }
  })
  
  // Run quality rules
  qualityRules.forEach(rule => {
    const result = rule.check(content, filePath)
    if (result) {
      const message = Array.isArray(result) ? result.join(', ') : rule.message
      issues.push({
        file: relativePath,
        line: 0,
        severity: rule.severity,
        rule: rule.name,
        message: message,
        match: ''
      })
    }
  })
  
  return issues
}

function formatReport(issues) {
  const severityOrder = {
    '🔴 CRITICAL': 0,
    '🟠 HIGH': 1,
    '🟡 MEDIUM': 2,
    '🟢 LOW': 3,
    '🔵 INFO': 4
  }
  
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
  
  const summary = {
    total: issues.length,
    critical: issues.filter(i => i.severity === severity.CRITICAL).length,
    high: issues.filter(i => i.severity === severity.HIGH).length,
    medium: issues.filter(i => i.severity === severity.MEDIUM).length,
    low: issues.filter(i => i.severity === severity.LOW).length,
    info: issues.filter(i => i.severity === severity.INFO).length
  }
  
  let report = `
╔═══════════════════════════════════════════════════════════╗
║           CODE QUALITY & SECURITY REPORT                  ║
╚═══════════════════════════════════════════════════════════╝

📊 Summary:
  🔴 Critical: ${summary.critical}
  🟠 High:     ${summary.high}
  🟡 Medium:   ${summary.medium}
  🟢 Low:      ${summary.low}
  🔵 Info:     ${summary.info}
  ─────────────────────────────────
  Total:       ${summary.total}

`
  
  issues.forEach((issue, idx) => {
    report += `
${idx + 1}. ${issue.severity} - ${issue.rule}
   File: ${issue.file}:${issue.line || '?'}
   Issue: ${issue.message}
${issue.match ? `   Code: \`${issue.match}\`` : ''}
   ${'─'.repeat(50)}
`
  })
  
  return report
}

// CLI Usage
if (require.main === module) {
  const targetDir = process.argv[2] || './app'
  const ignorePatterns = ['node_modules', '.next', '.git', 'out', 'functions/node_modules']
  
  console.log('🔍 Scanning codebase for quality and security issues...\n')
  
  const issues = scanDirectory(targetDir, ignorePatterns)
  
  if (issues.length === 0) {
    console.log('✅ No issues found! Code quality looks good.')
  } else {
    const report = formatReport(issues)
    console.log(report)
    
    // Exit with error code if critical/high issues found
    const hasCritical = issues.some(i => i.severity === severity.CRITICAL || i.severity === severity.HIGH)
    process.exit(hasCritical ? 1 : 0)
  }
}

module.exports = { scanDirectory, scanFile, formatReport, securityRules, qualityRules, severity }