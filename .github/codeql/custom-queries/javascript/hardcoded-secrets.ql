/**
 * @name Hardcoded Secrets
 * @description Hardcoded secrets or credentials in source code can lead to security vulnerabilities.
 * @kind problem
 * @problem.severity error
 * @precision medium
 * @id js/hardcoded-secrets
 * @tags security
 *       external/cwe/cwe-798
 */

import javascript

/**
 * Identifies variable declarations or assignments that may contain secrets
 */
predicate isSensitiveAssignment(DataFlow::Node node) {
  exists(DataFlow::PropWrite propWrite |
    propWrite.getPropertyName().regexpMatch("(?i).*(secret|key|password|token|credential|auth).*") and
    propWrite.getRhs() = node
  )
  or
  exists(VariableDeclarator decl |
    decl.getName().regexpMatch("(?i).*(secret|key|password|token|credential|auth).*") and
    decl.getInit().flow() = node
  )
}

/**
 * Identifies literals that look like secrets
 */
predicate isSecretLiteral(StringLiteral literal) {
  // Match alphanumeric strings of moderate length that may be secrets
  literal.getValue().regexpMatch("[A-Za-z0-9_\\-]{8,}") and
  
  not (
    // Skip likely non-sensitive literals
    literal.getValue().regexpMatch("(?i)^(true|false|null|undefined|localhost|development|production|staging)$") or
    // Skip URLs without credentials
    literal.getValue().regexpMatch("^https?://[^:@/]+")
  )
}

from DataFlow::Node source
where
  isSensitiveAssignment(source) and
  (
    exists(StringLiteral literal | 
      literal.flow() = source and 
      isSecretLiteral(literal)
    )
  )
select source, "This assignment may contain a hardcoded secret or credential." 