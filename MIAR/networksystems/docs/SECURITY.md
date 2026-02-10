# Security Scanning & Best Practices

Comprehensive security documentation for the MIAR platform, including automated scanning, vulnerability management, and security best practices.

## Table of Contents

- [Overview](#overview)
- [Security Scanning Tools](#security-scanning-tools)
- [CI/CD Security Integration](#cicd-security-integration)
- [Vulnerability Management](#vulnerability-management)
- [Security Best Practices](#security-best-practices)
- [Incident Response](#incident-response)
- [Compliance & Auditing](#compliance--auditing)

## Overview

The MIAR platform implements multiple layers of security scanning and monitoring to ensure the safety and integrity of our application and user data.

### Security Goals

- **Proactive Detection**: Identify vulnerabilities before deployment
- **Continuous Monitoring**: Ongoing security assessment
- **Rapid Response**: Quick remediation of security issues
- **Compliance**: Meet industry security standards
- **Defense in Depth**: Multiple security layers

### Security Tools Stack

| Tool | Purpose | Frequency |
|------|---------|-----------|
| npm audit | Dependency vulnerabilities | Every commit |
| Snyk | Advanced vulnerability scanning | Every commit |
| OWASP Dependency Check | Known CVE detection | Daily |
| ESLint Security Plugin | Code security issues | Every commit |
| Lighthouse | Security headers & HTTPS | Every deployment |
| GitHub Dependabot | Automated dependency updates | Continuous |

## Security Scanning Tools

### 1. NPM Audit

Built-in Node.js security scanner for known vulnerabilities.

#### Usage

```bash
# Scan for vulnerabilities
npm audit

# Scan with specific threshold
npm audit --audit-level=moderate

# Auto-fix vulnerabilities
npm audit fix

# Detailed report
npm audit --json > audit-report.json
```

#### Severity Levels

- **Critical**: Immediate action required
- **High**: Fix within 7 days
- **Moderate**: Fix within 30 days
- **Low**: Fix when possible

#### Configuration

Set threshold in CI/CD (`.github/workflows/ci.yml`):

```yaml
- name: Security audit
  run: npm audit --audit-level=moderate
```

This fails the build if moderate or higher vulnerabilities are found.

#### Interpreting Results

```bash
# Example output
found 3 vulnerabilities (1 moderate, 2 high)

# View details
npm audit

# Fix automatically fixable issues
npm audit fix

# For issues requiring manual review
npm audit fix --force
```

### 2. Snyk

Advanced security scanning with detailed vulnerability intelligence.

#### Setup

1. **Sign up**: Create account at [snyk.io](https://snyk.io)
2. **Get API Token**: Settings → API Token
3. **Add to GitHub Secrets**: `SNYK_TOKEN`

#### Features

- **Vulnerability Database**: Comprehensive CVE database
- **Fix PRs**: Automated pull requests with fixes
- **License Compliance**: Open source license checking
- **Container Scanning**: Docker image scanning
- **IaC Scanning**: Infrastructure as Code security

#### CI/CD Integration

In `.github/workflows/ci.yml`:

```yaml
- name: Run Snyk security scan
  uses: snyk/actions/node@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
  with:
    args: --severity-threshold=high
```

#### Local Usage

```bash
# Install Snyk CLI
npm install -g snyk

# Authenticate
snyk auth

# Test for vulnerabilities
snyk test

# Monitor project
snyk monitor

# View web dashboard
open https://app.snyk.io
```

#### Snyk Configuration

Create `.snyk` file for custom configuration:

```yaml
# Snyk policy file
version: v1.22.0
ignore:
  # Ignore specific vulnerability
  'SNYK-JS-MINIMIST-559764':
    - '*':
        reason: 'No upgrade path available, low risk'
        expires: '2025-12-31'
patch: {}
```

### 3. OWASP Dependency Check

Identifies project dependencies with known CVE vulnerabilities.

#### Setup

```bash
# Install via GitHub Action
- name: OWASP Dependency Check
  uses: dependency-check/Dependency-Check_Action@main
  with:
    project: 'MIAR Platform'
    path: '.'
    format: 'HTML'
```

#### Features

- **CVE Database**: National Vulnerability Database (NVD)
- **Multiple Formats**: HTML, JSON, XML, CSV reports
- **Suppression**: Ignore false positives
- **Custom Rules**: Define custom vulnerability rules

#### Configuration

Create `dependency-check-suppression.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<suppressions xmlns="https://jeremylong.github.io/DependencyCheck/dependency-suppression.1.3.xsd">
    <!-- Suppress false positive -->
    <suppress>
        <notes><![CDATA[
        False positive - not actually used in production
        ]]></notes>
        <packageUrl regex="true">^pkg:npm/example-package@.*$</packageUrl>
        <cve>CVE-2021-12345</cve>
    </suppress>
</suppressions>
```

### 4. ESLint Security Plugin

Static code analysis for security issues.

#### Installation

```bash
npm install --save-dev eslint-plugin-security
```

#### Configuration

In `.eslintrc.json`:

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:security/recommended"
  ],
  "plugins": ["security"],
  "rules": {
    "security/detect-object-injection": "warn",
    "security/detect-non-literal-regexp": "warn",
    "security/detect-unsafe-regex": "error",
    "security/detect-buffer-noassert": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-no-csrf-before-method-override": "error",
    "security/detect-possible-timing-attacks": "warn"
  }
}
```

#### Common Detections

- SQL injection risks
- Command injection risks
- Unsafe regular expressions
- Non-literal require()
- Object injection
- Timing attack vulnerabilities

### 5. Lighthouse Security

Tests for security headers and HTTPS configuration.

#### CI/CD Integration

```yaml
- name: Lighthouse security audit
  uses: treosh/lighthouse-ci-action@v9
  with:
    urls: |
      https://staging.miar-platform.com
    uploadArtifacts: true
```

#### Security Checks

- HTTPS enforcement
- HTTP Strict Transport Security (HSTS)
- Content Security Policy (CSP)
- X-Content-Type-Options
- X-Frame-Options
- Permissions-Policy

## CI/CD Security Integration

### GitHub Actions Workflow

Security scanning is integrated into every commit and pull request.

#### Security Job

```yaml
security:
  name: Security Scanning
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install dependencies
      run: npm ci

    # 1. NPM Audit
    - name: Run npm audit
      run: npm audit --audit-level=moderate
      continue-on-error: true

    # 2. Snyk Scan
    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high
      continue-on-error: true

    # 3. OWASP Dependency Check
    - name: OWASP Dependency Check
      uses: dependency-check/Dependency-Check_Action@main
      with:
        project: 'MIAR Platform'
        path: '.'
        format: 'HTML'
      continue-on-error: true

    - name: Upload security reports
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: security-reports
        path: |
          dependency-check-report.html
          snyk-report.json
```

### Security Gates

#### Blocking Issues

Build fails on:
- Critical vulnerabilities
- High vulnerabilities (configurable)
- Known exploits in dependencies

#### Non-Blocking Issues

Build continues with warnings on:
- Moderate vulnerabilities
- Low vulnerabilities
- License compliance issues

Configure in workflow:

```yaml
- name: Security check
  run: npm audit --audit-level=high  # Blocks on high+
  continue-on-error: false  # Fail build

- name: License check
  run: npm audit --audit-level=low
  continue-on-error: true  # Warning only
```

## Vulnerability Management

### Workflow

1. **Detection**: Automated scanning identifies vulnerability
2. **Triage**: Review severity, impact, and exploitability
3. **Prioritization**: Assign priority based on risk
4. **Remediation**: Update dependencies or apply patches
5. **Verification**: Re-scan to confirm fix
6. **Documentation**: Log issue and resolution

### Priority Levels

| Priority | Severity | Response Time | Example |
|----------|----------|---------------|---------|
| P0 | Critical | Immediate (< 4 hours) | Remote code execution |
| P1 | High | 1-3 days | SQL injection |
| P2 | Moderate | 1-2 weeks | XSS vulnerability |
| P3 | Low | 30 days | Information disclosure |

### Remediation Strategies

#### 1. Update Dependencies

```bash
# Update specific package
npm update package-name

# Update to latest within semver
npm update

# Update to absolute latest (breaking)
npm install package-name@latest
```

#### 2. Apply Patches

For vulnerabilities without upstream fixes:

```bash
# Install patch-package
npm install --save-dev patch-package

# Modify node_modules/package
# Then create patch
npx patch-package package-name

# Add to package.json
"scripts": {
  "postinstall": "patch-package"
}
```

#### 3. Find Alternatives

```bash
# Search for alternatives
npm search alternative-package

# Compare packages
npm info package-name
npm info alternative-package
```

#### 4. Vendor Code

For unmaintained dependencies:

```bash
# Copy to local directory
cp -r node_modules/package ./vendor/package

# Update imports
# import from './vendor/package' instead
```

### GitHub Dependabot

Automated dependency updates and security patches.

#### Configuration

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  # NPM dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "security-team"
    assignees:
      - "devops-lead"
    labels:
      - "dependencies"
      - "security"
    # Auto-merge minor updates
    versioning-strategy: increase

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "monthly"
```

#### Dependabot Alerts

Enable in GitHub:
1. Settings → Security & analysis
2. Enable "Dependabot alerts"
3. Enable "Dependabot security updates"
4. Enable "Dependabot version updates"

## Security Best Practices

### 1. Dependency Management

```bash
# Pin exact versions in package.json
"dependencies": {
  "next": "14.2.5",  # Not ^14.2.5
  "react": "18.3.1"
}

# Use package-lock.json
npm ci  # Not npm install

# Audit regularly
npm audit
npm audit fix
```

### 2. Environment Variables

```bash
# Never commit secrets
.env
.env.local
.env.*.local

# Use environment variables
DATABASE_URL=
API_KEY=
SECRET_KEY=

# Validate in code
if (!process.env.API_KEY) {
  throw new Error('API_KEY is required');
}
```

### 3. Input Validation

```typescript
// Sanitize user input
import DOMPurify from 'isomorphic-dompurify';

const clean = DOMPurify.sanitize(userInput);

// Validate with Zod
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  age: z.number().min(18).max(120),
});

const result = schema.safeParse(userInput);
```

### 4. Database Security

```typescript
// Use parameterized queries
const user = await prisma.user.findUnique({
  where: { id: userId },  // Safe
});

// Never use string concatenation
// DANGEROUS:
// await prisma.$executeRaw(`SELECT * FROM users WHERE id = ${userId}`);

// Use Prisma's type-safe queries
const users = await prisma.user.findMany({
  where: {
    email: {
      contains: searchTerm,  // Safe
    },
  },
});
```

### 5. Authentication & Authorization

```typescript
// Use NextAuth.js
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Check permissions
  if (!session.user.role.includes('admin')) {
    return new Response('Forbidden', { status: 403 });
  }

  // Proceed with authorized action
}
```

### 6. Security Headers

Configure in `next.config.js`:

```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### 7. Rate Limiting

```typescript
// Use rate limiting for API routes
import rateLimit from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function POST(request: Request) {
  try {
    await limiter.check(request, 10); // 10 requests per minute
  } catch {
    return new Response('Too Many Requests', { status: 429 });
  }

  // Process request
}
```

### 8. Error Handling

```typescript
// Never expose internal errors to users
try {
  await dangerousOperation();
} catch (error) {
  // Log full error internally
  logger.error('Operation failed', { error, context });

  // Return generic message to user
  return new Response(
    'An error occurred. Please try again later.',
    { status: 500 }
  );
}
```

## Incident Response

### Response Procedure

1. **Detection**: Alert received from monitoring or scanning
2. **Assessment**: Evaluate severity and impact
3. **Containment**: Isolate affected systems
4. **Eradication**: Remove vulnerability
5. **Recovery**: Restore normal operations
6. **Post-Incident**: Review and improve

### Security Incident Template

```markdown
# Security Incident Report

**Date**: 2025-01-16
**Severity**: [Critical/High/Moderate/Low]
**Status**: [Open/In Progress/Resolved]

## Summary
Brief description of the incident

## Impact
- Systems affected
- Data exposed
- Users impacted

## Timeline
- 10:00 - Incident detected
- 10:15 - Team notified
- 10:30 - Containment measures applied
- 11:00 - Vulnerability patched
- 12:00 - Systems restored

## Root Cause
What caused the vulnerability

## Resolution
Steps taken to fix the issue

## Prevention
Measures to prevent recurrence

## Action Items
- [ ] Update dependencies
- [ ] Enhance monitoring
- [ ] Document findings
```

### Contact Information

- **Security Team**: security@miar-platform.com
- **On-Call Engineer**: [PagerDuty/Phone]
- **Management**: [Contact Info]

## Compliance & Auditing

### Security Audits

**Frequency**: Quarterly

**Checklist**:
- [ ] Review npm audit results
- [ ] Check Snyk vulnerability reports
- [ ] Review OWASP Dependency Check
- [ ] Audit environment variables
- [ ] Review access logs
- [ ] Test backup restoration
- [ ] Verify security headers
- [ ] Review authentication logs
- [ ] Check rate limiting effectiveness
- [ ] Review incident response procedures

### Compliance Standards

- **OWASP Top 10**: Follow security best practices
- **GDPR**: Data protection and privacy (if applicable)
- **SOC 2**: Security and availability controls
- **ISO 27001**: Information security management

### Security Metrics

Track and report:

| Metric | Target | Current |
|--------|--------|---------|
| Vulnerability resolution time | < 7 days | - |
| Critical vulnerabilities | 0 | - |
| Security audit pass rate | 100% | - |
| Dependency freshness | < 30 days old | - |
| Test coverage | > 80% | - |

## Related Documentation

- [CI/CD Pipeline](../.github/workflows/ci.yml)
- [Backup Strategy](./BACKUP_STRATEGY.md)
- [Monitoring Guide](./MONITORING.md)
- [Environment Configuration](../README.md)

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [npm Security Best Practices](https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities)
- [Snyk Documentation](https://docs.snyk.io/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
