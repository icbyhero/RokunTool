## ADDED Requirements

### Requirement: Documentation Directory Structure
The project SHALL organize documentation in a centralized `docs/` directory at the project root with clear separation of concerns.

#### Scenario: User documentation location
- **WHEN** a user seeks documentation about using the application
- **THEN** documentation SHALL be located in `docs/user/`

#### Scenario: Development documentation location
- **WHEN** a developer seeks documentation about architecture, APIs, or coding standards
- **THEN** documentation SHALL be located in `docs/development/`

#### Scenario: Plugin documentation location
- **WHEN** a developer seeks documentation about plugins
- **THEN** documentation SHALL be located in `docs/plugins/[plugin-name]/`

#### Scenario: Development log location
- **WHEN** a developer seeks historical development records
- **THEN** daily development logs SHALL be located in `docs/daily-log/`

### Requirement: Plugin Directory Organization
The project SHALL store all plugins in a top-level `plugins/` directory at the project root.

#### Scenario: Plugin discovery
- **WHEN** a developer or the plugin system searches for plugins
- **THEN** all plugins SHALL be located in the `plugins/` directory
- **AND** each plugin SHALL have its own subdirectory

#### Scenario: Plugin accessibility
- **WHEN** accessing plugin documentation
- **THEN** detailed documentation SHALL be available in `docs/plugins/[plugin-name]/`
- **AND** a brief README.md SHALL remain in the plugin directory for quick reference

### Requirement: Testing Directory Unification
The project SHALL organize all test files in a unified `tests/` directory at the project root.

#### Scenario: Test file location
- **WHEN** adding or modifying tests
- **THEN** all test files SHALL be located under `tests/`
- **AND** SHALL be organized by type (unit/, e2e/, fixtures/)

#### Scenario: Test execution
- **WHEN** running the test suite
- **THEN** the test runner SHALL discover all tests from the `tests/` directory

### Requirement: Naming Conventions
The project SHALL follow consistent naming conventions across all directories and files.

#### Scenario: Directory naming
- **WHEN** creating directories
- **THEN** directory names SHALL use kebab-case (lowercase with hyphens)
- **EXAMPLE**: `wechat-multi-instance/`, `rime-config/`

#### Scenario: File naming
- **WHEN** creating files
- **THEN** file names SHALL use kebab-case for most files
- **AND** SHALL use PascalCase for React components
- **AND** SHALL use camelCase for TypeScript/JavaScript variables

### Requirement: Build Output Management
The project SHALL configure build tools to output artifacts to designated directories and exclude them from version control.

#### Scenario: Build output location
- **WHEN** building the application
- **THEN** build artifacts SHALL be written to the `out/` directory
- **AND** the `out/` directory SHALL be listed in `.gitignore`

#### Scenario: Clean build directory
- **WHEN** performing a clean build
- **THEN** build artifacts from previous builds SHALL be removed before building

### Requirement: Source Code Organization
The project SHALL organize source code in a `src/` directory with clear separation between main process, preload, renderer, and shared code.

#### Scenario: Main process code location
- **WHEN** writing Electron main process code
- **THEN** code SHALL be located in `src/main/`

#### Scenario: Preload scripts location
- **WHEN** writing preload scripts
- **THEN** code SHALL be located in `src/preload/`

#### Scenario: Renderer code location
- **WHEN** writing renderer process code
- **THEN** code SHALL be located in `src/renderer/`

#### Scenario: Shared code location
- **WHEN** writing code shared between processes
- **THEN** code SHALL be located in `src/shared/`
