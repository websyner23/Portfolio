import {
  Button,
  Card,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import { FiCheck, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import { useTableQuery } from "../../hooks/useTableQuery";
import {
  useCreateLeaveMutation,
  useDeleteLeaveMutation,
  useGetEmployeesQuery,
  useGetLeavesQuery,
  useReviewLeaveMutation,
  type TLeave,
} from "../../redux/api/hrmApi";

const STATUS_COLORS: Record<string, string> = {
  pending: "gold",
  approved: "green",
  rejected: "red",
};

const LeavesPage = () => {
  const table = useTableQuery();
  const { data, isFetching } = useGetLeavesQuery(table.params);
  const { data: employeesRes } = useGetEmployeesQuery({ limit: 200 });
  const [createLeave, { isLoading: creating }] = useCreateLeaveMutation();
  const [reviewLeave] = useReviewLeaveMutation();
  const [deleteLeave] = useDeleteLeaveMutation();

  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const employeeOptions =
    employeesRes?.data?.map((e) => ({
      value: e._id,
      label: `${e.fullName} (${e.employeeId})`,
    })) ?? [];

  const onSubmit = async (values: Record<string, unknown>) => {
    try {
      await createLeave(values).unwrap();
      toast.success("Leave recorded");
      setOpen(false);
      form.resetFields();
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not record the leave"
      );
    }
  };

  const review = async (id: string, status: string) => {
    try {
      await reviewLeave({ id, status }).unwrap();
      toast.success(`Leave ${status}`);
    } catch {
      toast.error("Could not update the leave request");
    }
  };

  return (
    <div>
      <PageHeader
        title="Leave"
        subtitle="Approved leave is excluded from absences but still blocks the perfect-attendance bonus"
        extra={
          <>
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 140 }}
              options={[
                { value: "pending", label: "Pending" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
              ]}
              onChange={(v) => table.setFilter("status", v)}
            />
            <Button type="primary" icon={<FiPlus />} onClick={() => setOpen(true)}>
              Record leave
            </Button>
          </>
        }
      />

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="_id"
          loading={isFetching}
          dataSource={data?.data ?? []}
          scroll={{ x: 820 }}
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
              title: "Employee",
              render: (_: unknown, row: TLeave) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>
                    {row.employee?.fullName ?? "—"}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {row.employee?.employeeId}
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: "Dates",
              width: 220,
              render: (_: unknown, row: TLeave) =>
                row.startDate === row.endDate
                  ? row.startDate
                  : `${row.startDate} → ${row.endDate}`,
            },
            {
              title: "Type",
              dataIndex: "type",
              width: 100,
              render: (v: string) => <Tag>{v}</Tag>,
            },
            { title: "Reason", dataIndex: "reason" },
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
              width: 130,
              align: "right",
              render: (_: unknown, row: TLeave) => (
                <Space>
                  {row.status !== "approved" && (
                    <Button
                      size="small"
                      type="primary"
                      icon={<FiCheck />}
                      onClick={() => review(row._id, "approved")}
                      title="Approve"
                    />
                  )}
                  {row.status !== "rejected" && (
                    <Button
                      size="small"
                      icon={<FiX />}
                      onClick={() => review(row._id, "rejected")}
                      title="Reject"
                    />
                  )}
                  <Popconfirm
                    title="Delete this leave record?"
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    onConfirm={async () => {
                      try {
                        await deleteLeave(row._id).unwrap();
                        toast.success("Leave deleted");
                      } catch {
                        toast.error("Could not delete");
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
        title="Record leave"
        open={open}
        onClose={() => setOpen(false)}
        width={440}
        extra={
          <Button type="primary" loading={creating} onClick={() => form.submit()}>
            Save
          </Button>
        }
      >
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item
            name="employee"
            label="Employee"
            rules={[{ required: true, message: "Pick an employee" }]}
          >
            <Select
              options={employeeOptions}
              showSearch
              optionFilterProp="label"
              placeholder="Select"
            />
          </Form.Item>
          <Space style={{ display: "flex" }} align="start">
            <Form.Item
              name="startDate"
              label="From"
              rules={[{ required: true, message: "Required" }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item
              name="endDate"
              label="To"
              rules={[{ required: true, message: "Required" }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
          </Space>
          <Form.Item name="type" label="Type" initialValue="paid">
            <Select
              options={[
                { value: "paid", label: "Paid" },
                { value: "unpaid", label: "Unpaid" },
                { value: "sick", label: "Sick" },
                { value: "other", label: "Other" },
              ]}
            />
          </Form.Item>
          <Form.Item name="reason" label="Reason">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default LeavesPage;
