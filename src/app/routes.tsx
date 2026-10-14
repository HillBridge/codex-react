import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  type RouteObject,
  useNavigate,
  useParams,
} from "react-router";
import { LoginPage } from "../pages/LoginPage";
import { MerchantHomePage } from "../pages/MerchantHomePage";
import { useSession } from "../features/session";
import { ApiError } from "../shared/api/ApiError";
import { StatusPanel } from "../shared/ui/status-panel";
import { AppLayout, NotFoundPage, RouteErrorPage } from "./AppLayout";

function isUnauthorized(error: unknown) {
  return error instanceof ApiError && error.status === 401;
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
    return <StatusPanel kind="error" title="无法读取登录状态" />;
  }

  return <Navigate replace to={`/m/${session.data.merchant.id}`} />;
}

function RequireSession() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const session = useSession();
  const unauthorized = session.isError && isUnauthorized(session.error);

  useEffect(() => {
    if (unauthorized) queryClient.clear();
  }, [queryClient, unauthorized]);

  useEffect(() => {
    const expireSession = () => {
      queryClient.clear();
      navigate("/login", { replace: true });
    };
    window.addEventListener("app:session-expired", expireSession);
    return () => window.removeEventListener("app:session-expired", expireSession);
  }, [navigate, queryClient]);

  if (session.isPending) {
    return <StatusPanel kind="loading" title="正在验证登录状态" />;
  }
  if (unauthorized) {
    return <Navigate replace to="/login" />;
  }
  if (session.isError) {
    return <StatusPanel kind="error" title="登录状态无效" />;
  }
  return <Outlet />;
}

function MerchantRoute() {
  const { merchantId } = useParams();
  const session = useSession();
  if (session.isPending) {
    return <StatusPanel kind="loading" title="正在加载商户" />;
  }
  if (session.isError) {
    return <Navigate replace to="/login" />;
  }
  const merchant = session.data.merchant;
  if (merchant.id !== merchantId) {
    return <StatusPanel kind="forbidden" title="无权访问该商户" />;
  }

  return <Outlet context={{ merchant }} />;
}

export function createAppRoutes(): RouteObject[] {
  const routes: RouteObject[] = [
    {
      path: "/",
      Component: RootRedirect,
      ErrorBoundary: RouteErrorPage,
    },
    {
      path: "/m/:merchantId",
      Component: RequireSession,
      ErrorBoundary: RouteErrorPage,
      children: [
        {
          Component: MerchantRoute,
          children: [
            {
              Component: AppLayout,
              children: [
                { index: true, Component: MerchantHomePage },
                {
                  path: "orders",
                  lazy: async () => ({
                    Component: (await import("../pages/OrdersPage")).OrdersPage,
                  }),
                },
                {
                  path: "orders/:orderId",
                  lazy: async () => ({
                    Component: (await import("../pages/OrderDetailPage")).OrderDetailPage,
                  }),
                },
                { path: "*", Component: NotFoundPage },
              ],
            },
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
