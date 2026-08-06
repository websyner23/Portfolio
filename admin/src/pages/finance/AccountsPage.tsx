import {
  Button,
  Card,
  Col,
  Drawer,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { FiEdit2, FiPlus } from "react-icons/fi";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import {
  useCreateAccountMutation,
  useGetAccountsQuery,
  useUpdateAccountMutation,
  type TAccount,
} from "../../redux/api/financeApi";
import { money } from "./FinanceOverviewPage";

const AccountsPage = () => {
  const { data, isFetching } = useGetAccountsQuery();
  const [createAccount, { isLoading: creating }] = useCreateAccountMutation();
  const [updateAccount, { isLoading: updating }] = useUpdateAccountMutation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TAccount | null>(null);
  const [form] = Form.useForm();

  const accounts = data?.data ?? [];
  const total = accounts.reduce((sum, a) => sum + a.balance, 0);

  useEffect(() => {
    if (!open) return;
    if (editing) form.setFieldsValue(editing);
    else form.resetFields();
  }, [open, editing, form]);

  const onSubmit = async (values: Record<string, unknown>) => {
    try {
      if (editing) {
        await updateAccount({ id: editing._id, body: values }).unwrap();
        toast.success("Account updated");
      } else {
        await createAccount(values).unwrap();
        toast.success("Account created");
      }
      setOpen(false);
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not save the account"
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="Accounts"
        subtitle="Balances are always derived from transactions, so they can't drift out of sync"
        extra={
          <Button
            type="primary"
            icon={<FiPlus />}
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            New account
          </Button>
        }
      />

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card size="small" loading={isFetching}>
            <Statistic
              title="Total across accounts"
              value={money(total)}
              valueStyle={{ color: "#0fcda1" }}
            />
          </Card>
        </Col>
      </Row>

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="_id"
          loading={isFetching}
          dataSource={accounts}
          scroll={{ x: 700 }}
          pagination={false}
          columns={[
            { title: "Account", dataIndex: "name" },
            {
              title: "Type",
              dataIndex: "type",
              width: 150,
              render: (v: string) => <Tag>{v}</Tag>,
            },
            {
              title: "Opening",
              dataIndex: "openingBalance",
              width: 130,
              render: (v: number) => money(v),
            },
            {
              title: "Current balance",
              dataIndex: "balance",
              width: 160,
              render: (v: number) => (
                <Typography.Text strong type={v < 0 ? "danger" : undefined}>
                  {money(v)}
                </Typography.Text>
              ),
            },
            {
              title: "Status",
              dataIndex: "isActive",
              width: 100,
              render: (v: boolean) => (
                <Tag color={v ? "green" : "default"}>{v ? "active" : "closed"}</Tag>
              ),
            },
            {
              title: "",
              width: 60,
              align: "right",
              render: (_: unknown, row: TAccount) => (
                <Button
                  size="small"
                  icon={<FiEdit2 />}
                  onClick={() => {
                    setEditing(row);
                    setOpen(true);
                  }}
                />
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        title={editing ? `Edit ${editing.name}` : "New account"}
        open={open}
        onClose={() => setOpen(false)}
        width={400}
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
        <Form
          form={form}
          layout="vertical"
          onFinish={onSubmit}
          initialValues={{ type: "bank", isActive: true, openingBalance: 0 }}
        >
          <Form.Item
            name="name"
            label="Account name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="Business Bank" />
          </Form.Item>
          <Form.Item name="type" label="Type">
            <Select
              options={[
                { value: "bank", label: "Bank" },
                { value: "cash", label: "Cash" },
                { value: "mobile-banking", label: "Mobile banking" },
                { value: "other", label: "Other" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="openingBalance"
            label="Opening balance (৳)"
            extra={
              editing
                ? "Changing this shifts the current balance by the same amount"
                : "The balance this account started with"
            }
          >
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="accountNumber" label="Account number">
            <Input />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="note" label="Note">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default AccountsPage;
