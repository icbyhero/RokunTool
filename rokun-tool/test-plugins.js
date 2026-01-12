// 测试插件加载
console.log('开始测试插件加载...')
console.log('electronAPI:', window.electronAPI)
console.log('plugin API:', window.electronAPI?.plugin)

// 测试插件列表
window.electronAPI.plugin.list({}).then(result => {
  console.log('插件列表结果:', result)
  console.log('插件数量:', result?.plugins?.length)
  console.log('插件详情:', result?.plugins)
}).catch(error => {
  console.error('插件列表错误:', error)
})

// 等待2秒后再次检查
setTimeout(() => {
  window.electronAPI.plugin.list({}).then(result => {
    console.log('2秒后再次检查 - 插件列表结果:', result)
  })
}, 2000)
