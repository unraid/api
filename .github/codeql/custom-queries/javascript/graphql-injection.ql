/**
 * @name Potential GraphQL Injection
 * @description User-controlled input used directly in GraphQL queries may lead to injection vulnerabilities.
 * @kind path-problem
 * @problem.severity error
 * @precision high
 * @id js/graphql-injection
 * @tags security
 *       external/cwe/cwe-943
 */

import javascript
import DataFlow::PathGraph

class GraphQLQueryExecution extends DataFlow::CallNode {
  GraphQLQueryExecution() {
    exists(string name |
      name = this.getCalleeName() and
      (
        name = "execute" or 
        name = "executeQuery" or
        name = "query" or
        name.regexpMatch("(?i).*graphql.*query.*")
      )
    )
  }

  DataFlow::Node getQuery() {
    result = this.getArgument(0)
  }
}

class UserControlledInput extends DataFlow::Node {
  UserControlledInput() {
    exists(DataFlow::ParameterNode param | 
      param.getName().regexpMatch("(?i).*(query|request|input|args|variables|params).*") and
      this = param
    )
    or
    exists(DataFlow::PropRead prop |
      prop.getPropertyName().regexpMatch("(?i).*(query|request|input|args|variables|params).*") and
      this = prop
    )
  }
}

/**
 * Holds if `node` is a string concatenation.
 */
predicate isStringConcatenation(DataFlow::Node node) {
  exists(BinaryExpr concat |
    concat.getOperator() = "+" and
    concat.flow() = node
  )
}

class GraphQLInjectionConfig extends TaintTracking::Configuration {
  GraphQLInjectionConfig() { this = "GraphQLInjectionConfig" }

  override predicate isSource(DataFlow::Node source) {
    source instanceof UserControlledInput
  }

  override predicate isSink(DataFlow::Node sink) {
    exists(GraphQLQueryExecution exec | sink = exec.getQuery())
  }

  override predicate isAdditionalTaintStep(DataFlow::Node pred, DataFlow::Node succ) {
    // Add any GraphQL-specific taint steps if needed
    isStringConcatenation(succ) and
    succ.(DataFlow::BinaryExprNode).getAnOperand() = pred
  }
}

from GraphQLInjectionConfig config, DataFlow::PathNode source, DataFlow::PathNode sink
where config.hasFlowPath(source, sink)
select sink.getNode(), source, sink, "GraphQL query may contain user-controlled input from $@.", source.getNode(), "user input" 