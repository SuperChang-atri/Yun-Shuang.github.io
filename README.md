# MSB — Mapping Schizophrenia Brain

Team website of the MSB group (PI: Dr. Yunshuang Fan), School of Life Science and Technology, UESTC.
Built as a pure static site (HTML/CSS/JS, no build step) and hosted on GitHub Pages.

**Live:** https://yun-shuang.github.io

## 站点结构

```
├── index.html              首页（Hero / 团队合照滚动揭幕 / 研究亮点 / 动态 / PI 简介）
├── research/               研究方向
├── people/                 团队成员（读取 _data/members.json 渲染）
├── publications/           学术成果（读取 _data/publications.json，按年分组 + 站内分页）
├── contact/                联系方式（邮箱 + 微信公众号二维码）
├── _data/
│   ├── members/            成员数据：每人一个 <id>.json（成员自助维护，PR 审批）
│   │   └── _template.json  新成员模板
│   ├── members.json        聚合产物（Actions 自动生成，请勿手改）
│   ├── publications.json   论文数据（Actions 每周自动同步 OpenAlex）
│   ├── gallery.json        活动相册清单（Actions 根据 assets/img/gallery/ 自动同步）
│   └── news.json           首页"最新动态"（加/删/改新闻只编辑这一个文件）
├── assets/                 css / js / i18n 语言包 / 图片
├── scripts/
│   ├── sync_publications.py  论文同步脚本（默认 OpenAlex；--source scholar 走本地 Google Scholar）
│   ├── build_members.py    成员数据聚合脚本
│   ├── build_gallery.py    相册清单聚合脚本
│   └── validate_members.py 成员数据校验脚本（PR 自动检查）
└── .github/workflows/      deploy / sync-publications / build-members / build-gallery / validate-members
```

## 内容维护速查

> 详细版维护手册（含相册管理、权限、同步机制、常见问题）：
> **[docs/网站维护指南.md](docs/网站维护指南.md)**；成员改个人信息看 [docs/成员自助维护指南.md](docs/成员自助维护指南.md)。

| 想改什么 | 编辑哪个文件 | 说明 |
|---|---|---|
| 首页最新动态 | `_data/news.json` | 数组加/删条目即可；`text` 英文、`text_zh` 中文、`date` 显示日期 |
| 研究方向文字 | `assets/i18n/zh.json` + `en.json` | `research.d1.t`/`research.d1.p` ~ `d4`，中英各改一份 |
| 首页标题/简介等 | 同上两个语言包 | `home.*` 开头的键 |
| 首页大合照 | `assets/img/group-photo.jpg` | 同名覆盖即可（建议 ≤2000px 宽） |
| 活动相册 | `assets/img/gallery/` 文件夹 | 增/删照片只动文件夹，`_data/gallery.json` 由 Actions 自动同步；说明文字在 gallery.json 里改。照片自动出现在首页网格与成员页轮播 |
| 成员信息 | `_data/members/<id>.json` | 见下方"成员信息自助维护" |
| 联系邮箱 | `contact/index.html` + `assets/js/site.js` 页脚 | 两处同步改 |

## 自动化机制

| 工作流 | 触发 | 作用 |
|---|---|---|
| `deploy.yml` | push 到 main | 部署到 GitHub Pages |
| `sync-publications.yml` | 每周一 02:00 UTC / 手动 | 从 OpenAlex 抓取论文 → 更新 `_data/publications.json`；失败时保留旧数据并告警 |
| `validate-members.yml` | 成员数据 PR | 自动校验 JSON 格式与必填字段 |
| `build-members.yml` | 成员数据合并进 main | 重新聚合 `members.json` 并自动提交 |

> 为什么用 OpenAlex 而不是直接抓 Google Scholar？Google 会拦截 GitHub
> Actions 的机房 IP（验证码），无法在云端稳定自动抓取。OpenAlex 是开放
> 学术数据库（数据含引用数、h 指数、DOI 链接），云端可稳定访问。
> 如需精确的 Scholar 数字，可在本地运行：
> `pip install scholarly && python scripts/sync_publications.py --source scholar`

## 成员信息自助维护

成员在 GitHub 网页上修改自己的 `_data/members/<id>.json` 并提 Pull Request，
管理员（CODEOWNERS）审批合并后自动上线。**详细图文流程见 [docs/成员自助维护指南.md](docs/成员自助维护指南.md)。**

## 本地预览

```bash
python -m http.server 8000
# 打开 http://localhost:8000
```

## 待办（占位待替换）

- [ ] `.github/CODEOWNERS` 追加其他管理员的 GitHub 用户名
- [ ] 成员的 `research`/`since` 目前为占位值，请成员按 [指南](docs/成员自助维护指南.md) 自助更新；照片暂未提供，上传后自动显示
- [ ] 徐雨停（校友）的毕业去向 `destination` 待补充
