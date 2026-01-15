# Transactional Permissions System Specification

## ADDED Requirements

### Requirement: Permission Pre-check

The system SHALL provide a permission pre-check API that allows plugins to verify all required permissions are available before executing any operations.

#### Scenario: Pre-check all permissions before operation

- **GIVEN** a plugin defines a feature requiring multiple permissions
- **WHEN** the plugin calls `preCheckPermissions()` with the permission list
- **THEN** the system SHALL return a detailed result indicating:
  - Which permissions are permanently denied
  - Which permissions are pending (need user approval)
  - Which permissions are already granted
  - Overall risk level of the permission set
  - Whether the operation can proceed
- **AND** the system SHALL NOT display any permission dialog during pre-check

#### Scenario: Detect permanently denied permissions

- **GIVEN** a plugin requires `fs:write` permission
- **AND** the user has permanently denied this permission
- **WHEN** the plugin calls `preCheckPermissions()`
- **THEN** the system SHALL return `canProceed: false`
- **AND** the system SHALL include `fs:write` in `permanentlyDenied` array
- **AND** the system SHALL NOT display a permission request dialog

#### Scenario: Calculate permission risk level

- **GIVEN** a plugin requires permissions: `fs:read` (low risk), `fs:write` (high risk), `process:exec` (high risk)
- **WHEN** the plugin calls `preCheckPermissions()`
- **THEN** the system SHALL calculate overall risk level as `high`
- **AND** the system SHALL provide recommendation in result

### Requirement: Feature-Level Permission Request

The system SHALL provide a feature-level permission request API that requests all required permissions in a single dialog with clear context.

#### Scenario: Request all permissions for a feature

- **GIVEN** a plugin defines a feature "Create WeChat Instance" requiring `fs:read`, `fs:write`, and `process:exec`
- **AND** all permissions are pending (not permanently denied)
- **WHEN** the plugin calls `requestFeaturePermissions()` with feature name and permission list
- **THEN** the system SHALL display a single permission dialog
- **AND** the dialog SHALL show:
  - Feature name: "创建微信分身"
  - All required permissions with descriptions
  - Risk level indicator
  - Security warning
- **AND** the user SHALL be able to:
  - Grant all permissions for current session
  - Grant all permissions permanently
  - Deny all permissions

#### Scenario: User denies feature permission request

- **GIVEN** the system displays a feature permission dialog
- **WHEN** the user clicks "拒绝所有" (Deny All)
- **THEN** the system SHALL return `allGranted: false`
- **AND** the plugin SHALL NOT execute any operations
- **AND** no partial state changes SHALL occur

#### Scenario: User grants feature permissions

- **GIVEN** the system displays a feature permission dialog
- **WHEN** the user clicks "永久授权" (Grant Permanently)
- **THEN** the system SHALL grant all requested permissions
- **AND** the system SHALL persist permission grants
- **AND** the system SHALL return `allGranted: true`
- **AND** the plugin MAY proceed with operation execution

### Requirement: Transaction Execution

The system SHALL provide a transaction execution API that guarantees atomicity of multi-step operations with automatic rollback on failure.

#### Scenario: Execute transaction successfully

- **GIVEN** a plugin defines a transaction with 3 steps
- **AND** all required permissions are granted
- **WHEN** the plugin calls `executeTransaction()` with the transaction definition
- **THEN** the system SHALL execute steps in order:
  - Step 1: execute() → success
  - Step 2: execute() → success
  - Step 3: execute() → success
- **AND** the system SHALL return `success: true`
- **AND** the system SHALL report progress for each step
- **AND** the system SHALL log all step executions

#### Scenario: Transaction failure triggers rollback

- **GIVEN** a plugin defines a transaction with 3 steps
- **AND** each step defines a rollback operation
- **WHEN** the plugin calls `executeTransaction()`
- **AND** Step 1 succeeds
- **AND** Step 2 succeeds
- **AND** Step 3 fails
- **THEN** the system SHALL automatically execute rollback in reverse order:
  - Step 2: rollback() → clean up changes
  - Step 1: rollback() → clean up changes
- **AND** the system SHALL return `success: false`
- **AND** the system SHALL return `failedStep: "Step 3"`
- **AND** the system SHALL return `rollbackCompleted: true`
- **AND** the system SHALL report "正在回滚..." (Rolling back...) to user
- **AND** the system SHALL log rollback operations

#### Scenario: Rollback failure handling

- **GIVEN** a transaction fails and rollback is triggered
- **AND** Step 2 rollback succeeds
- **AND** Step 1 rollback fails
- **THEN** the system SHALL continue attempting rollback (depending on configuration)
- **AND** the system SHALL record rollback failures in transaction log
- **AND** the system SHALL return `rollbackCompleted: false`
- **AND** the system SHALL return `rollbackFailures` array with error details
- **AND** the system SHALL display warning to user about partial rollback

#### Scenario: Transaction with timeout

- **GIVEN** a transaction step is configured with 10 second timeout
- **WHEN** the step execution exceeds 10 seconds
- **THEN** the system SHALL abort the step
- **AND** the system SHALL trigger rollback
- **AND** the system SHALL return error with type `STEP_TIMEOUT`
- **AND** the system SHALL log timeout event

### Requirement: Progress Reporting Integration

The system SHALL integrate transaction execution with the unified progress reporting system.

#### Scenario: Report transaction progress

