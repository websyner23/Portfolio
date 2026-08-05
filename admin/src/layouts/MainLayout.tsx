import {
  Avatar,
  Button,
  Drawer,
  Dropdown,
  Grid,
  Layout,
  Menu,
  Space,
  Switch,
  theme as antdTheme,
  Typography,
} from "antd";
import { useMemo, useState } from "react";
import {
  FiLogOut,
  FiMenu,
  FiMoon,
  FiSun,
  FiUser,
} from "react-icons/fi";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { BRAND } from "../config";
import { usePermission } from "../hooks/usePermission";
import { logout } from "../redux/features/auth/authSlice";
import { toggleTheme } from "../redux/features/ui/uiSlice";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { routeConfig, TRouteItem } from "../routes/routeConfig";
import NotificationBell from "../components/NotificationBell";
import { useSocket } from "../hooks/useSocket";

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const buildMenuItems = (
  items: TRouteItem[],
  can: (...perms: string[]) => boolean
): { key: string; icon?: React.ReactNode; label: string; children?: unknown[] }[] =>
  items
    .filter((item) => item.label && !item.hideInMenu)
    .filter((item) => {
      const perms = item.permission
        ? Array.isArray(item.permission)
          ? item.permission
          : [item.permission]
        : [];
      return perms.length === 0 || can(...perms);
    })
    .map((item) => ({
      key: item.path,
      icon: item.icon,
      label: item.label as string,
      children: item.children
        ? buildMenuItems(item.children, can).map((c) => ({
            ...c,
            key: c.key.startsWith("/") ? c.key : `${item.path}/${c.key}`,
          }))
        : undefined,
    }));

const MainLayout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const { user, can } = usePermission();
  const themeMode = useAppSelector((s) => s.ui.themeMode);
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { token } = antdTheme.useToken();

  // Opens the realtime feed: toasts + cache invalidation for live tables.
  useSocket();

  const isMobile = !screens.lg;

  const menuItems = useMemo(() => buildMenuItems(routeConfig, can), [can]);

  const selectedKey =
    menuItems
      .flatMap((i) => [i, ...((i.children as { key: string }[]) ?? [])])
      .map((i) => (i as { key: string }).key)
      .filter((key) => location.pathname === key || (key !== "/" && location.pathname.startsWith(key)))
      .sort((a, b) => b.length - a.length)[0] ?? "/";

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    setDrawerOpen(false);
  };

  const menu = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[selectedKey]}
      items={menuItems as never}
      onClick={handleMenuClick}
      style={{ background: "transparent", borderInlineEnd: "none" }}
    />
  );

  const brandBlock = (
    <div
      style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 16px",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: BRAND.colorPrimary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: BRAND.colorNavy,
          fontWeight: 800,
          fontSize: 14,
        }}
      >
        W
      </div>
      <Typography.Text strong style={{ color: "#fff", fontSize: 16 }}>
        {BRAND.name}
      </Typography.Text>
    </div>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={230}
          style={{ background: BRAND.colorNavy }}
        >
          {brandBlock}
          {menu}
        </Sider>
      )}

      <Drawer
        placement="left"
        open={isMobile && drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={250}
        styles={{ body: { padding: 0, background: BRAND.colorNavy } }}
        closable={false}
      >
        {brandBlock}
        {menu}
      </Drawer>

      <Layout>
        <Header
          style={{
            background: token.colorBgContainer,
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <Space>
            {isMobile && (
              <Button
                type="text"
                icon={<FiMenu size={18} />}
                onClick={() => setDrawerOpen(true)}
              />
            )}
          </Space>

          <Space size="middle">
            <NotificationBell />

            <Switch
              checked={themeMode === "dark"}
              onChange={() => dispatch(toggleTheme())}
              checkedChildren={<FiMoon style={{ marginTop: 3 }} />}
              unCheckedChildren={<FiSun style={{ marginTop: 3 }} />}
            />
            <Dropdown
              menu={{
                items: [
                  {
                    key: "profile",
                    icon: <FiUser />,
                    label: "Profile",
                    onClick: () => navigate("/profile"),
                  },
                  { type: "divider" },
                  {
                    key: "logout",
                    icon: <FiLogOut />,
                    label: "Logout",
                    danger: true,
                    onClick: () => {
                      dispatch(logout());
                      navigate("/login");
                    },
                  },
                ],
              }}
            >
              <Space style={{ cursor: "pointer" }}>
                <Avatar
                  src={user?.avatar}
                  style={{ background: BRAND.colorPrimary, color: BRAND.colorNavy }}
                >
                  {user?.name?.[0]?.toUpperCase() ?? "U"}
                </Avatar>
                {!isMobile && (
                  <Typography.Text>{user?.name ?? "User"}</Typography.Text>
                )}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ padding: isMobile ? 12 : 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
