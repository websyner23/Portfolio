import {
  Badge,
  Button,
  Empty,
  List,
  Popover,
  Space,
  theme as antdTheme,
  Typography,
} from "antd";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { FiBell, FiCalendar, FiInbox, FiUserCheck } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  type TNotification,
} from "../redux/api/notificationApi";

const iconFor = (type: string) => {
  if (type.startsWith("lead")) return <FiInbox />;
  if (type.startsWith("meeting")) return <FiCalendar />;
  if (type.startsWith("attendance")) return <FiUserCheck />;
  return <FiBell />;
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  // Theme tokens rather than CSS variables: antd 5 uses CSS-in-JS by default,
  // so `var(--ant-*)` isn't defined and a hardcoded panel goes white-on-white
  // in dark mode.
  const { token } = antdTheme.useToken();

  const { data } = useGetNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const items = data?.data?.items ?? [];
  const unreadCount = data?.data?.unreadCount ?? 0;

  const openItem = (notification: TNotification) => {
    if (!notification.isRead) void markRead(notification._id);
    setOpen(false);
    if (notification.link) navigate(notification.link);
  };

  const panel = (
    <div style={{ width: 380, maxWidth: "88vw" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 8,
          marginBottom: 4,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Typography.Text strong>
          Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
        </Typography.Text>
        <Space size={0}>
          {unreadCount > 0 && (
            <Button type="link" size="small" onClick={() => void markAllRead()}>
              Mark all read
            </Button>
          )}
          <Button
            type="link"
            size="small"
            onClick={() => {
              setOpen(false);
              navigate("/notifications");
            }}
          >
            See all
          </Button>
        </Space>
      </div>

      <div style={{ maxHeight: 400, overflowY: "auto", margin: "0 -12px" }}>
        {items.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Nothing yet"
            style={{ padding: "20px 0" }}
          />
        ) : (
          <List
            dataSource={items}
            renderItem={(item) => (
              <List.Item
                onClick={() => openItem(item)}
                style={{
                  cursor: "pointer",
                  padding: "10px 12px",
                  background: item.isRead ? undefined : token.colorPrimaryBg,
                  borderRadius: 6,
                }}
              >
                <List.Item.Meta
                  avatar={
                    <span
                      style={{
                        fontSize: 16,
                        color: token.colorTextSecondary,
                        display: "inline-flex",
                        marginTop: 2,
                      }}
                    >
                      {iconFor(item.type)}
                    </span>
                  }
                  title={
                    <Typography.Text
                      strong={!item.isRead}
                      style={{ fontSize: 13 }}
                    >
                      {item.title}
                    </Typography.Text>
                  }
                  description={
                    <div>
                      {item.body && (
                        <Typography.Paragraph
                          type="secondary"
                          ellipsis={{ rows: 2 }}
                          style={{ fontSize: 12, marginBottom: 2 }}
                        >
                          {item.body}
                        </Typography.Paragraph>
                      )}
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                        })}
                      </Typography.Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );

  return (
    // Popover supplies its own themed surface, so there's nothing to style by
    // hand — and it avoids Dropdown's deprecated `dropdownRender`.
    <Popover
      content={panel}
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
      styles={{ body: { padding: 12 } }}
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button type="text" icon={<FiBell size={18} />} aria-label="Notifications" />
      </Badge>
    </Popover>
  );
};

export default NotificationBell;
