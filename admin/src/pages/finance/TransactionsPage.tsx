import {
  Button,
  Card,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import ExportXlsxButton from "../../components/ExportXlsxButton";
import PageHeader from "../../components/PageHeader";
import { useTableQuery } from "../../hooks/useTableQuery";
import {
  useCreateTransactionMutation,
  useDeleteTransactionMutation,
  useGetAccountsQuery,
  useGetTransactionsQuery,
  type TTransaction,
} from "../../redux/api/financeApi";
import { money } from "./FinanceOverviewPage";

const TYPE_META: Record<string, { color: string; sign: string }> = {
  income: { color: "green", sign: "+" },
  expense: { color: "red", sign: "−" },
  salary: { color: "orange", sign: "−" },
  transfer: { color: "blue", sign: "" },
};

const TransactionsPage = () => {
  const table = useTableQuery();
  const { data, isFetching } = useGetTransactionsQuery(table.params);
  const { data: accountsRes } = useGetAccountsQuery();
  const [createTransaction, { isLoading: saving }] = useCreateTransactionMutation();
  const [deleteTransaction] = useDeleteTransactionMutation();

  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const type = Form.useWatch("type", form);

  const accountOptions =
    accountsRes?.data?.map((a) => ({
      value: a._id,
      label: `${a.name} (${money(a.balance)})`,
    })) ?? [];

  const rows = data?.data ?? [];

  const onSubmit = async (values: Record<string, unknown>) => {
    try {
      await createTransaction({
        ...values,
        date: dayjs(values.date as dayjs.Dayjs).format("YYYY-MM-DD"),
      }).unwrap();
      toast.success("Transaction recorded");
      setOpen(false);
      form.resetFields();
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not record the transaction"
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="Every movement of money across your accounts"
        extra={
          <>
            <Input.Search
              placeholder="Search description or category"
              allowClear
              onSearch={table.search}
              style={{ width: 230 }}
            />
            <Select
              placeholder="Type"
              allowClear
              style={{ width: 130 }}
              options={[
                { value: "income", label: "Income" },
                { value: "expense", label: "Expense" },
                { value: "salary", label: "Salary" },
                { value: "transfer", label: "Transfer" },
              ]}
              onChange={(v) => table.setFilter("type", v)}
            />
            <DatePicker.RangePicker
              onChange={(dates) => {
                table.setFilter(
                  "from",
                  dates?.[0] ? dates[0].format("YYYY-MM-DD") : undefined
                );
                table.setFilter(
                  "to",
                  dates?.[1] ? dates[1].format("YYYY-MM-DD") : undefined
                );
              }}
            />
            <ExportXlsxButton
              fileName="websyner-transactions"
              sheetName="Transactions"
              rows={rows.map((t) => ({
                Date: t.date,
                Type: t.type,
                Amount: t.amount,
                Account: t.account?.name ?? "",
                Category: t.category ?? "",
                Description: t.description ?? "",
              }))}
            />
            <Button type="primary" icon={<FiPlus />} onClick={() => setOpen(true)}>
              Record
            </Button>
          </>
        }
      />

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="_id"
          loading={isFetching}
          dataSource={rows}
          scroll={{ x: 900 }}
          pagination={{
            current: table.page,
            pageSize: table.limit,
            total: data?.meta?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `${total} transactions`,
            onChange: (p, ps) => {
              table.setPage(p);
              table.setLimit(ps);
            },
          }}
          columns={[
            { title: "Date", dataIndex: "date", width: 120 },
            {
              title: "Type",
              dataIndex: "type",
              width: 110,
              render: (t: string) => (
                <Tag color={TYPE_META[t]?.color}>{t}</Tag>
              ),
            },
            {
              title: "Amount",
              dataIndex: "amount",
              width: 140,
              render: (amount: number, row: TTransaction) => (
                <Typography.Text
                  strong
                  type={
                    row.type === "income"
                      ? "success"
                      : row.type === "transfer"
                        ? undefined
                        : "danger"
                  }
                >
                  {TYPE_META[row.type]?.sign}
                  {money(amount)}
                </Typography.Text>
              ),
            },
            {
              title: "Account",
              render: (_: unknown, row: TTransaction) =>
                row.type === "transfer" && row.toAccount
                  ? `${row.account?.name} → ${row.toAccount.name}`
                  : row.account?.name,
            },
            { title: "Category", dataIndex: "category", width: 140 },
            {
              title: "Description",
              dataIndex: "description",
              render: (v?: string) => (
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  {v || "—"}
                </Typography.Text>
              ),
            },
            {
              title: "",
              width: 60,
              align: "right",
              render: (_: unknown, row: TTransaction) => (
                <Popconfirm
                  title="Delete this transaction?"
                  description="Account balances will be recalculated."
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                  onConfirm={async () => {
                    try {
                      await deleteTransaction(row._id).unwrap();
                      toast.success("Transaction deleted");
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
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        title="Record a transaction"
        open={open}
        onClose={() => setOpen(false)}
        width={460}
        extra={
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            Save
          </Button>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onSubmit}
          initialValues={{ type: "expense", date: dayjs() }}
        >
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "income", label: "Income" },
                { value: "expense", label: "Expense" },
                { value: "transfer", label: "Transfer between accounts" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Amount (৳)"
            rules={[{ required: true, message: "Amount is required" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="account"
            label={type === "transfer" ? "From account" : "Account"}
            rules={[{ required: true, message: "Account is required" }]}
          >
            <Select options={accountOptions} />
          </Form.Item>
          {type === "transfer" && (
            <Form.Item
              name="toAccount"
              label="To account"
              rules={[{ required: true, message: "Destination is required" }]}
            >
              <Select options={accountOptions} />
            </Form.Item>
          )}
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="category" label="Category">
            <Input placeholder="Software, Rent, Project income…" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default TransactionsPage;
