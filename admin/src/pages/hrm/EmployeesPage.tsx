import {
  Alert,
  Button,
  Card,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { FiEdit2, FiLink2, FiPlus, FiUserX } from "react-icons/fi";
import { toast } from "sonner";
import ExportXlsxButton from "../../components/ExportXlsxButton";
import PageHeader from "../../components/PageHeader";
import { useTableQuery } from "../../hooks/useTableQuery";
import LinkLoginModal from "./LinkLoginModal";
import {
  useCreateEmployeeMutation,
  useDeactivateEmployeeMutation,
  useGetEmployeesQuery,
  useGetLinkableUsersQuery,
  useUnlinkEmployeeUserMutation,
  useUpdateEmployeeMutation,
  type TEmployee,
  type TLinkableUser,
} from "../../redux/api/hrmApi";

const EmployeesPage = () => {
  const table = useTableQuery();
  const { data, isFetching } = useGetEmployeesQuery(table.params);
  const [createEmployee, { isLoading: creating }] = useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: updating }] = useUpdateEmployeeMutation();
  const [deactivate] = useDeactivateEmployeeMutation();
  const [unlinkUser] = useUnlinkEmployeeUserMutation();
  const { data: linkableRes, isFetching: loadingUsers } =
    useGetLinkableUsersQuery();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TEmployee | null>(null);
  const [linking, setLinking] = useState<TEmployee | null>(null);
  const [selectedUser, setSelectedUser] = useState<TLinkableUser | null>(null);
  const [form] = Form.useForm();

  const employees = data?.data ?? [];
  const linkableUsers = linkableRes?.data ?? [];

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue(editing);
    } else {
      form.resetFields();
      setSelectedUser(null);
      form.setFieldsValue({ isActive: true });
    }
  }, [open, editing, form]);

  const onSubmit = async (values: Record<string, unknown>) => {
    try {
      if (editing) {
        // `user` is fixed at creation — name and email follow the account.
        const { user, fullName, email, ...body } = values;
        await updateEmployee({ id: editing._id, body }).unwrap();
        toast.success("Employee updated");
      } else {
        const res = await createEmployee(values).unwrap();
        toast.success(res.message ?? "Employee added");
      }
      setOpen(false);
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not save the employee"
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Team directory, salaries and the accounts linked to the punch panel"
        extra={
          <>
            <Input.Search
              placeholder="Search name, email, ID"
              allowClear
              onSearch={table.search}
              style={{ width: 230 }}
            />
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 130 }}
              options={[
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
              onChange={(v) => table.setFilter("isActive", v)}
            />
            <ExportXlsxButton
              fileName="websyner-employees"
              sheetName="Employees"
              rows={employees.map((e) => ({
                "Employee ID": e.employeeId,
                "Full Name": e.fullName,
                Email: e.email,
                Role: e.designation ?? "",
                "Join Date": e.joinDate,
                "Last Working Date": e.lastWorkingDate ?? "",
                Active: e.isActive ? "Yes" : "No",
                "Base Salary": e.baseSalary,
                "Perfect Bonus": e.perfectBonus,
              }))}
            />
            <Button
              type="primary"
              icon={<FiPlus />}
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              Add employee
            </Button>
          </>
        }
      />

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="_id"
          loading={isFetching}
          dataSource={employees}
          scroll={{ x: 940 }}
          pagination={{ pageSize: 20, hideOnSinglePage: true }}
          columns={[
            {
              title: "ID",
              dataIndex: "employeeId",
              width: 100,
              render: (v: string) => <Tag>{v}</Tag>,
            },
            {
              title: "Name",
              dataIndex: "fullName",
              render: (name: string, row: TEmployee) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>{name}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {row.email}
                  </Typography.Text>
                </Space>
              ),
            },
            { title: "Role", dataIndex: "designation", width: 150 },
            { title: "Joined", dataIndex: "joinDate", width: 120 },
            {
              title: "Salary",
              dataIndex: "baseSalary",
              width: 110,
              render: (v: number) => `৳${v.toLocaleString()}`,
            },
            {
              title: "Bonus",
              dataIndex: "perfectBonus",
              width: 100,
              render: (v: number) => `৳${v.toLocaleString()}`,
            },
            {
              title: "Punch panel login",
              dataIndex: "user",
              width: 190,
              render: (user: TEmployee["user"], row: TEmployee) =>
                user ? (
                  <Space size={4}>
                    <Tag color="blue">{user.email}</Tag>
                    <Popconfirm
                      title="Unlink this login?"
                      description="They'll lose punch-panel access. The account itself is kept."
                      okText="Unlink"
                      okButtonProps={{ danger: true }}
                      onConfirm={async () => {
                        try {
                          await unlinkUser(row._id).unwrap();
                          toast.success("Login unlinked");
                        } catch (err) {
                          toast.error(
                            (err as { data?: { message?: string } })?.data
                              ?.message ?? "Could not unlink"
                          );
                        }
                      }}
                    >
                      <Button size="small" type="text" icon={<FiLink2 />} />
                    </Popconfirm>
                  </Space>
                ) : (
                  <Button
                    size="small"
                    icon={<FiLink2 />}
                    onClick={() => setLinking(row)}
                  >
                    Link login
                  </Button>
                ),
            },
            {
              title: "Status",
              dataIndex: "isActive",
              width: 100,
              render: (v: boolean) => (
                <Tag color={v ? "green" : "default"}>
                  {v ? "active" : "inactive"}
                </Tag>
              ),
            },
            {
              title: "",
              width: 90,
              align: "right",
              fixed: "right",
              render: (_: unknown, row: TEmployee) => (
                <Space>
                  <Button
                    size="small"
                    icon={<FiEdit2 />}
                    onClick={() => {
                      setEditing(row);
                      setOpen(true);
                    }}
                  />
                  <Popconfirm
                    title="Deactivate this employee?"
                    description="Attendance history is kept for payroll."
                    okText="Deactivate"
                    okButtonProps={{ danger: true }}
                    onConfirm={async () => {
                      try {
                        await deactivate(row._id).unwrap();
                        toast.success("Employee deactivated");
                      } catch {
                        toast.error("Could not deactivate");
                      }
                    }}
                  >
                    <Button
                      size="small"
                      danger
                      icon={<FiUserX />}
                      disabled={!row.isActive}
                    />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        title={editing ? `Edit ${editing.fullName}` : "Add employee"}
        open={open}
        onClose={() => setOpen(false)}
        width={520}
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
          {editing ? (
            // Name and email belong to the login account — editing them here
            // would just let the two drift apart.
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message={`${editing.fullName} · ${editing.email}`}
              description="Name and email come from the linked login. Change them under Users and they update here automatically."
            />
          ) : (
            <>
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message="An employee is created from an existing login"
                description="Their name and email come from that account, and the link gives them punch-panel access straight away. Create the user first under Users if they don't have one yet."
              />
              <Form.Item
                name="user"
                label="Login account"
                rules={[{ required: true, message: "Pick the user this record is for" }]}
              >
                <Select
                  placeholder={
                    linkableUsers.length
                      ? "Pick a user"
                      : "Every user already has an employee record"
                  }
                  loading={loadingUsers}
                  showSearch
                  optionFilterProp="label"
                  options={linkableUsers.map((u) => ({
                    value: u._id,
                    label: `${u.name} — ${u.email}`,
                  }))}
                  onChange={(value) => {
                    const picked = linkableUsers.find((u) => u._id === value);
                    setSelectedUser(picked ?? null);
                  }}
                />
              </Form.Item>

              {selectedUser && !selectedUser.canPunch && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message={`The "${selectedUser.roleName}" role can't clock in`}
                  description='Add the "attendance.punch" permission to that role under Roles & Permissions, or they won’t be able to use the punch panel.'
                />
              )}
            </>
          )}

          <Form.Item
            name="employeeId"
            label="Employee ID"
            extra="Leave empty to generate the next one automatically"
          >
            <Input placeholder="WS-001" />
          </Form.Item>
          <Space style={{ display: "flex" }} align="start">
            <Form.Item name="designation" label="Role" style={{ flex: 1 }}>
              <Input placeholder="Developer" />
            </Form.Item>
            <Form.Item name="phone" label="Phone" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>
          <Space style={{ display: "flex" }} align="start">
            <Form.Item
              name="joinDate"
              label="Join date"
              rules={[{ required: true, message: "Join date is required" }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item
              name="lastWorkingDate"
              label="Last working date"
              style={{ flex: 1 }}
            >
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
          </Space>
          <Space style={{ display: "flex" }} align="start">
            <Form.Item name="baseSalary" label="Base salary (৳)" style={{ flex: 1 }}>
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
            <Form.Item
              name="perfectBonus"
              label="Perfect bonus (৳)"
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Space>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
          {!editing && (
            <Form.Item
              name="createLogin"
              label="Create a login for the punch panel"
              valuePropName="checked"
              extra="Emails the employee a temporary password"
            >
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Drawer>
      {linking && (
        <LinkLoginModal employee={linking} onClose={() => setLinking(null)} />
      )}
    </div>
  );
};

export default EmployeesPage;
