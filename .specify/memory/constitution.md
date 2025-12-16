<!--
Sync Impact Report
==================
Version Change: 0.0.0 → 1.0.0
Rationale: Initial constitution ratification with core principles

Modified Principles: N/A (initial version)

Added Sections:
- Core Principles (5 principles defined)
- Development Standards
- Quality Gates
- Governance

Removed Sections: N/A (initial version)

Templates Status:
✅ plan-template.md - reviewed, constitution check section aligns
✅ spec-template.md - reviewed, requirements alignment verified
✅ tasks-template.md - reviewed, task categorization reflects principles
✅ Command files - reviewed, no agent-specific references found

Follow-up TODOs: None
-->

# Annotation MCP Server Constitution

## Core Principles

### I. Type Safety First

Every function, method, and interface MUST have explicit type definitions. Type checking is not optional—it's the foundation of reliability.

- All parameters MUST declare types explicitly
- Return types MUST be declared for all functions
- No use of `any` type except when interfacing with untyped external libraries (must be documented with justification)
- Shared types and interfaces MUST be defined in dedicated type definition files
- Use discriminated unions and literal types to eliminate invalid states at compile time

**Rationale**: Type safety catches errors at development time rather than runtime, reducing debugging time and preventing production failures. For an MCP server handling annotations, type safety ensures data integrity and API contract compliance.

### II. Simplicity Over Cleverness (NON-NEGOTIABLE)

Every solution MUST be the simplest possible approach that meets requirements. Complexity requires explicit justification.

- Start with the most straightforward implementation
- Abstractions and patterns MUST solve real, current problems—not hypothetical future needs
- Avoid premature optimization
- Code MUST be readable by developers of varying experience levels
- Each module MUST have a single, clear responsibility

**Rationale**: Simple code is maintainable code. MCP servers need to be reliable and debuggable. Complex abstractions make both testing and debugging significantly harder. YAGNI (You Aren't Gonna Need It) principles prevent over-engineering.

### III. Error Handling as First-Class Design

Error handling MUST be designed alongside happy-path logic, not added as an afterthought.

- All failure modes MUST be identified and handled explicitly
- Errors MUST be strongly typed (discriminated union of error types)
- Error messages MUST be actionable and include context for debugging
- Use Result/Either patterns for operations that can fail predictably
- Unrecoverable errors MUST fail fast with clear error messages
- All external I/O operations (file, network, database) MUST handle failure cases
- Error types MUST be exported for consumers to handle appropriately

**Rationale**: Good error handling makes systems robust and debuggable. For an MCP server, clear error reporting helps clients understand what went wrong and how to fix it. Type-safe errors prevent forgotten error cases.

### IV. Observable Operations

All operations MUST be observable through structured logging and clear interfaces.

- Log key operations with structured data (JSON format preferred)
- Include operation context: inputs, outputs, duration, errors
- Log levels MUST be used appropriately (debug, info, warn, error)
- Avoid logging sensitive data (credentials, personal information)
- MCP protocol messages MUST be traceable through logs
- Performance-critical paths should include timing information

**Rationale**: MCP servers often run as background services. Observability is essential for diagnosing issues in production environments where interactive debugging isn't possible.

### V. Contract-Driven Development

All interfaces (MCP tools, resources, prompts) MUST define and validate their contracts.

- Input validation MUST happen at system boundaries
- MCP tool schemas MUST accurately reflect parameter requirements
- Response formats MUST match declared schemas
- Breaking changes to contracts require version bumps
- Document contract assumptions and constraints
- Validate inputs against schemas before processing

**Rationale**: MCP is a protocol-based system. Contract compliance ensures interoperability with different clients and prevents runtime errors from malformed data.

## Development Standards

### Testing Requirements

- Unit tests MUST cover core business logic
- Integration tests MUST verify MCP protocol compliance
- Tests MUST validate both success and error paths
- Mock external dependencies to ensure test reliability
- Tests run in CI/CD pipeline before merge

### Code Organization

- Group by feature/capability, not technical layer
- Types in `types/` or `*.types.ts` files
- Utilities in focused modules with single responsibilities
- Configuration separate from code
- Follow consistent file naming conventions

### Documentation Requirements

- README MUST explain setup, configuration, and usage
- MCP tools MUST document parameters, return types, and error conditions
- Complex logic MUST have inline comments explaining "why," not "what"
- Type definitions serve as primary API documentation
- Keep documentation close to code (avoid drift)

## Quality Gates

Before any code is merged:

- **Type Check**: Must pass strict TypeScript compilation (no `any` without justification)
- **Lint**: Must pass linter with no warnings
- **Tests**: All tests must pass
- **Error Handling**: All error paths must be tested
- **MCP Compliance**: Must validate against MCP protocol specification
- **Simplicity Review**: Any added complexity must be justified in PR description

## Governance

### Amendment Process

1. Propose change with rationale and impact analysis
2. Document affected code/patterns
3. Update templates and guidance to reflect change
4. Version bump per semantic versioning rules

### Versioning Rules

- **MAJOR**: Breaking principle changes, removed principles, governance redefinitions
- **MINOR**: New principles, expanded sections, new mandatory requirements
- **PATCH**: Clarifications, wording improvements, typo fixes

### Compliance

- All PRs MUST verify alignment with constitution principles
- Complexity violations MUST include written justification
- Regular audits to ensure codebase maintains principle compliance
- Constitution supersedes all other development practices

**Version**: 1.0.0 | **Ratified**: 2025-12-16 | **Last Amended**: 2025-12-16
