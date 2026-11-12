# blog.omaps.cn

麦扑科技（OMAPS）技术博客。Hugo + Roadster 主题，GitHub Pages 托管，自定义域名 `blog.omaps.cn`。

## 结构

```
content/post/     文章（Markdown）
content/about.md  关于页
hugo.toml         站点配置（菜单、侧栏、字体、品牌色）
layouts/          对主题的站点级覆盖（仅 head/gfonts.html：关闭 Google Fonts）
static/           CNAME、站点级 CSS
themes/roadster/  Roadster 主题（vendored，非 submodule）
.github/workflows/deploy.yml  推 main 即构建并发布到 gh-pages
```

## 写作

```bash
hugo new content post/my-article.md   # 生成草稿骨架
# 写完后把 draft 改成 false
hugo server -D                        # 本地预览 http://localhost:1313
```

提交推送到 `main` 后，GitHub Actions 自动 `hugo --minify` 并把 `public/` 发布到 `gh-pages` 分支。

## 分支与发布

- `main`：源码。唯一需要手工改的分支。
- `gh-pages`：构建产物，由 Actions 强制覆盖（`force_orphan`），**不要手工改**。

## 域名

- `static/CNAME` = `blog.omaps.cn`，构建时复制进产物。
- DNS 需一条 `CNAME blog → macula-omaps.github.io`。
- GitHub 仓库 Settings → Pages：Source 选 `gh-pages` 分支 / root，Custom domain 填 `blog.omaps.cn`，勾选 Enforce HTTPS。

## 依赖

Hugo extended ≥ 0.158（本仓库验证于 0.169.0）。macOS 可用 `brew install hugo`。
