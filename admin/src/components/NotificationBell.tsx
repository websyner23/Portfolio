import { Badge, Button, Dropdown, Empty, List, Typography } from "antd";
import { formatDistanceToNow } from "date-fns";
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
  const { data } = useGetNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const items = data?.data?.items ?? [];
  const unreadCount = data?.data?.unreadCount ?? 0;

  const open = (notification: TNotification) => {
    if (!notification.isRead) void markRead(notification._id);
    if (notification.link) navigate(notification.link);
  };

  const panel = (
    <div
      style={{
        width: 360,
        maxWidth: "90vw",
        background: "var(--ant-color-bg-elevated, #fff)",
        borderRadius: 10,
        boxShadow: "0 6px 24px rgba(0,0,0,.18)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: "1px solid rgba(128,128,128,.2)",
        }}
      >
        <Typography.Text strong>Notifications</Typography.Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={() => void markAllRead()}>
            Mark all read
          </Button>
        )}
      </div>

      <div style={{ maxHeight: 380, overflowY: "auto" }}>
        {items.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Nothing yet"
            style={{ padding: 24 }}
          />
        ) : (
          <List
            dataSource={items}
            renderItem={(item) => (
              <List.Item
                onClick={() => open(item)}
                style={{
                  cursor: "pointer",
                  padding: "10px 14px",
                  background: item.isRead ? undefined : "rgba(15,205,161,.07)",
                }}
              >
                <List.Item.Meta
                  avatar={
                    <span style={{ fontSize: 16, opacity: 0.7 }}>
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
    <Dropdown dropdownRender={() => panel} trigger={["click"]} placement="bottomRight">
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button type="text" icon={<FiBell size={18} />} aria-label="Notifications" />
      </Badge>
    </Dropdown>
  );
};

export default NotificationBell;
