import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import { format } from "date-fns";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import { BRAND } from "../../config";
import { usePermission } from "../../hooks/usePermission";
import {
  useChangePasswordMutation,
  useGetMeQuery,
} from "../../redux/api/authApi";

const ProfilePage = () => {
  const { user, isSuperAdmin } = usePermission();
  const { data: meRes } = useGetMeQuery();
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [form] = Form.useForm();

  const me = meRes?.data ?? user;

  const onChangePassword = async (values: {
    oldPassword: string;
    newPassword: string;
  }) => {
    try {
      await changePassword(values).unwrap();
      toast.success("Password changed");
      form.resetFields();
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not change password"
      );
    }
  };

  return (
    <div>
      <PageHeader title="My Profile" />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card>
            <Space align="start" size="large" wrap>
              <Avatar
                size={72}
                src={me?.avatar}
                style={{
                  background: BRAND.colorPrimary,
                  color: BRAND.colorNavy,
                  fontSize: 30,
                }}
              >
                {me?.name?.[0]?.toUpperCase()}
              </Avatar>
              <div>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {me?.name}
                </Typography.Title>
                <Typography.Text type="secondary">{me?.email}</Typography.Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color={isSuperAdmin ? "green" : "blue"}>
                    {me?.role?.name}
                  </Tag>
                </div>
              </div>
            </Space>

            <Descriptions column={1} style={{ marginTop: 24 }} bordered size="small">
              <Descriptions.Item label="Permissions">
                {isSuperAdmin ? (
                  <Tag color="green">All permissions</Tag>
                ) : (
                  <Space wrap size={[4, 4]}>
                    {me?.role?.permissions?.map((p) => (
                      <Tag key={p} style={{ fontSize: 11 }}>
                        {p}
                      </Tag>
                    ))}
                  </Space>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Last login">
                {me?.lastLoginAt
                  ? format(new Date(me.lastLoginAt), "dd MMM yyyy, h:mm a")
                  : "—"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="Change password">
            <Form form={form} layout="vertical" onFinish={onChangePassword}>
              <Form.Item
                name="oldPassword"
                label="Current password"
                rules={[{ required: true, message: "Required" }]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                name="newPassword"
                label="New password"
                rules={[
                  { required: true, message: "Required" },
                  { min: 6, message: "At least 6 characters" },
                ]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                name="confirm"
                label="Confirm new password"
                dependencies={["newPassword"]}
                rules={[
                  { required: true, message: "Required" },
                  ({ getFieldValue }) => ({
                    validator: (_, value) =>
                      !value || getFieldValue("newPassword") === value
                        ? Promise.resolve()
                        : Promise.reject(new Error("Passwords do not match")),
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={isLoading} block>
                Update password
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfilePage;
