import {
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Timeline,
  Typography,
} from "antd";
import { format, formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { FiEye, FiTrash2 } from "react-icons/fi";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import { useTableQuery } from "../../hooks/useTableQuery";
import {
  useAddLeadNoteMutation,
  useDeleteLeadMutation,
  useGetLeadQuery,
  useGetLeadsQuery,
  useGetLeadStatsQuery,
  useUpdateLeadMutation,
  type TLead,
} from "../../redux/api/leadApi";

const STATUS_OPTIONS = [
  { value: "new", label: "New", color: "blue" },
  { value: "contacted", label: "Contacted", color: "cyan" },
  { value: "qualified", label: "Qualified", color: "gold" },
  { value: "won", label: "Won", color: "green" },
  { value: "lost", label: "Lost", color: "red" },
];

const statusColor = (status: string) =>
  STATUS_OPTIONS.find((s) => s.value === status)?.color ?? "default";

const LeadDetail = ({ id, onClose }: { id: string; onClose: () => void }) => {
  const { data, isFetching } = useGetLeadQuery(id);
  const [updateLead] = useUpdateLeadMutation();
  const [addNote, { isLoading: addingNote }] = useAddLeadNoteMutation();
  const [note, setNote] = useState("");

  const lead = data?.data;

  const changeStatus = async (status: string) => {
    try {
      await updateLead({ id, body: { status } }).unwrap();
      toast.success(`Marked as ${status}`);
    } catch {
      toast.error("Could not update the status");
    }
  };

  const submitNote = async () => {
    if (!note.trim()) return;
    try {
      await addNote({ id, body: note.trim() }).unwrap();
      setNote("");
      toast.success("Note added");
    } catch {
      toast.error("Could not add the note");
    }
  };

  return (
    <Drawer
      title={lead ? `${lead.name} — ${lead.email}` : "Lead"}
      open
      onClose={onClose}
      width={620}
      loading={isFetching}
    >
      {lead && (
        <>
          <Space wrap style={{ marginBottom: 16 }}>
            <Select
              value={lead.status}
              style={{ width: 160 }}
              options={STATUS_OPTIONS}
              onChange={changeStatus}
            />
            <Button href={`mailto:${lead.email}`} type="primary">
              Reply by email
            </Button>
          </Space>

          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Type">
              <Tag>{lead.type === "quick-quote" ? "Quick quote" : "Contact form"}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Email">{lead.email}</Descriptions.Item>
            {lead.phone && (
              <Descriptions.Item label="Phone">{lead.phone}</Descriptions.Item>
            )}
            {lead.company && (
              <Descriptions.Item label="Company">{lead.company}</Descriptions.Item>
            )}
            {lead.service && (
              <Descriptions.Item label="Service">{lead.service}</Descriptions.Item>
            )}
            {lead.budget && (
              <Descriptions.Item label="Budget">{lead.budget}</Descriptions.Item>
            )}
            {lead.timeline && (
              <Descriptions.Item label="Timeline">{lead.timeline}</Descriptions.Item>
            )}
            {lead.startDate && (
              <Descriptions.Item label="Start date">{lead.startDate}</Descriptions.Item>
            )}
            {lead.referral && (
              <Descriptions.Item label="Heard via">{lead.referral}</Descriptions.Item>
            )}
            <Descriptions.Item label="Received">
              {format(new Date(lead.createdAt), "dd MMM yyyy, h:mm a")}
            </Descriptions.Item>
          </Descriptions>

          <Typography.Title level={5} style={{ marginTop: 20 }}>
            Message
          </Typography.Title>
          <Card size="small">
            <Typography.Paragraph style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
              {lead.message}
            </Typography.Paragraph>
          </Card>

          <Typography.Title level={5} style={{ marginTop: 20 }}>
            Internal notes
          </Typography.Title>
          {lead.notes && lead.notes.length > 0 ? (
            <Timeline
              style={{ marginTop: 12 }}
              items={lead.notes.map((n) => ({
                children: (
                  <div>
                    <Typography.Text>{n.body}</Typography.Text>
                    <div>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {n.author?.name ?? "Someone"} ·{" "}
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                        })}
                      </Typography.Text>
                    </div>
                  </div>
                ),
              }))}
            />
          ) : (
            <Typography.Text type="secondary">No notes yet.</Typography.Text>
          )}

          <Space.Compact style={{ width: "100%", marginTop: 12 }}>
            <Input
              placeholder="Add a note for the team…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onPressEnter={submitNote}
            />
            <Button type="primary" loading={addingNote} onClick={submitNote}>
              Add
            </Button>
          </Space.Compact>
        </>
      )}
    </Drawer>
  );
};

