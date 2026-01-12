# Rime Config Plugin Specification Delta

## ADDED Requirements

### Requirement: Configuration Editor with Advanced Features
The plugin SHALL provide a feature-rich configuration editor for Rime YAML files.

#### Scenario: Syntax highlighting
- **WHEN** user opens a YAML configuration file
- **THEN** syntax highlighting is applied
- **AND** YAML keywords, keys, and values are color-coded
- **AND** highlighting theme matches application theme (light/dark)

#### Scenario: Auto-completion
- **WHEN** user types in configuration editor
- **THEN** relevant configuration keys are suggested
- **AND** configuration values are suggested based on schema
- **AND** common Rime configuration snippets are available
- **AND** completion is context-aware

#### Scenario: Real-time validation
- **WHEN** user edits YAML content
- **THEN** YAML syntax is validated in real-time
- **AND** syntax errors are highlighted
- **AND** error markers show line and column
- **AND** error messages explain the issue
- **AND** suggested fixes are provided when possible

#### Scenario: Code formatting
- **WHEN** user requests format (shortcut or button)
- **THEN** YAML is formatted according to style rules
- **AND** indentation is corrected
- **AND** key-value pairs are aligned
- **AND** comments are preserved

#### Scenario: Diff comparison
- **WHEN** user compares current version with backup
- **THEN** side-by-side diff view is displayed
- **AND** additions are highlighted in green
- **AND** deletions are highlighted in red
- **AND** modifications are clearly marked
- **AND** user can restore from diff view

### Requirement: Dictionary File Management
The plugin SHALL provide comprehensive dictionary file management capabilities.

#### Scenario: Dictionary listing
- **WHEN** user opens dictionary manager
- **THEN** all .dict.yaml files are listed
- **AND** each dictionary shows metadata (name, word count, size, modified date)
- **AND** list is searchable and filterable
- **AND** list is sortable by any column

#### Scenario: Dictionary import
- **WHEN** user imports a dictionary file (.txt or .dict.yaml)
- **THEN** file format is validated
- **AND** import progress is displayed
- **AND** import result is reported (success/failure with details)
- **AND** imported dictionary is added to user directory

#### Scenario: Dictionary export
- **WHEN** user exports a dictionary
- **THEN** export format options are provided (txt/dict.yaml)
- **AND** selected format is applied
- **AND** file is downloaded to user-specified location
- **AND** export progress is shown

#### Scenario: Dictionary editing
- **WHEN** user opens a dictionary in editor
- **THEN** simple text editor is displayed
- **AND** user can add, edit, or delete entries
- **AND** batch operations are supported (delete multiple, modify frequency)
- **AND** undo/redo functionality is available
- **AND** changes are validated before saving

#### Scenario: Dictionary merging
- **WHEN** user merges multiple dictionaries
- **THEN** user selects source dictionaries
- **THEN** merge strategy is presented (deduplication, frequency handling)
- **AND** preview of merge result is shown
- **AND** user confirms merge
- **AND** merged dictionary is created

#### Scenario: Dictionary statistics
- **WHEN** user views dictionary details
- **THEN** total word count is displayed
- **AND** dictionary size is displayed
- **AND** word frequency distribution is shown (optional chart)
- **AND** recent additions/modifications are listed

### Requirement: Configuration Backup and Restore
The plugin SHALL provide automatic and manual backup functionality for configuration files.

#### Scenario: Automatic backup before modification
- **WHEN** user is about to modify a configuration file
- **THEN** current version is automatically backed up
- **AND** backup filename includes timestamp
- **AND** backup is created before any changes are written
- **AND** only last N backups are kept (configurable, default 10)

#### Scenario: Manual backup creation
- **WHEN** user creates manual backup
- **THEN** user can add note/description to backup
- **AND** backup progress is shown
- **AND** backup is confirmed when complete

#### Scenario: Backup list viewing
- **WHEN** user views backup manager
- **THEN** all backups are listed with metadata
- **AND** metadata includes timestamp, size, and user note
- **AND** backups are sortable and searchable
- **AND** total backup size is displayed

#### Scenario: Restore from backup
- **WHEN** user selects a backup to restore
- **THEN** backup content is previewed
- **AND** user confirms restore operation
- **AND** current file is backed up before restore
- **AND** restore operation is performed
- **AND** success/failure is reported

#### Scenario: Configuration import/export
- **WHEN** user exports configuration
- **THEN** all configuration files are packaged into ZIP
- **AND** user selects save location
- **AND** export progress is shown

- **WHEN** user imports configuration from ZIP
- **THEN** ZIP contents are validated
- **AND** configuration files are extracted to Rime directory
- **AND** existing files are backed up before overwriting
- **AND** import result is reported

### Requirement: Dictionary Download and Update
The plugin SHALL integrate with Rime plum for dictionary management.

#### Scenario: Download dictionary from plum
- **WHEN** user downloads a dictionary from plum
- **THEN** available dictionaries are listed
- **AND** download progress is displayed
- **AND** user can cancel download
- **AND** downloaded dictionary is installed

#### Scenario: Check for dictionary updates
- **WHEN** user checks for updates
- **THEN** local dictionary versions are compared with remote
- **AND** available updates are listed
- **AND** update details are shown (version, size, changes)

#### Scenario: Update dictionary
- **WHEN** user updates a dictionary
- **THEN** current version is backed up
- **AND** latest version is downloaded
- **AND** update progress is displayed
- **AND** update history is recorded

#### Scenario: Batch dictionary update
- **WHEN** user updates multiple dictionaries
- **THEN** user selects dictionaries to update
- **AND** updates are downloaded in parallel
- **AND** overall progress is shown
- **AND** failed updates are reported with reasons

### Requirement: Configuration File Management
The plugin SHALL manage Rime configuration files with advanced editing capabilities.

#### Scenario: Open configuration in editor
- **WHEN** user selects a configuration file
- **THEN** file is opened in advanced editor
- **AND** YAML content is displayed with syntax highlighting
- **AND** editor provides auto-completion
- **AND** real-time validation is active
- **AND** file can be formatted on demand

#### Scenario: Save configuration with validation
- **WHEN** user saves configuration
- **THEN** YAML syntax is validated
- **AND** if invalid, user is prompted with errors
- **AND** if valid, file is saved
- **AND** backup is created automatically
- **AND** Rime is notified to re-deploy (optional)
