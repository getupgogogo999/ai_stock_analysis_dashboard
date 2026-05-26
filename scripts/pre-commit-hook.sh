#!/bin/sh
# 阻止 .env 及密钥文件被提交到 GitHub
FORBIDDEN=$(git diff --cached --name-only | grep -E '^\.env$|^\.env\.|\.env\.local$')
if [ -n "$FORBIDDEN" ]; then
  echo "========================================"
  echo "  BLOCKED: 禁止提交 .env 密钥文件！"
  echo "  以下文件不能进入 GitHub："
  echo "$FORBIDDEN"
  echo "========================================"
  exit 1
fi
