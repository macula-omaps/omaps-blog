---
title: Hello OMAPS Blog
date: 2026-11-12 14:30:00
tags:
  - hexo
categories:
  - 随笔
---

欢迎来到 OMAPS Blog。

本站基于 Hexo 构建，源码托管在 `main` 分支，静态产物由 `hexo deploy` 推送到 `gh-pages` 分支，通过 GitHub Pages 对外服务，自定义域名 **blog.omaps.cn**。

日常写作流程：

```bash
hexo new post "文章标题"   # 在 source/_posts 下生成 md
# 编辑 md
hexo server               # 本地 http://localhost:4000 预览
hexo clean && hexo deploy # 清缓存并发布到 gh-pages
```
