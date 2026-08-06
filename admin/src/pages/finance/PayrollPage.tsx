import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";
import { FiDollarSign, FiEdit2, FiRefreshCw } from "react-icons/fi";
import { toast } from "sonner";
import ExportXlsxButton from "../../components/ExportXlsxButton";
import PageHeader from "../../components/PageHeader";
import {
  useGeneratePayrollMutation,
  useGetAccountsQuery,
  useGetPayrollQuery,
  usePaySalaryMutation,
  useUpdatePayrollRecordMutation,
  type TPayrollRecord,
} from "../../redux/api/financeApi";
import { money } from "./FinanceOverviewPage";

const STATUS_COLORS: Record<string, string> = {
  draft: "default",
  approved: "blue",
  paid: "green",
};

const PayrollPage = () => {
  const [month, setMonth] = useState<Dayjs>(dayjs().subtract(1, "month"));
  const key = month.format("YYYY-MM");

  const { data, isFetching } = useGetPayrollQuery(key);
  const { data: accountsRes } = useGetAccountsQuery();
  const [generate, { isLoading: generating }] = useGeneratePayrollMutation();
  const [updateRecord, { isLoading: updating }] = useUpdatePayrollRecordMutation();
  const [paySalary] = usePaySalaryMutation();

  const [editing, setEditing] = useState<TPayrollRecord | null>(null);
  const [form] = Form.useForm();

  const records = data?.data?.records ?? [];
  const totals = data?.data?.totals;

  const accountOptions =
    accountsRes?.data?.map((a) => ({
      value: a._id,
      label: `${a.name} (${money(a.balance)})`,
    })) ?? [];

  const onGenerate = async () => {
    try {
      const res = await generate(key).unwrap();
      const r = res.data as unknown as {
        created: number;
        updated: number;
        skipped: number;
      };
      toast.success(
        `${r.created} created, ${r.updated} refreshed, ${r.skipped} already paid or approved`
      );
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not generate payroll"
      );
    }
  };

  const onPay = (record: TPayrollRecord) => {
    let accountId = accountOptions[0]?.value;
    let date = dayjs().format("YYYY-MM-DD");

    Modal.confirm({
      title: `Pay ${record.employee.fullName}`,
      content: (
        <div style={{ marginTop: 12 }}>
          <Typography.Paragraph>
            Paying <strong>{money(record.netPayable)}</strong> for {record.month}.
            This records a salary expense against the chosen account.
          </Typography.Paragraph>
          <Select
            options={accountOptions}
            defaultValue={accountId}
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
      okText: "Pay",
      onOk: async () => {
        if (!accountId) {
          toast.error("Create a finance account first");
          throw new Error("no account");
        }
        try {
          await paySalary({
            id: record._id,
            body: { account: accountId, date },
          }).unwrap();
          toast.success("Salary paid and recorded");
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

  const openEdit = (record: TPayrollRecord) => {
    setEditing(record);
    form.setFieldsValue({
      adjustment: record.adjustment,
      adjustmentNote: record.adjustmentNote,
    });
  };

  const submitEdit = async (values: Record<string, unknown>) => {
    if (!editing) return;
    try {
      await updateRecord({ id: editing._id, body: values }).unwrap();
      toast.success("Payslip updated");
      setEditing(null);
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not update the payslip"
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="Salary Ledger"
        subtitle="Generated from attendance — the perfect-attendance bonus is applied automatically"
        extra={
          <>
            <DatePicker
              picker="month"
              value={month}
              onChange={(d) => d && setMonth(d)}
              allowClear={false}
            />
            <ExportXlsxButton
              fileName={`websyner-payroll-${key}`}
              sheetName={key}
              rows={records.map((r) => ({
                "Employee ID": r.employee.employeeId,
                Employee: r.employee.fullName,
                Month: r.month,
                Scheduled: r.scheduledDays,
                Present: r.presentDays,
                Late: r.lateDays,
                Absent: r.absentDays,
                "Attendance %": `${r.attendancePct}%`,
                "Base Salary": r.baseSalary,
                Bonus: r.bonus,
                Adjustment: r.adjustment,
                "Net Payable": r.netPayable,
                Status: r.status,
              }))}
            />
            <Popconfirm
              title={`Generate payroll for ${month.format("MMMM YYYY")}?`}
              description="Draft rows are refreshed from attendance. Approved and paid rows are left alone."
              okText="Generate"
              onConfirm={onGenerate}
            >
              <Button type="primary" icon={<FiRefreshCw />} loading={generating}>
                Generate
              </Button>
            </Popconfirm>
          </>
        }
      />

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small" loading={isFetching}>
            <Statistic title="Payslips" value={totals?.records ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" loading={isFetching}>
            <Statistic title="Total payable" value={money(totals?.netPayable)} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" loading={isFetching}>
            <Statistic
              title="Paid"
              value={money(totals?.paid)}
              valueStyle={{ color: "#0fcda1" }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" loading={isFetching}>
            <Statistic title="Outstanding" value={money(totals?.pending)} />
          </Card>
        </Col>
      </Row>

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="_id"
          loading={isFetching}
          dataSource={records}
          scroll={{ x: 1080 }}
          pagination={false}
          locale={{
            emptyText: `No payroll for ${month.format("MMMM YYYY")} yet — use Generate to build it from attendance.`,
          }}
          columns={[
            {
              title: "Employee",
              fixed: "left",
              width: 180,
              render: (_: unknown, row: TPayrollRecord) => (
                <div>
                  <Typography.Text strong>{row.employee?.fullName}</Typography.Text>
                  <div>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {row.employee?.employeeId}
                    </Typography.Text>
                  </div>
                </div>
              ),
            },
            {
              title: "Attendance",
              width: 130,
              render: (_: unknown, row: TPayrollRecord) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text>{row.attendancePct}%</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {row.presentDays}P · {row.lateDays}L · {row.absentDays}A
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: "Base",
              dataIndex: "baseSalary",
              width: 110,
              render: (v: number) => money(v),
            },
            {
              title: "Bonus",
              dataIndex: "bonus",
              width: 120,
              render: (v: number, row: TPayrollRecord) =>
                row.bonusEligible ? (
                  <Tag color="green">{money(v)}</Tag>
                ) : (
                  <Typography.Text type="secondary">—</Typography.Text>
                ),
            },
            {
              title: "Adjustment",
              dataIndex: "adjustment",
              width: 120,
              render: (v: number) =>
                v ? (
                  <Typography.Text type={v < 0 ? "danger" : "success"}>
                    {v > 0 ? "+" : "−"}
                    {money(Math.abs(v))}
                  </Typography.Text>
                ) : (
                  "—"
                ),
            },
            {
              title: "Net payable",
              dataIndex: "netPayable",
              width: 130,
              render: (v: number) => (
                <Typography.Text strong>{money(v)}</Typography.Text>
              ),
            },
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
              width: 110,
              align: "right",
              fixed: "right",
              render: (_: unknown, row: TPayrollRecord) => (
                <Space>
                  <Button
                    size="small"
                    icon={<FiEdit2 />}
                    disabled={row.status === "paid"}
                    onClick={() => openEdit(row)}
                    title="Adjust"
                  />
                  <Button
                    size="small"
                    type="primary"
                    icon={<FiDollarSign />}
                    disabled={row.status === "paid"}
                    onClick={() => onPay(row)}
                    title="Pay"
                  />
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editing ? `Adjust ${editing.employee.fullName}'s payslip` : ""}
        open={Boolean(editing)}
        onCancel={() => setEditing(null)}
        onOk={() => form.submit()}
        confirmLoading={updating}
        okText="Save"
      >
        <Form form={form} layout="vertical" onFinish={submitEdit}>
          <Form.Item
            name="adjustment"
            label="Adjustment (৳)"
            extra="Negative for deductions, positive for extras. The net payable updates automatically."
          >
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="adjustmentNote" label="Reason">
            <Input.TextArea rows={2} placeholder="Advance taken in June" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PayrollPage;
