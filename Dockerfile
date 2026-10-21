# 多阶段构建：第一阶段安装依赖并构建前端与后端，第二阶段只带产物运行。
# 后端已连同 @merchant/contracts 打成单文件，运行镜像里不需要 node_modules 和 pnpm。

FROM node:22-slim AS build
WORKDIR /app
RUN npm install -g pnpm@11.26.0

# 先只拷依赖清单再安装，源码变化时这一层的缓存不失效。
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
COPY packages/contracts/package.json packages/contracts/
RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY packages packages
COPY apps apps
RUN pnpm build

FROM node:22-slim
WORKDIR /app
# 目录布局要与仓库一致：后端按自身位置 ../../web/dist 找前端产物。
COPY --from=build /app/apps/server/dist apps/server/dist
COPY --from=build /app/apps/web/dist apps/web/dist

# 生产环境的会话 cookie 带 secure，必须经 HTTPS 下发：
#   - 部署在 HTTPS 反向代理之后：运行时加 -e TRUST_PROXY=true
#   - 纯 HTTP 的内网或演示环境：运行时加 -e COOKIE_SECURE=false
ENV NODE_ENV=production \
    PORT=3001
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "apps/server/dist/server.js"]
