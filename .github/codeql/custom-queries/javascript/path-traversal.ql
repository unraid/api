/**
 * @name Path Traversal Vulnerability
 * @description User-controlled inputs used in file operations may allow for path traversal attacks.
 * @kind path-problem
 * @problem.severity error
 * @precision high
 * @id js/path-traversal
 * @tags security
 *       external/cwe/cwe-22
 */

import javascript
import DataFlow::PathGraph

/**
 * Identifies sources of user-controlled input
 */
class UserInput extends DataFlow::Node {
  UserInput() {
    // HTTP request parameters
    exists(DataFlow::ParameterNode param |
      param.getName().regexpMatch("(?i).*(req|request|param|query|body|user|input).*") and
      this = param
    )
    or
    // Access to common request properties
    exists(DataFlow::PropRead prop |
      (
        prop.getPropertyName() = "query" or
        prop.getPropertyName() = "body" or
        prop.getPropertyName() = "params" or
        prop.getPropertyName() = "files"
      ) and
      this = prop
    )
  }
}

/**
 * Identifies fs module imports
 */
class FileSystemAccess extends DataFlow::CallNode {
  FileSystemAccess() {
    // Node.js fs module functions
    exists(string name |
      name = this.getCalleeName() and
      (
        name = "readFile" or
        name = "readFileSync" or
        name = "writeFile" or
        name = "writeFileSync" or
        name = "appendFile" or
        name = "appendFileSync" or
        name = "createReadStream" or
        name = "createWriteStream" or
        name = "openSync" or
        name = "open"
      )
    )
    or
    // File system operations via require('fs')
    exists(DataFlow::SourceNode fsModule, string methodName |
      (fsModule.getAPropertyRead("promises") or fsModule).flowsTo(this.getReceiver()) and
      methodName = this.getMethodName() and
      (
        methodName = "readFile" or
        methodName = "writeFile" or
        methodName = "appendFile" or
        methodName = "readdir" or
        methodName = "stat"
      )
    )
  }

  DataFlow::Node getPathArgument() {
    result = this.getArgument(0)
  }
}

/**
 * Identifies sanitization of file paths
 */
predicate isPathSanitized(DataFlow::Node node) {
  // Check for path normalization or validation
  exists(DataFlow::CallNode call |
    (
      call.getCalleeName() = "resolve" or
      call.getCalleeName() = "normalize" or
      call.getCalleeName() = "isAbsolute" or
      call.getCalleeName() = "relative" or
      call.getCalleeName().regexpMatch("(?i).*(sanitize|validate|check).*path.*")
    ) and
    call.flowsTo(node)
  )
  or
  // Check for path traversal mitigation patterns
  exists(DataFlow::CallNode call |
    call.getCalleeName() = "replace" and
    exists(StringLiteral regex |
      regex = call.getArgument(0).(DataFlow::RegExpCreationNode).getSource().getAChildExpr() and
      regex.getValue().regexpMatch("(\\.\\./|\\.\\.\\\\)")
    ) and
    call.flowsTo(node)
  )
}

/**
 * Configuration for tracking flow from user input to file system operations
 */
class PathTraversalConfig extends TaintTracking::Configuration {
  PathTraversalConfig() { this = "PathTraversalConfig" }

  override predicate isSource(DataFlow::Node source) {
    source instanceof UserInput
  }

  override predicate isSink(DataFlow::Node sink) {
    exists(FileSystemAccess fileAccess |
      sink = fileAccess.getPathArgument()
    )
  }

  override predicate isSanitizer(DataFlow::Node node) {
    isPathSanitized(node)
  }
}

from PathTraversalConfig config, DataFlow::PathNode source, DataFlow::PathNode sink
where config.hasFlowPath(source, sink)
select sink.getNode(), source, sink, "File system operation depends on a user-controlled value $@.", source.getNode(), "user input" 