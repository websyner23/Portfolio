import {
  Button,
  Card,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { FiDollarSign, FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import { useTableQuery } from "../../hooks/useTableQuery";
import {
  useAddReceivablePaymentMutation,
  useCreateReceivableMutation,
  useDeleteReceivableMutation,
  useGetAccountsQuery,
  useGetReceivablesQuery,
  type TReceivable,
} from "../../redux/api/financeApi";
import { money } from "./FinanceOverviewPage";

const STATUS_COLORS: Record<string, string> = {
  pending: "gold",
  partial: "blue",
  paid: "green",
  "written-off": "default",
};

const outstandingOf = (row: TReceivable) =>
  row.amount - (row.payments?.reduce((t, p) => t + p.amount, 0) ?? 0);

const ReceivablesPage = () => {
  const table = useTableQuery();
  const { data, isFetching } = useGetReceivablesQuery(table.params);
  const { data: accountsRes } = useGetAccountsQuery();
  const [createReceivable, { isLoading: saving }] = useCreateReceivableMutation();
  const [addPayment] = useAddReceivablePaymentMutation();
  const [deleteReceivable] = useDeleteReceivableMutation();

  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const accountOptions =
    accountsRes?.data?.map((a) => ({ value: a._id, label: a.name })) ?? [];

  const onSubmit = async (values: Record<string, unknown>) => {
    try {
      await createReceivable({
        ...values,
        dueDate: values.dueDate
          ? dayjs(values.dueDate as dayjs.Dayjs).format("YYYY-MM-DD")
          : undefined,
      }).unwrap();
      toast.success("Receivable added");
      setOpen(false);
      form.resetFields();
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not add the receivable"
      );
    }
  };

  const onRecordPayment = (row: TReceivable) => {
    const outstanding = outstandingOf(row);
    let amount = outstanding;
    let accountId = accountOptions[0]?.value;
    let date = dayjs().format("YYYY-MM-DD");

    Modal.confirm({
      title: `Record a payment for "${row.title}"`,
      content: (
        <div style={{ marginTop: 12 }}>
          <Typography.Paragraph type="secondary">
            {money(outstanding)} still outstanding.
          </Typography.Paragraph>
          <InputNumber
            defaultValue={outstanding}
            min={0.01}
            max={outstanding}
            style={{ width: "100%", marginBottom: 10 }}
            onChange={(v) => (amount = Number(v))}
          />
          <Select
            options={accountOptions}
            defaultValue={accountId}
            placeholder="Deposit into"
            style={{ width: "100%", marginBottom: 10 }}
            onChange={(v) => (accountId = v)}
          />
          <DatePicker
            defaultValue={dayjs()}
            style={{ width: "100%" }}
            onChange={(d) => (date = d ? d.format("YYYY-MM-DD") : date)}
          />
        </div>
      ),
      okText: "Record",
      onOk: async () => {
        if (!accountId) {
          toast.error("Create a finance account first");
          throw new Error("no account");
        }
        try {
          await addPayment({
            id: row._id,
            body: { amount, account: accountId, date },
          }).unwrap();
          toast.success("Payment recorded and booked as income");
        } catch (err) {
          toast.error(
            (err as { data?: { message?: string } })?.data?.message ??
              "Could not record the payment"
          );
          throw err;
        }
      },
    });
  };

  return (
    <div>
      <PageHeader
        title="Pending Income"
        subtitle="What clients still owe — recording a payment books the income automatically"
        extra={
          <>
            <Input.Search
              placeholder="Search title or client"
              allowClear
              onSearch={table.search}
              style={{ width: 220 }}
            />
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 140 }}
              options={[
                { value: "pending", label: "Pending" },
                { value: "partial", label: "Partial" },
                { value: "paid", label: "Paid" },
              ]}
              onChange={(v) => table.setFilter("status", v)}
            />
            <Button type="primary" icon={<FiPlus />} onClick={() => setOpen(true)}>
              Add
            </Button>
          </>
        }
      />

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="_id"
          loading={isFetching}
          dataSource={data?.data ?? []}
          scroll={{ x: 900 }}
          pagination={{
            current: table.page,
            pageSize: table.limit,
            total: data?.meta?.total ?? 0,
            onChange: (p, ps) => {
              table.setPage(p);
              table.setLimit(ps);
            },
          }}
          columns={[
            {
              title: "Title",
              dataIndex: "title",
              render: (title: string, row: TReceivable) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>{title}</Typography.Text>
                  {row.client && (
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {row.client}
                    </Typography.Text>
                  )}
                </Space>
              ),
            },
            {
              title: "Amount",
              dataIndex: "amount",
              width: 120,
              render: (v: number) => money(v),
            },
            {
              title: "Collected",
              width: 180,
              render: (_: unknown, row: TReceivable) => {
                const paid = row.amount - outstandingOf(row);
                const pct = row.amount ? Math.round((paid / row.amount) * 100) : 0;
                return (
                  <Space direction="vertical" size={0} style={{ width: "100%" }}>
                    <Progress
                      percent={pct}
                      size="small"
                      strokeColor="#0fcda1"
                      showInfo={false}
                    />
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {money(paid)} of {money(row.amount)}
                    </Typography.Text>
                  </Space>
                );
              },
            },
            { title: "Due", dataIndex: "dueDate", width: 120 },
            {
              title: "Status",
              dataIndex: "status",
              width: 110,
              render: (status: string) => (
                <Tag color={STATUS_COLORS[status]}>{status}</Tag>
              ),
            },
            {
              title: "",
              width: 100,
              align: "right",
              render: (_: unknown, row: TReceivable) => (
                <Space>
                  <Button
                    size="small"
                    type="primary"
                    icon={<FiDollarSign />}
                    disabled={row.status === "paid"}
                    onClick={() => onRecordPayment(row)}
                    title="Record payment"
                  />
                  <Popconfirm
                    title="Delete this receivable?"
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    onConfirm={async () => {
                      try {
                        await deleteReceivable(row._id).unwrap();
                        toast.success("Receivable deleted");
                      } catch (err) {
                        toast.error(
                          (err as { data?: { message?: string } })?.data?.message ??
                            "Could not delete"
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
        title="Add expected income"
        open={open}
        onClose={() => setOpen(false)}
        width={420}
        extra={
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            Save
          </Button>
        }
      >
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input placeholder="Northwind — phase 2" />
          </Form.Item>
          <Form.Item name="client" label="Client">
            <Input placeholder="Northwind Logistics" />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Amount (৳)"
            rules={[{ required: true, message: "Amount is required" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="dueDate" label="Due date">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="note" label="Note">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default ReceivablesPage;