- **GIVEN** a transaction with 5 steps
- **WHEN** the transaction starts execution
- **THEN** the system SHALL call `progressReporter.start(featureName, 5)`
- **WHEN** each step completes
- **THEN** the system SHALL call `progressReporter.update(stepNumber, stepName, message)`
- **WHEN** all steps complete successfully
- **THEN** the system SHALL call `progressReporter.complete('操作成功完成')`

#### Scenario: Report rollback progress

- **GIVEN** a transaction fails during step 3 of 5
- **WHEN** rollback begins
- **THEN** the system SHALL update progress message to "操作失败: {error}, 正在回滚..."
- **WHEN** rollback completes successfully
- **THEN** the system SHALL call `progressReporter.complete('回滚完成,系统已恢复')`
- **WHEN** rollback partially fails
- **THEN** the system SHALL call `progressReporter.warn('回滚部分完成, {n} 个步骤失败')`

### Requirement: Transaction Logging

The system SHALL maintain detailed logs of all transaction executions for debugging and audit purposes.

#### Scenario: Log successful transaction

- **WHEN** a transaction completes successfully
- **THEN** the system SHALL create a transaction log entry with:
  - Unique transaction ID
  - Feature name
  - Plugin ID
  - Start time and end time
  - Duration
  - Status: "success"
  - All step executions with timestamps
- **AND** the system SHALL persist log to disk asynchronously

#### Scenario: Log failed transaction with rollback

- **WHEN** a transaction fails and rollback is executed
- **THEN** the system SHALL create a transaction log entry with:
  - Transaction ID
  - Feature name
  - Status: "rolled_back"
  - Failed step name and error
  - All executed steps
  - All rollback operations with results
  - Any rollback failures

#### Scenario: Query transaction logs

- **GIVEN** multiple transaction logs exist
- **WHEN** user or plugin queries logs
- **THEN** the system SHALL support filtering by:
  - Transaction ID
  - Plugin ID
  - Time range
  - Status (success/failed/rolled_back)
- **AND** the system SHALL return matching log entries

### Requirement: Rollback Helper Library

The system SHALL provide helper classes for common rollback operations to simplify plugin development.

#### Scenario: File copy with automatic rollback

- **GIVEN** a plugin needs to copy a file as part of a transaction step
- **WHEN** the plugin uses `FileRollback.copyWithRollback(source, target)`
- **THEN** the helper SHALL:
  - Copy the file from source to target
  - Return a rollback handle
- **WHEN** the rollback handle's `rollback()` is called
- **THEN** the helper SHALL delete the copied file
- **AND** the helper SHALL handle errors gracefully

#### Scenario: File write with backup

- **GIVEN** a plugin needs to write to a configuration file
- **WHEN** the plugin uses `FileRollback.writeWithRollback(filePath, content)`
- **THEN** the helper SHALL:
  - Create a backup of the original file (if exists)
  - Write new content to the file
  - Return a rollback handle
- **WHEN** rollback is triggered
- **THEN** the helper SHALL:
  - Restore from backup if backup exists
  - Or delete the file if no backup existed

#### Scenario: Process spawn with cleanup

- **GIVEN** a plugin needs to spawn a process
- **WHEN** the plugin uses `ProcessRollback.spawnWithRollback(command, args)`
- **THEN** the helper SHALL:
  - Spawn the process
  - Store process reference
  - Return a rollback handle with process reference
- **WHEN** rollback is triggered
- **THEN** the helper SHALL:
  - Terminate the process gracefully (SIGTERM)
  - Wait up to 5 seconds for process to exit
  - Force kill if necessary (SIGKILL)
  - Clean up process references

## MODIFIED Requirements

### Requirement: Plugin Context API

The plugin context API SHALL be extended to support transactional permissions.

#### Scenario: New permission methods in context

- **GIVEN** a plugin is loaded with a context object
- **THEN** the context SHALL provide:
  - `preCheckPermissions(permissions: Permission[]): Promise<PermissionCheckResult>`
  - `requestFeaturePermissions(featureName, permissions, reason, context): Promise<FeaturePermissionResult>`
  - `executeTransaction(transaction): Promise<TransactionResult>`
  - `createTransaction(featureName, options): TransactionBuilder`

#### Scenario: Transaction builder usage

- **GIVEN** a plugin wants to create a transaction
- **WHEN** the plugin calls `context.createTransaction('featureName')`
- **THEN** the system SHALL return a TransactionBuilder instance
- **AND** the builder SHALL support fluent API:
  - `addStep(name, execute, rollback, options)`
  - `build()`
- **AND** the builder MAY be chained:
  ```typescript
  const transaction = context.createTransaction('My Feature')
    .addStep('Step 1', exec1, rollback1)
    .addStep('Step 2', exec2, rollback2)
    .build()
  ```

### Requirement: Unified Progress Reporting

All plugins SHALL use the framework-provided progress reporting API consistently.

#### Scenario: Plugins must use progress API

- **GIVEN** a plugin performs a long-running operation
- **THEN** the plugin SHALL use `context.api.progress` methods:
  - `start(operation, totalSteps)`
  - `update(currentStep, stepName, message)`
  - `complete(message)`
  - `fail(message)`
- **AND** the plugin SHALL NOT implement custom progress UI
- **AND** the plugin SHALL NOT use alternative progress mechanisms

#### Scenario: Transaction progress reporting

- **GIVEN** a plugin executes a transaction
- **WHEN** the transaction starts
- **THEN** the system SHALL automatically report progress via `context.api.progress`
- **AND** the plugin SHALL NOT manually report progress for transaction steps
- **BUT** the plugin MAY report progress for sub-operations within a step

## REMOVED Requirements

None. All existing requirements remain. This is a purely additive change.
