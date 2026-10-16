import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createBrowserRouter, Navigate, Outlet, type RouteObject } from "react-router";
import { LoginPage } from "../pages/login-page";
import { WorkspaceHomePage } from "../pages/workspace-home-page";
import { useSession, useSessionExpiry } from "../features/session";
import { ApiError } from "../shared/api/ApiError";
import { StatusPanel } from "../shared/ui/status-panel";
import { AppLayout, NotFoundPage, RouteErrorPage } from "./AppLayout";

function isUnauthorized(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

function sessionErrorDescription(error: unknown) {
  const requestId = error instanceof ApiError ? error.requestId : undefined;
  return requestId
    ? `无法获取登录状态，请稍后重试。请求编号：${requestId}`
    : "无法获取登录状态，请检查网络或稍后重试。";
}

function RootRedirect() {
  const session = useSession();
  if (session.isPending) {
    return <StatusPanel kind="loading" title="正在加载工作区" />;
  }

  if (session.isError) {
    if (isUnauthorized(session.error)) {
      return <Navigate replace to="/login" />;
    }
    return (
      <StatusPanel
        kind="error"
        title="服务暂时不可用"
        description={sessionErrorDescription(session.error)}
        onRetry={() => void session.refetch()}
      />
    );
  }

  return <Navigate replace to="/workspace" />;
}

function RequireSession() {
  const queryClient = useQueryClient();
  const session = useSession();
  const unauthorized = session.isError && isUnauthorized(session.error);

  useEffect(() => {
    if (unauthorized) queryClient.clear();
  }, [queryClient, unauthorized]);

  useSessionExpiry();

  if (session.isPending) {
    return <StatusPanel kind="loading" title="正在验证登录状态" />;
  }
  if (unauthorized) {
    return <Navigate replace to="/login" />;
  }
  // 已有会话数据时，后台刷新失败不应拆掉整个工作区。
  if (session.isError && !session.data) {
    return (
      <StatusPanel
        kind="error"
        title="服务暂时不可用"
        description={sessionErrorDescription(session.error)}
        onRetry={() => void session.refetch()}
      />
    );
  }
  return <Outlet />;
}

export function createAppRoutes(): RouteObject[] {
  const routes: RouteObject[] = [
    {
      path: "/",
      Component: RootRedirect,
      ErrorBoundary: RouteErrorPage,
    },
    {
      path: "/workspace",
      Component: RequireSession,
      ErrorBoundary: RouteErrorPage,
      children: [
        {
          Component: AppLayout,
          children: [
            {
              index: true,
              Component: WorkspaceHomePage,
            },
            {
              path: "orders",
              lazy: async () => ({
                Component: (await import("../pages/orders-page")).OrdersPage,
              }),
            },
            {
              path: "orders/:orderId",
              lazy: async () => ({
                Component: (await import("../pages/order-detail-page")).OrderDetailPage,
              }),
            },
            { path: "*", Component: NotFoundPage },
          ],
        },
      ],
    },
    { path: "*", Component: NotFoundPage },
  ];

  routes.unshift({ path: "/login", Component: LoginPage });

  return routes;
}

export const router = createBrowserRouter(createAppRoutes());
