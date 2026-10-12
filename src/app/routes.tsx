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
import { useMerchants } from "../features/merchant";
import { useSession } from "../features/session";
import { ApiError } from "../shared/api/ApiError";
import { StatusPanel } from "../shared/ui/StatusPanel";
import { AppLayout, NotFoundPage, RouteErrorPage } from "./AppLayout";

function isUnauthorized(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

function RootRedirect() {
  const session = useSession();
  const merchants = useMerchants();

  if (session.isPending || (session.isSuccess && merchants.isPending)) {
    return <StatusPanel kind="loading" title="正在加载工作区" />;
  }

  if (session.isError) {
    if (isUnauthorized(session.error) && import.meta.env.DEV) {
      return <Navigate replace to="/dev-login" />;
    }
    return <StatusPanel kind="error" title="无法读取登录状态" />;
  }

  if (merchants.isError) {
    return <StatusPanel kind="error" title="无法读取商户列表" />;
  }

  const firstMerchant = merchants.data?.items[0];
  return firstMerchant ? (
    <Navigate replace to={`/m/${firstMerchant.id}`} />
  ) : (
    <StatusPanel kind="forbidden" title="当前账号没有可访问的商户" />
  );
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
      navigate(import.meta.env.DEV ? "/dev-login" : "/", { replace: true });
    };
    window.addEventListener("app:session-expired", expireSession);
    return () => window.removeEventListener("app:session-expired", expireSession);
  }, [navigate, queryClient]);

  if (session.isPending) {
    return <StatusPanel kind="loading" title="正在验证登录状态" />;
  }
  if (unauthorized && import.meta.env.DEV) {
    return <Navigate replace to="/dev-login" />;
  }
  if (session.isError) {
    return <StatusPanel kind="error" title="登录状态无效" />;
  }
  return <Outlet />;
}

function MerchantRoute() {
  const queryClient = useQueryClient();
  const { merchantId } = useParams();
  const merchants = useMerchants();
  const unauthorized = merchants.isError && isUnauthorized(merchants.error);

  useEffect(() => {
    if (unauthorized) queryClient.clear();
  }, [queryClient, unauthorized]);

  if (merchants.isPending) {
    return <StatusPanel kind="loading" title="正在加载商户" />;
  }
  if (unauthorized && import.meta.env.DEV) {
    return <Navigate replace to="/dev-login" />;
  }
  if (merchants.isError) {
    return <StatusPanel kind="error" title="无法读取商户列表" />;
  }

  const merchant = merchants.data.items.find((item) => item.id === merchantId);
  if (!merchant) {
    return <StatusPanel kind="forbidden" title="无权访问该商户" />;
  }

  return <Outlet context={{ merchant, merchants: merchants.data.items }} />;
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

  if (import.meta.env.DEV) {
    routes.unshift({ path: "/dev-login", Component: LoginPage });
  }

  return routes;
}

export const router = createBrowserRouter(createAppRoutes());
