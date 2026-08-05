import {
  Avatar,
  Button,
  Card,
  Drawer,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { FiEdit2, FiKey, FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import { BRAND } from "../../config";
import { useTableQuery } from "../../hooks/useTableQuery";
import { useGetRolesQuery } from "../../redux/api/roleApi";
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useGetUsersQuery,
  useResetUserPasswordMutation,
  useUpdateUserMutation,
} from "../../redux/api/userApi";
import { TUser } from "../../types";

const UsersPage = () => {
  const table = useTableQuery();
  const { data: usersRes, isFetching } = useGetUsersQuery(table.params);
  const { data: rolesRes } = useGetRolesQuery({ limit: 100 });
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [resetPassword] = useResetUserPasswordMutation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TUser | null>(null);
  const [form] = Form.useForm();

  const roleOptions =
    rolesRes?.data?.map((r) => ({ value: r._id, label: r.name })) ?? [];

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        editing
          ? {
              name: editing.name,
              email: editing.email,
              role: editing.role?._id,
              status: editing.status === "active",
            }
          : { status: true }
      );
    }
  }, [open, editing, form]);

  const onSubmit = async (values: Record<string, unknown>) => {
    const body = {
      ...values,
      status: values.status ? "active" : "blocked",
    };
    try {
      if (editing) {
        await updateUser({ id: editing._id, body }).unwrap();
        toast.success("User updated");
      } else {
        const res = await createUser(body).unwrap();
        const temp = res.data?.temporaryPassword;
        toast.success(
          temp
            ? `User created — temporary password: ${temp}`
            : "User created — credentials emailed",
          { duration: temp ? 15000 : 4000 }
        );
      }
      setOpen(false);
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not save user"
      );
    }
  };

  const askResetPassword = (user: TUser) => {
    let value = "";
    Modal.confirm({
      title: `Reset password for ${user.name}`,
      content: (
        <Input.Password
          placeholder="New password (min 6 characters)"
          onChange={(e) => (value = e.target.value)}
          style={{ marginTop: 12 }}
        />
      ),
      okText: "Reset",
      onOk: async () => {
        if (value.length < 6) {
          toast.error("Password must be at least 6 characters");
          throw new Error("too short");
        }
        await resetPassword({ id: user._id, newPassword: value }).unwrap();
        toast.success("Password reset — user must change it at next login");
      },
    });
  };

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Admin panel accounts and their roles"
        extra={
          <>
            <Input.Search
              placeholder="Search name or email"
              allowClear
              onSearch={table.search}
              style={{ width: 240 }}
            />
            <Button
              type="primary"
              icon={<FiPlus />}
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              New user
            </Button>
          </>
        }
      />

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="_id"
          loading={isFetching}
          dataSource={usersRes?.data ?? []}
          scroll={{ x: 820 }}
          pagination={{
            current: table.page,
            pageSize: table.limit,
            total: usersRes?.meta?.total ?? 0,
            showSizeChanger: true,
            onChange: (p, ps) => {
              table.setPage(p);
              table.setLimit(ps);
            },
          }}
          columns={[
            {
              title: "User",
              dataIndex: "name",
              render: (name: string, row: TUser) => (
                <Space>
                  <Avatar
                    src={row.avatar}
                    style={{
                      background: BRAND.colorPrimary,
                      color: BRAND.colorNavy,
                    }}
                  >
                    {name?.[0]?.toUpperCase()}
                  </Avatar>
                  <Space direction="vertical" size={0}>
                    <Typography.Text strong>{name}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {row.email}
                    </Typography.Text>
                  </Space>
                </Space>
              ),
            },
            {
              title: "Role",
              dataIndex: ["role", "name"],
              render: (role: string) => <Tag>{role}</Tag>,
            },
            {
              title: "Status",
              dataIndex: "status",
              render: (status: string) => (
                <Tag color={status === "active" ? "green" : "red"}>{status}</Tag>
              ),
            },
            {
              title: "Last login",
              dataIndex: "lastLoginAt",
              render: (d?: string) =>
                d ? (
                  format(new Date(d), "dd MMM yyyy, h:mm a")
                ) : (
                  <Typography.Text type="secondary">never</Typography.Text>
                ),
            },
            {
              title: "",
              width: 140,
              align: "right",
              render: (_: unknown, row: TUser) => (
                <Space>
                  <Button
                    size="small"
                    icon={<FiEdit2 />}
                    onClick={() => {
                      setEditing(row);
                      setOpen(true);
                    }}
                  />
                  <Button
                    size="small"
                    icon={<FiKey />}
                    onClick={() => askResetPassword(row)}
                  />
                  <Popconfirm
                    title="Delete this user?"
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    onConfirm={async () => {
                      try {
                        await deleteUser(row._id).unwrap();
                        toast.success("User deleted");
                      } catch (err) {
                        toast.error(
                          (err as { data?: { message?: string } })?.data
                            ?.message ?? "Could not delete user"
                        );
                      }
                    }}
                  >
                    <Button size="small" danger icon={<FiTrash2 />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        title={editing ? `Edit ${editing.name}` : "New user"}
        open={open}
        onClose={() => setOpen(false)}
        width={460}
        extra={
          <Button
            type="primary"
            loading={creating || updating}
            onClick={() => form.submit()}
          >
            Save
          </Button>
        }
      >
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item
            name="name"
            label="Full name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="Jane Doe" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Enter a valid email" },
            ]}
          >
            <Input placeholder="jane@websyner.co" />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: "Role is required" }]}
          >
            <Select options={roleOptions} placeholder="Select a role" />
          </Form.Item>
          {!editing && (
            <Form.Item
              name="password"
              label="Password"
              extra="Leave empty to generate one and email it to the user"
            >
              <Input.Password placeholder="Optional" />
            </Form.Item>
          )}
          <Form.Item name="status" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default UsersPage;
