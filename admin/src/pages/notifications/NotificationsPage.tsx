import { Button, Card, Empty, List, Space, Tag, Typography } from "antd";
import { formatDistanceToNow } from "date-fns";
import { FiCalendar, FiCheckCircle, FiInbox, FiUserCheck } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  type TNotification,
} from "../../redux/api/notificationApi";

const iconFor = (type: string) => {
  if (type.startsWith("lead")) return <FiInbox />;
  if (type.startsWith("meeting")) return <FiCalendar />;
  if (type.startsWith("attendance")) return <FiUserCheck />;
  return <FiCheckCircle />;
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { data, isFetching } = useGetNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const items = data?.data?.items ?? [];
  const unreadCount = data?.data?.unreadCount ?? 0;

  const open = (notification: TNotification) => {
    if (!notification.isRead) void markRead(notification._id);
    if (notification.link) navigate(notification.link);
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread`
            : "You're all caught up"
        }
        extra={
          unreadCount > 0 ? (
            <Button onClick={() => void markAllRead()}>Mark all read</Button>
          ) : undefined
        }
      />

      <Card loading={isFetching} styles={{ body: { padding: items.length ? 0 : 24 } }}>
        {items.length === 0 ? (
          <Empty description="No notifications yet" />
        ) : (
          <List
            dataSource={items}
            renderItem={(item) => (
              <List.Item
                onClick={() => open(item)}
                style={{
                  cursor: item.link ? "pointer" : "default",
                  padding: "14px 20px",
                  background: item.isRead ? undefined : "rgba(15,205,161,.07)",
                }}
              >
                <List.Item.Meta
                  avatar={
                    <span style={{ fontSize: 18, opacity: 0.7 }}>
                      {iconFor(item.type)}
                    </span>
                  }
                  title={
                    <Space>
                      <Typography.Text strong={!item.isRead}>
                        {item.title}
                      </Typography.Text>
                      {!item.isRead && <Tag color="green">new</Tag>}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={2}>
                      {item.body && (
                        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                          {item.body}
                        </Typography.Text>
                      )}
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                        })}
                      </Typography.Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default NotificationsPage;
