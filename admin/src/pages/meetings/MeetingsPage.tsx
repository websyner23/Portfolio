import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { format } from "date-fns";
import { useState } from "react";
import { FiCheck, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import { useTableQuery } from "../../hooks/useTableQuery";
import {
  useDeleteMeetingMutation,
  useGetMeetingsQuery,
  useUpdateMeetingMutation,
  type TMeeting,
} from "../../redux/api/meetingApi";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "gold" },
  { value: "confirmed", label: "Confirmed", color: "green" },
  { value: "rescheduled", label: "Rescheduled", color: "blue" },
  { value: "cancelled", label: "Cancelled", color: "red" },
  { value: "completed", label: "Completed", color: "default" },
];

const statusColor = (status: string) =>
  STATUS_OPTIONS.find((s) => s.value === status)?.color ?? "default";

const prettyDate = (iso: string) =>
  format(new Date(`${iso}T00:00:00`), "EEE, dd MMM yyyy");

const MeetingsPage = () => {
  const table = useTableQuery();
  const { data, isFetching } = useGetMeetingsQuery(table.params);
  const [updateMeeting, { isLoading: saving }] = useUpdateMeetingMutation();
  const [deleteMeeting] = useDeleteMeetingMutation();

  const [editing, setEditing] = useState<TMeeting | null>(null);
  const [form] = Form.useForm();

  const setStatus = async (meeting: TMeeting, status: string) => {
    try {
      await updateMeeting({ id: meeting._id, body: { status } }).unwrap();
      toast.success(`Meeting ${status} — ${meeting.name} has been emailed`);
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not update the meeting"
      );
    }
  };

  const openEdit = (meeting: TMeeting) => {
    setEditing(meeting);
    form.setFieldsValue({
      date: meeting.date,
      time: meeting.time,
      meetingLink: meeting.meetingLink,
      adminNotes: meeting.adminNotes,
      status: meeting.status,
    });
  };

  const submitEdit = async (values: Record<string, unknown>) => {
    if (!editing) return;
    try {
      await updateMeeting({ id: editing._id, body: values }).unwrap();
      toast.success("Meeting updated — the visitor has been emailed");
      setEditing(null);
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not update the meeting"
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="Meetings"
        subtitle="Discovery calls booked from the website"
        extra={
          <>
            <Input.Search
              placeholder="Search name, email, topic"
              allowClear
              onSearch={table.search}
              style={{ width: 240 }}
            />
            <Segmented
              options={[
                { value: "", label: "All" },
                { value: "pending", label: "Pending" },
                { value: "confirmed", label: "Confirmed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
              onChange={(v) => table.setFilter("status", (v as string) || undefined)}
            />
          </>
        }
      />

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="_id"
          loading={isFetching}
          dataSource={data?.data ?? []}
          scroll={{ x: 940 }}
          pagination={{
            current: table.page,
            pageSize: table.limit,
            total: data?.meta?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `${total} meetings`,
            onChange: (p, ps) => {
              table.setPage(p);
              table.setLimit(ps);
            },
          }}
          columns={[
            {
              title: "When",
              width: 200,
              render: (_: unknown, row: TMeeting) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>{prettyDate(row.date)}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {row.time} · {row.timezone} · {row.durationMins} min
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: "Who",
              dataIndex: "name",
              render: (name: string, row: TMeeting) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text>{name}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {row.email}
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: "Topic",
              dataIndex: "topic",
              render: (topic?: string) => (
                <Typography.Paragraph
                  type="secondary"
                  ellipsis={{ rows: 2 }}
                  style={{ marginBottom: 0, maxWidth: 260, fontSize: 13 }}
                >
                  {topic || "—"}
                </Typography.Paragraph>
              ),
            },
            {
              title: "Status",
              dataIndex: "status",
              width: 120,
              render: (status: string) => (
                <Tag color={statusColor(status)}>{status}</Tag>
              ),
            },
            {
              title: "",
              width: 150,
              align: "right",
              fixed: "right",
              render: (_: unknown, row: TMeeting) => (
                <Space>
                  {row.status !== "confirmed" && (
                    <Button
                      size="small"
                      type="primary"
                      icon={<FiCheck />}
                      onClick={() => setStatus(row, "confirmed")}
                      title="Confirm"
                    />
                  )}
                  {row.status !== "cancelled" && (
                    <Button
                      size="small"
                      icon={<FiX />}
                      onClick={() => setStatus(row, "cancelled")}
                      title="Cancel"
                    />
                  )}
                  <Button
                    size="small"
                    icon={<FiEdit2 />}
                    onClick={() => openEdit(row)}
                    title="Edit"
                  />
                  <Popconfirm
                    title="Delete this booking?"
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    onConfirm={async () => {
                      try {
                        await deleteMeeting(row._id).unwrap();
                        toast.success("Meeting deleted");
                      } catch {
                        toast.error("Could not delete the meeting");
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
        title={editing ? `Meeting with ${editing.name}` : "Meeting"}
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        width={480}
        extra={
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            Save & email
          </Button>
        }
      >
        {editing && (
          <>
            <Descriptions column={1} size="small" bordered style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Email">{editing.email}</Descriptions.Item>
              {editing.phone && (
                <Descriptions.Item label="Phone">{editing.phone}</Descriptions.Item>
              )}
              <Descriptions.Item label="Timezone">
                {editing.timezone}
              </Descriptions.Item>
              <Descriptions.Item label="Booked">
                {format(new Date(editing.createdAt), "dd MMM yyyy, h:mm a")}
              </Descriptions.Item>
            </Descriptions>

            <Form form={form} layout="vertical" onFinish={submitEdit}>
              <Form.Item name="status" label="Status">
                <Select options={STATUS_OPTIONS} />
              </Form.Item>
              <Space style={{ display: "flex" }} align="start">
                <Form.Item name="date" label="Date" style={{ flex: 1 }}>
                  <Input placeholder="YYYY-MM-DD" />
                </Form.Item>
                <Form.Item name="time" label="Time" style={{ flex: 1 }}>
                  <Input placeholder="HH:MM" />
                </Form.Item>
              </Space>
              <Form.Item
                name="meetingLink"
                label="Meeting link"
                extra="Included in the confirmation email"
              >
                <Input placeholder="https://meet.google.com/…" />
              </Form.Item>
              <Form.Item name="adminNotes" label="Note to the visitor">
                <Input.TextArea
                  rows={3}
                  placeholder="Added to cancellation emails"
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default MeetingsPage;