const LeadsPage = () => {
  const table = useTableQuery();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isFetching } = useGetLeadsQuery(table.params);
  const { data: statsRes } = useGetLeadStatsQuery();
  const [deleteLead] = useDeleteLeadMutation();

  const highlighted = searchParams.get("highlight");
  const stats = statsRes?.data;

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle="Enquiries from the website's contact and quote forms"
        extra={
          <>
            <Input.Search
              placeholder="Search name, email, company"
              allowClear
              onSearch={table.search}
              style={{ width: 250 }}
            />
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 140 }}
              options={STATUS_OPTIONS}
              onChange={(v) => table.setFilter("status", v)}
            />
          </>
        }
      />

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={4}>
          <Card size="small">
            <Statistic title="Total" value={stats?.total ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card size="small">
            <Statistic
              title="Unread"
              value={stats?.unread ?? 0}
              valueStyle={{ color: "#0fcda1" }}
            />
          </Card>
        </Col>
        {STATUS_OPTIONS.map((s) => (
          <Col xs={12} md={4} key={s.value}>
            <Card size="small">
              <Statistic
                title={s.label}
                value={stats?.byStatus?.[s.value] ?? 0}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="_id"
          loading={isFetching}
          dataSource={data?.data ?? []}
          scroll={{ x: 900 }}
          rowClassName={(row: TLead) => (!row.readAt ? "ant-table-row-selected" : "")}
          pagination={{
            current: table.page,
            pageSize: table.limit,
            total: data?.meta?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `${total} leads`,
            onChange: (p, ps) => {
              table.setPage(p);
              table.setLimit(ps);
            },
          }}
          columns={[
            {
              title: "From",
              dataIndex: "name",
              render: (name: string, row: TLead) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text strong={!row.readAt}>{name}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {row.email}
                    {row.company ? ` · ${row.company}` : ""}
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: "Message",
              dataIndex: "message",
              render: (message: string) => (
                <Typography.Paragraph
                  type="secondary"
                  ellipsis={{ rows: 2 }}
                  style={{ marginBottom: 0, maxWidth: 320, fontSize: 13 }}
                >
                  {message}
                </Typography.Paragraph>
              ),
            },
            {
              title: "Service",
              dataIndex: "service",
              width: 150,
              render: (v?: string) => v || "—",
            },
            {
              title: "Status",
              dataIndex: "status",
              width: 110,
              render: (status: string) => (
                <Tag color={statusColor(status)}>{status}</Tag>
              ),
            },
            {
              title: "Received",
              dataIndex: "createdAt",
              width: 150,
              render: (d: string) =>
                formatDistanceToNow(new Date(d), { addSuffix: true }),
            },
            {
              title: "",
              width: 90,
              align: "right",
              render: (_: unknown, row: TLead) => (
                <Space>
                  <Button
                    size="small"
                    icon={<FiEye />}
                    onClick={() => setSearchParams({ highlight: row._id })}
                  />
                  <Popconfirm
                    title="Delete this lead?"
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    onConfirm={async () => {
                      try {
                        await deleteLead(row._id).unwrap();
                        toast.success("Lead deleted");
                      } catch {
                        toast.error("Could not delete the lead");
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

      {highlighted && (
        <LeadDetail
          id={highlighted}
          onClose={() => setSearchParams({})}
        />
      )}
    </div>
  );
};

export default LeadsPage;
