#!/bin/bash
cd "$(dirname "$0")"
echo "🎫 B站余票监控后端已启动: http://localhost:3001"
echo "🌐 正在打开浏览器..."
sleep 1 && open http://localhost:3001 &
node server/server.js
