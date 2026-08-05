import {
  Card,
  DatePicker,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { format } from "date-fns";
import { FiMonitor, FiSmartphone, FiTablet } from "react-icons/fi";
import PageHeader from "../../components/PageHeader";
import { useTableQuery } from "../../hooks/useTableQuery";
import { useGetAuditLogsQuery } from "../../redux/api/auditApi";
import { TAuditLog } from "../../types";

const MODULES = [
  "auth",
  "users",
  "roles",
  "cms",
  "leads",
  "meetings",
  "employees",
  "attendance",
  "payroll",
  "finance",
  "documents",
  "projects",
];

const deviceIcon = (type?: string) => {
  if (type === "mobile") return <FiSmartphone />;
  if (type === "tablet") return <FiTablet />;
  return <FiMonitor />;
};

const actionColor = (action: string) => {
  if (action.includes("delete")) return "red";
  if (action.includes("create")) return "green";
  if (action.includes("login")) return "blue";
  if (action.includes("logout")) return "default";
  return "orange";
};

const AuditLogsPage = () => {
  const table = useTableQuery();
  const { data, isFetching } = useGetAuditLogsQuery(table.params);

  return (
    <div>
      <PageHeader
        title="Audit Log"
        subtitle="Every action across the panel — who did what, when, and from which device"
        extra={
          <>
            <Input.Search
              placeholder="Search description or endpoint"
              allowClear
              onSearch={table.search}
              style={{ width: 240 }}
            />
            <Select
              placeholder="Module"
              allowClear
              style={{ width: 150 }}
              options={MODULES.map((m) => ({ value: m, label: m }))}
              onChange={(v) => table.setFilter("module", v)}
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
          </>
        }
      />

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="_id"
          loading={isFetching}
          dataSource={data?.data ?? []}
          scroll={{ x: 960 }}
          pagination={{
            current: table.page,
            pageSize: table.limit,
            total: data?.meta?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `${total} entries`,
            onChange: (p, ps) => {
              table.setPage(p);
              table.setLimit(ps);
            },
          }}
          columns={[
            {
              title: "When",
              dataIndex: "createdAt",
              width: 175,
              render: (d: string) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text>
                    {format(new Date(d), "dd MMM yyyy")}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {format(new Date(d), "h:mm:ss a")}
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: "User",
              dataIndex: ["user", "name"],
              render: (name?: string, row?: TAuditLog) =>
                name ? (
                  <Space direction="vertical" size={0}>
                    <Typography.Text>{name}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {row?.user?.email}
                    </Typography.Text>
                  </Space>
                ) : (
                  <Typography.Text type="secondary">system</Typography.Text>
                ),
            },
            {
              title: "Action",
              dataIndex: "action",
              render: (action: string) => (
                <Tag color={actionColor(action)}>{action}</Tag>
              ),
            },
            { title: "Module", dataIndex: "module", width: 110 },
            { title: "Description", dataIndex: "description" },
            {
              title: "Device",
              dataIndex: "device",
              width: 130,
              render: (device: TAuditLog["device"], row: TAuditLog) => (
                <Tooltip
                  title={
                    <>
                      {device?.browser} on {device?.os}
                      <br />
                      IP: {row.ip}
                      <br />
                      {row.method} {row.endpoint}
                    </>
                  }
                >
                  <Space>
                    {deviceIcon(device?.deviceType)}
                    <Typography.Text style={{ fontSize: 12 }}>
                      {device?.browser?.split(" ")[0] ?? "unknown"}
                    </Typography.Text>
                  </Space>
                </Tooltip>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default AuditLogsPage;
