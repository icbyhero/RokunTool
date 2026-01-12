#!/bin/bash
# 执行命令:bash 微信双开.sh   
# 步骤一: 删除已存在的 WeChat2.app (如果存在)
echo "正在检查并删除已存在的 WeChat2.app..."
if [ -d "/Applications/WeChat2.app" ]; then
    sudo rm -rf "/Applications/WeChat2.app"
    echo "WeChat2.app 已删除。"
else
    echo "WeChat2.app 不存在，无需删除。"
fi

# 步骤二: 创建微信的「分身」
echo "正在创建微信分身..."
sudo cp -R /Applications/WeChat.app /Applications/WeChat2.app

# 步骤三: 给 WeChat2.app 鉴权
echo "正在为WeChat2.app鉴权..."
sudo /usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier com.tencent.xinWeChat2" /Applications/WeChat2.app/Contents/Info.plist

# 步骤四: 签名
echo "正在为WeChat2.app签名..."
sudo codesign --force --deep --sign - /Applications/WeChat2.app

# 步骤五: 运行第二个微信
echo "正在启动第二个微信..."
nohup /Applications/WeChat2.app/Contents/MacOS/WeChat >/dev/null 2>&1 &

echo "操作完成。请检查是否可以登录第二个微信。"