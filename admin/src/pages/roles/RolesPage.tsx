import {
  Button,
  Card,
  Checkbox,
  Col,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import {
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useGetPermissionCatalogQuery,
  useGetRolesQuery,
  useUpdateRoleMutation,
} from "../../redux/api/roleApi";
import { TRole } from "../../types";

const RolesPage = () => {
  const { data: rolesRes, isFetching } = useGetRolesQuery({ limit: 100 });
  const { data: catalogRes } = useGetPermissionCatalogQuery();
  const [createRole, { isLoading: creating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: updating }] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TRole | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [form] = Form.useForm();

  const roles = rolesRes?.data ?? [];
  const groups = catalogRes?.data?.groups ?? {};

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: editing?.name ?? "",
        description: editing?.description ?? "",
      });
      setSelected(editing?.permissions ?? []);
    }
  }, [open, editing, form]);

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (role: TRole) => {
    setEditing(role);
    setOpen(true);
  };

  const toggleGroup = (keys: string[], checked: boolean) => {
    setSelected((prev) =>
      checked
        ? Array.from(new Set([...prev, ...keys]))
        : prev.filter((p) => !keys.includes(p))
    );
  };

  const onSubmit = async (values: { name: string; description?: string }) => {
    try {
      if (editing) {
        await updateRole({
          id: editing._id,
          body: { ...values, permissions: selected },
        }).unwrap();
        toast.success("Role updated");
      } else {
        await createRole({ ...values, permissions: selected }).unwrap();
        toast.success("Role created");
      }
      setOpen(false);
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not save role"
      );
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteRole(id).unwrap();
      toast.success("Role deleted");
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not delete role"
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Control what each role can see and do across the admin panel"
        extra={
          <Button type="primary" icon={<FiPlus />} onClick={openCreate}>
            New role
          </Button>
        }
      />

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="_id"
          loading={isFetching}
          dataSource={roles}
          pagination={false}
          scroll={{ x: 720 }}
          columns={[
            {
              title: "Role",
              dataIndex: "name",
              render: (name: string, row: TRole) => (
                <Space direction="vertical" size={0}>
                  <Space>
                    <Typography.Text strong>{name}</Typography.Text>
                    {row.isSystem && <Tag color="blue">system</Tag>}
                  </Space>
                  {row.description && (
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {row.description}
                    </Typography.Text>
                  )}
                </Space>
              ),
            },
            {
              title: "Permissions",
              dataIndex: "permissions",
              render: (perms: string[]) =>
                perms.length >= (catalogRes?.data?.all.length ?? Infinity) ? (
                  <Tag color="green">All permissions</Tag>
                ) : (
                  <Typography.Text type="secondary">
                    {perms.length} permission{perms.length === 1 ? "" : "s"}
                  </Typography.Text>
                ),
            },
            {
              title: "",
              width: 110,
              align: "right",
              render: (_: unknown, row: TRole) => (
                <Space>
                  <Button
                    size="small"
                    icon={<FiEdit2 />}
                    onClick={() => openEdit(row)}
                    disabled={row.name === "super-admin"}
                  />
                  <Popconfirm
                    title="Delete this role?"
                    onConfirm={() => onDelete(row._id)}
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      size="small"
                      danger
                      icon={<FiTrash2 />}
                      disabled={row.isSystem}
                    />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        title={editing ? `Edit role — ${editing.name}` : "New role"}
        open={open}
        onClose={() => setOpen(false)}
        width={640}
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
            label="Role name"
            rules={[
              { required: true, message: "Role name is required" },
              {
                pattern: /^[a-z0-9-]+$/,
                message: "Lowercase letters, numbers and dashes only",
              },
            ]}
          >
            <Input placeholder="content-editor" disabled={editing?.isSystem} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input placeholder="What this role is for" />
          </Form.Item>
        </Form>

        <Typography.Title level={5}>Permissions</Typography.Title>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          {Object.entries(groups).map(([group, perms]) => {
            const keys = perms.map((p) => p.key);
            const allChecked = keys.every((k) => selected.includes(k));
            const someChecked = keys.some((k) => selected.includes(k));

            return (
              <Card key={group} size="small" title={group}>
                <Checkbox
                  checked={allChecked}
                  indeterminate={!allChecked && someChecked}
                  onChange={(e) => toggleGroup(keys, e.target.checked)}
                  style={{ marginBottom: 10 }}
                >
                  <Typography.Text type="secondary">Select all</Typography.Text>
                </Checkbox>
                <Row gutter={[8, 8]}>
                  {perms.map((p) => (
                    <Col xs={24} sm={12} key={p.key}>
                      <Checkbox
                        checked={selected.includes(p.key)}
                        onChange={(e) =>
                          setSelected((prev) =>
                            e.target.checked
                              ? [...prev, p.key]
                              : prev.filter((x) => x !== p.key)
                          )
                        }
                      >
                        {p.label}
                      </Checkbox>
                    </Col>
                  ))}
                </Row>
              </Card>
            );
          })}
        </Space>
      </Drawer>
    </div>
  );
};

export default RolesPage;
