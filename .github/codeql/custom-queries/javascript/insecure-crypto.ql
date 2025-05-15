/**
 * @name Insecure Cryptographic Implementation
 * @description Usage of weak cryptographic algorithms or improper implementations can lead to security vulnerabilities.
 * @kind problem
 * @problem.severity error
 * @precision high
 * @id js/insecure-crypto
 * @tags security
 *       external/cwe/cwe-327
 */

import javascript

/**
 * Identifies calls to crypto functions with insecure algorithms
 */
predicate isInsecureCryptoCall(CallExpr call) {
  // Node.js crypto module uses
  exists(string methodName |
    methodName = call.getCalleeName() and
    (
      // Detect MD5 usage
      methodName.regexpMatch("(?i).*md5.*") or
      methodName.regexpMatch("(?i).*sha1.*") or
      
      // Insecure crypto constructors
      (
        methodName = "createHash" or
        methodName = "createCipheriv" or
        methodName = "createDecipher"
      ) and
      (
        exists(StringLiteral algo | 
          algo = call.getArgument(0) and
          (
            algo.getValue().regexpMatch("(?i).*(md5|md4|md2|sha1|des|rc4|blowfish).*") or
            algo.getValue().regexpMatch("(?i).*(ecb).*") // ECB mode
          )
        )
      )
    )
  )
  or
  // Browser crypto API uses
  exists(MethodCallExpr mce, string propertyName |
    propertyName = mce.getMethodName() and
    (
      propertyName = "subtle" and
      exists(MethodCallExpr subtleCall | 
        subtleCall.getReceiver() = mce and 
        subtleCall.getMethodName() = "encrypt" and
        exists(ObjectExpr obj | 
          obj = subtleCall.getArgument(0) and
          exists(Property p | 
            p = obj.getAProperty() and
            p.getName() = "name" and
            exists(StringLiteral algo | 
              algo = p.getInit() and
              algo.getValue().regexpMatch("(?i).*(rc4|des|aes-cbc).*")
            )
          )
        )
      )
    )
  )
}

/**
 * Identifies usage of Math.random() for security-sensitive operations
 */
predicate isInsecureRandomCall(CallExpr call) {
  exists(PropertyAccess prop | 
    prop.getPropertyName() = "random" and
    prop.getBase().toString() = "Math" and
    call.getCallee() = prop
  )
}

from Expr insecureExpr, string message
where
  (
    insecureExpr instanceof CallExpr and
    isInsecureCryptoCall(insecureExpr) and
    message = "Using potentially insecure cryptographic algorithm or mode."
  ) or (
    insecureExpr instanceof CallExpr and
    isInsecureRandomCall(insecureExpr) and
    message = "Using Math.random() for security-sensitive operation. Consider using crypto.getRandomValues() instead."
  )
select insecureExpr, message 