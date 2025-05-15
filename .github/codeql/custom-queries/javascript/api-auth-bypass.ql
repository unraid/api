/**
 * @name Potential API Authorization Bypass
 * @description Functions that process API requests without verifying authorization may lead to security vulnerabilities.
 * @kind problem
 * @problem.severity error
 * @precision medium
 * @id js/api-auth-bypass
 * @tags security
 *       external/cwe/cwe-285
 */

import javascript

/**
 * Identifies functions that appear to handle API requests
 */
predicate isApiHandler(Function f) {
  exists(f.getAParameter()) and
  (
    f.getName().regexpMatch("(?i).*(api|handler|controller|resolver|endpoint).*") or
    exists(CallExpr call |
      call.getCalleeName().regexpMatch("(?i).*(get|post|put|delete|patch).*") and
      call.getArgument(1) = f
    )
  )
}

/**
 * Identifies expressions that appear to perform authorization checks
 */
predicate isAuthCheck(DataFlow::Node node) {
  exists(CallExpr call |
    call.getCalleeName().regexpMatch("(?i).*(authorize|authenticate|isAuth|checkAuth|verifyAuth|hasPermission|isAdmin|canAccess).*") and
    call.flow().getASuccessor*() = node
  )
}

from Function apiHandler
where
  isApiHandler(apiHandler) and
  not exists(DataFlow::Node authCheck | 
    isAuthCheck(authCheck) and
    authCheck.getEnclosingExpr().getEnclosingFunction() = apiHandler
  )
select apiHandler, "API handler function may not perform proper authorization checks." 