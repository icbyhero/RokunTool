/**
 * 测试数据 Fixtures
 * 提供常用的测试数据
 */

import { PluginMetadata } from '../mocks/plugins.mock'

/**
 * 有效的插件 package.json fixture
 */
export const validPluginPackage: PluginMetadata = {
  id: 'test-plugin',
  name: 'Test Plugin',
  version: '1.0.0',
  description: 'A test plugin',
  author: 'Test Author',
  license: 'MIT',
  main: 'index.js',
  permissions: ['fs:read', 'fs:write']
}

/**
 * 无效的插件 package.json fixtures
 */
export const invalidPluginPackages = {
  missingId: {
    name: 'Invalid Plugin',
    version: '1.0.0',
    description: 'Missing ID',
    author: 'Test',
    license: 'MIT',
    main: 'index.js',
    permissions: []
  } as PluginMetadata,

  missingName: {
    id: 'invalid-plugin',
    version: '1.0.0',
    description: 'Missing name',
    author: 'Test',
    license: 'MIT',
    main: 'index.js',
    permissions: []
  } as PluginMetadata,

  invalidVersion: {
    id: 'invalid-version-plugin',
    name: 'Invalid Version Plugin',
    version: 'invalid',
    description: 'Invalid version format',
    author: 'Test',
    license: 'MIT',
    main: 'index.js',
    permissions: []
  } as PluginMetadata,

  invalidIdFormat: {
    id: 'invalid id!',
    name: 'Invalid ID Format Plugin',
    version: '1.0.0',
    description: 'Invalid ID format',
    author: 'Test',
    license: 'MIT',
    main: 'index.js',
    permissions: []
  } as PluginMetadata
}

/**
 * 权限测试数据
 */
export const permissionFixtures = {
  validPermissions: ['fs:read', 'fs:write', 'process:exec', 'process:spawn'],
  invalidPermissions: ['invalid:permission', 'malformed'],
  emptyPermissions: [],
  allPermissions: [
    'fs:read',
    'fs:write',
    'process:exec',
    'process:spawn',
    'config:read',
    'config:write'
  ]
}

/**
 * 文件系统测试数据
 */
export const fsFixtures = {
  testFilePath: '/tmp/test/file.txt',
  testDirPath: '/tmp/test/dir',
  testFileContent: 'Test file content',
  testYamlContent: 'key1: value1\nkey2: value2',
  testJsonContent: '{"key1": "value1", "key2": "value2"}'
}

/**
 * IPC 消息测试数据
 */
export const ipcFixtures = {
  validMessage: {
    channel: 'test-channel',
    args: [{ test: 'data' }]
  },
  invalidMessage: {
    channel: '',
    args: []
  },
  pluginMethodMessage: {
    channel: 'plugin:callMethod',
    args: [
      {
        pluginId: 'test-plugin',
        method: 'testMethod',
        args: []
      }
    ]
  }
}

/**
 * Rime 测试数据
 */
export const rimeFixtures = {
  rimeDirs: [
    '/home/test/Library/Rime',
    '/home/test/.local/share/fcitx5/rime',
    '/home/test/.config/ibus/rime'
  ],
  plumRecipes: [
    {
      id: 'full',
      name: '全部文件',
      description: '安装或更新 rime-ice 的全部文件',
      recipe: 'iDvel/rime-ice:others/recipes/full',
      installed: false
    },
    {
      id: 'all_dicts',
      name: '全部词库',
      description: '仅安装词库文件',
      recipe: 'iDvel/rime-ice:others/recipes/all_dicts',
      installed: false
    },
    {
      id: 'cn_dicts',
      name: '主流词库',
      description: '仅安装主流大词库',
      recipe: 'iDvel/rime-ice:others/recipes/cn_dicts',
      installed: false
    },
    {
      id: 'en_dicts',
      name: '英文词库',
      description: '仅安装英文词库',
      recipe: 'iDvel/rime-ice:others/recipes/en_dicts',
      installed: false
    },
    {
      id: 'opencc',
      name: 'OpenCC 简繁转换',
      description: '仅安装 OpenCC 配置',
      recipe: 'iDvel/rime-ice:others/recipes/opencc',
      installed: false
    }
  ],
  rimeInstallSuccess: {
    stdout: 'Installation successful',
    stderr: ''
  },
  rimeInstallError: {
    stdout: '',
    stderr: 'Installation failed'
  }
}

/**
 * 性能基准测试数据
 */
export const performanceFixtures = {
  thresholds: {
    startupTime: 3000, // 3秒
    pluginLoadTime: 1000, // 1秒
    uiResponseTime: 100, // 100ms
    memoryUsage: 300 * 1024 * 1024 // 300MB
  }
}
