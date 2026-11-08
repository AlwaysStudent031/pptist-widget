# 部署与访问入口

本项目是纯前端应用，`npm run build` 产物在 `dist/` 目录，可以部署到任意静态托管或自己的服务器。`vite.config.ts` 中 `base: ''`，资源使用相对路径，因此部署在域名根目录或子路径（如 GitHub Pages 的 `/<repo>/`）都可以。

## 方式对比

| 方式 | 入口 | 是否持久 | 适合 |
|---|---|---|---|
| 本机 / 局域网 | `http://127.0.0.1:4173/`、`http://<局域网IP>:4173/` | 本机运行时可用 | 自己用、同网络演示 |
| 临时公网隧道 | `https://xxxx.lhr.life/` | 进程断开即失效 | 临时发给别人看 |
| Docker + Nginx + 域名 | `https://ppt.example.com/` | 持久 | 正式部署（最接近 `ppt.klps.top`） |
| GitHub Pages | `https://<user>.github.io/<repo>/` | 持久、免费 | 开源演示 |
| Vercel / Netlify / Cloudflare Pages | 平台分配的域名 | 持久、免费 | 不想买服务器 |

## 一、本机 / 局域网

Windows 下可以直接双击仓库根目录的 `start-pptist.cmd`：会自动安装依赖、构建、打开浏览器并启动预览服务，入口是 <http://127.0.0.1:4173/>。

手动执行：

```bash
npm install
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

- 本机：<http://127.0.0.1:4173/>
- 局域网：把 `127.0.0.1` 换成电脑的局域网 IP，例如 `http://172.21.66.76:4173/`
- Windows 首次访问可能需要在防火墙中允许 Node.js 的入站连接。

> Vite 5.4 默认会校验 Host。通过域名/隧道访问 `vite preview` 时，需要把域名加入白名单：
>
> ```bash
> PPTIST_ALLOWED_HOSTS=.lhr.life npm run preview -- --host 0.0.0.0 --port 4173
> ```
>
> 多个域名用逗号分隔。正式部署建议用 Nginx 直接托管 `dist/`，不经过 Vite。

## 二、临时公网入口（无需账号）

本机已经有可用的 SSH 时，可以用 localhost.run 把本地 4173 端口映射到公网：

```bash
ssh -T -o ServerAliveInterval=30 -R 80:127.0.0.1:4173 nokey@localhost.run
```

终端会输出类似：

```
xxxx.lhr.life tunneled with tls termination, https://xxxx.lhr.life
```

这个地址可以直接打开，也可以发给别人。注意：

- 免费隧道是**临时**的，SSH 断开或电脑休眠后地址失效；
- 每次重连子域名可能变化；
- 只适合临时演示，不要放敏感内容。

## 三、Docker + Nginx + 自己的域名（推荐正式部署）

仓库已经提供 `Dockerfile`、`nginx.conf`、`docker-compose.yml`。

### 1. 在服务器上启动

```bash
git clone <你的仓库地址> pptist
cd pptist
docker compose up -d --build
```

启动后先用 `http://服务器IP:8080/` 验证。

### 2. 绑定域名

假设域名为 `ppt.example.com`：

1. 在 DNS 服务商添加 A 记录：`ppt.example.com -> 服务器公网 IP`。
2. 用 Caddy / Nginx 反向代理到 `127.0.0.1:8080` 并自动申请 HTTPS。

Caddy 示例（最省事，自动 HTTPS）：

```
ppt.example.com {
    reverse_proxy 127.0.0.1:8080
}
```

Nginx + Certbot 示例：

```nginx
server {
    listen 80;
    server_name ppt.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ppt.example.com;

    ssl_certificate     /etc/letsencrypt/live/ppt.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ppt.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

完成后入口就是 `https://ppt.example.com/`，和 `https://ppt.klps.top/` 的形态一致。

### 3. 模板库 / AI 接口（可选）

PPTist 官方的模板库、AI 生成等功能通过 `/api` 访问 `server.pptist.cn`。`nginx.conf` 中已经预留了代理配置，取消注释即可：

```nginx
resolver 223.5.5.5 8.8.8.8 valid=300s;
set $pptist_api "server.pptist.cn";
location /api/ {
    proxy_pass https://$pptist_api/;
    proxy_ssl_server_name on;
    proxy_ssl_name $pptist_api;
    proxy_set_header Host $pptist_api;
    proxy_set_header X-Real-IP $remote_addr;
}
```

如果不需要模板库/AI，可以保持注释，编辑器、放映、可视化组件都不受影响。

## 四、GitHub Pages（免费永久入口）

仓库已有 `.github/workflows/deploy.yml`：推送到 `master` 后自动构建并发布到 `gh-pages` 分支。

1. 把仓库推送到 GitHub。
2. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **Deploy from a branch**，分支选 `gh-pages`、目录选 `/ (root)`。
3. 等待 Actions 完成，入口为：

```
https://<你的用户名>.github.io/<仓库名>/
```

注意：

- 如果仓库名不是 `<用户名>.github.io`，站点在子路径下；`base: ''` 已适配。
- Pages 没有 `/api` 反向代理，模板库/AI 功能可能不可用；核心编辑/放映/组件功能正常。

## 五、Vercel / Netlify / Cloudflare Pages

三个平台都支持直接导入仓库，构建配置相同：

| 配置项 | 值 |
|---|---|
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | 20 |

如果平台要求 SPA 回退，把 `/*` 重写到 `/index.html` 即可（本项目基本只用根路径 + query，通常不配置也能打开）。

## 常见问题

**页面能打开但 JS/CSS 404？**
确认部署的是 `dist/` 整个目录，而不是只上传 `index.html`；确认访问路径没有被反向代理改写。

**通过域名访问提示 `Blocked request. This host is not allowed`？**
这是 Vite 的 Host 校验，不是你部署失败。开发/预览时设置 `PPTIST_ALLOWED_HOSTS=你的域名`；正式部署改用 Nginx 托管静态文件即可绕过。

**地址栏直接打开 `https://域名/` 一直显示“正在加载中”？**
按 F12 看控制台和 Network：通常是 `assets/` 资源路径错误（部署到了错误目录）或静态服务器没有返回正确的 MIME 类型。

**想改成 `https://ppt.klps.top/` 这种一模一样的域名？**
需要拥有该域名并控制其 DNS/服务器。把域名解析到你的服务器，再按上面的 Docker + Nginx/Caddy 配置即可；没有域名所有权无法代为配置。
