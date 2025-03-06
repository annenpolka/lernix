#!/bin/bash

# Inkアプリを別プロセスで実行するためのスクリプト
cd "$(dirname "$0")"

# 必要なパッケージがインストールされているか確認
if [ ! -d "node_modules" ]; then
    echo "依存パッケージをインストールしています..."
    npm install
fi

# 開発モードで実行
echo "Inkアプリを別ターミナルで実行しています..."

# macOSの場合はTerminal.appで新しいウィンドウを開く
if [ "$(uname)" == "Darwin" ]; then
    osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'\" && npm run dev"'
# Linuxの場合はgnome-terminalを試みる
elif command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "cd \"$(pwd)\" && npm run dev; exec bash"
# それ以外の場合は実行方法を表示
else
    echo "別のターミナルを開いて、以下のコマンドを実行してください:"
    echo "cd \"$(pwd)\" && npm run dev"
fi

echo "アプリを終了するには、ターミナルウィンドウを閉じるか、Ctrl+Cを押してください。"