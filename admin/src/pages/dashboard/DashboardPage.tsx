import {
  Card,
  Col,
  Empty,
  List,
  Progress,
  Row,
  Statistic,
  Tag,
  Timeline,
  Typography,
} from "antd";
import { format, formatDistanceToNow } from "date-fns";
import ReactApexChart from "react-apexcharts";
import { Link } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { BRAND } from "../../config";
import { usePermission } from "../../hooks/usePermission";
import { useGetDashboardQuery } from "../../redux/api/dashboardApi";
import { useAppSelector } from "../../redux/hooks";

const money = (v = 0) => `৳${v.toLocaleString()}`;

const LEAD_STATUS_COLORS: Record<string, string> = {
  new: "blue",
  contacted: "cyan",
  qualified: "gold",
  won: "green",
  lost: "red",
};

const ATTENDANCE_COLORS: Record<string, string> = {
  present: "#0fcda1",
  late: "#faad14",
  incomplete: "#ffc53d",
  absent: "#ff4d4f",
  leave: "#1677ff",
  "optional-off": "#8c8c8c",
  "not-punched": "#bfbfbf",
};

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const DashboardPage = () => {
  const { user } = usePermission();
  const themeMode = useAppSelector((s) => s.ui.themeMode);
  const { data, isLoading } = useGetDashboardQuery();

  const d = data?.data;
  const chartTheme = { mode: themeMode as "light" | "dark" };
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const attendanceEntries = Object.entries(d?.attendance?.counts ?? {}).filter(
    ([, count]) => count > 0
  );

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        subtitle={
          d ? format(new Date(`${d.today}T00:00:00`), "EEEE, d MMMM yyyy") : undefined
        }
      />

      {/* Headline figures — only the ones this role can see */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {d?.leads && (
          <Col xs={12} lg={6}>
            <Card size="small" loading={isLoading}>
              <Link to="/leads">
                <Statistic
                  title="New leads"
                  value={d.leads.unread}
                  suffix={`/ ${d.leads.total}`}
                  valueStyle={{ color: BRAND.colorPrimary }}
                />
              </Link>
            </Card>
          </Col>
        )}
        {d?.meetings && (
          <Col xs={12} lg={6}>
            <Card size="small" loading={isLoading}>
              <Link to="/meetings">
                <Statistic title="Meetings to confirm" value={d.meetings.pending} />
              </Link>
            </Card>
          </Col>
        )}
        {d?.attendance && (
          <Col xs={12} lg={6}>
            <Card size="small" loading={isLoading}>
              <Link to="/hrm/daily">
                <Statistic
                  title="On shift now"
                  value={d.attendance.punchedInNow}
                  suffix={`/ ${d.attendance.activeEmployees}`}
                />
              </Link>
            </Card>
          </Col>
        )}
        {d?.finance && (
          <Col xs={12} lg={6}>
            <Card size="small" loading={isLoading}>
              <Link to="/finance/overview">
                <Statistic
                  title="Balance"
                  value={money(d.finance.balance)}
                  valueStyle={{ color: BRAND.colorPrimary }}
                />
              </Link>
            </Card>
          </Col>
        )}
      </Row>

      <Row gutter={[16, 16]}>
        {/* Leads over time */}
        {d?.leads && (
          <Col xs={24} lg={14}>
            <Card title="Leads over the last 6 months" loading={isLoading}>
              {d.leads.trend.length === 0 ? (
                <Empty description="No leads yet" style={{ padding: 30 }} />
              ) : (
                <ReactApexChart
                  type="area"
                  height={260}
                  series={[
                    { name: "Leads", data: d.leads.trend.map((t) => t.count) },
                  ]}
                  options={{
                    chart: { toolbar: { show: false }, fontFamily: "inherit" },
                    theme: chartTheme,
                    colors: [BRAND.colorPrimary],
                    dataLabels: { enabled: false },
                    stroke: { curve: "smooth", width: 2 },
                    fill: {
                      type: "gradient",
                      gradient: { opacityFrom: 0.4, opacityTo: 0.05 },
                    },
                    grid: { borderColor: "rgba(128,128,128,.15)" },
                    xaxis: {
                      categories: d.leads.trend.map((t) =>
                        format(new Date(`${t.month}-01`), "MMM")
                      ),
                    },
                  }}
                />
              )}

              <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
                {Object.entries(d.leads.byStatus).map(([status, count]) => (
                  <Col key={status}>
                    <Tag color={LEAD_STATUS_COLORS[status]}>
                      {status}: {count}
                    </Tag>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        )}

        {/* Today's attendance */}
        {d?.attendance && (
          <Col xs={24} lg={10}>
            <Card
              title={`Attendance — ${d.attendance.shiftDate}`}
              loading={isLoading}
              extra={
                d.attendance.isOptionalDay ? <Tag>optional day</Tag> : undefined
              }
            >
              {attendanceEntries.length === 0 ? (
                <Empty description="No employees yet" style={{ padding: 30 }} />
              ) : (
                <ReactApexChart
                  type="donut"
                  height={260}
                  series={attendanceEntries.map(([, count]) => count)}
                  options={{
                    chart: { fontFamily: "inherit" },
                    theme: chartTheme,
                    labels: attendanceEntries.map(([status]) => status),
                    colors: attendanceEntries.map(
                      ([status]) => ATTENDANCE_COLORS[status] ?? "#8c8c8c"
                    ),
                    legend: { position: "bottom" },
                    dataLabels: { enabled: false },
                    plotOptions: {
                      pie: {
                        donut: {
                          labels: {
                            show: true,
                            total: {
                              show: true,
                              label: "Employees",
                              formatter: () => String(d.attendance!.activeEmployees),
                            },
                          },
                        },
                      },
                    },
                  }}
                />
              )}
            </Card>
          </Col>
        )}

        {/* Money */}
        {d?.finance && (
          <Col xs={24} lg={14}>
            <Card title="Income vs expenses" loading={isLoading}>
              <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
                <Col xs={12} md={6}>
                  <Statistic
                    title="This month in"
                    value={money(d.finance.monthIncome)}
                    valueStyle={{ fontSize: 18 }}
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Statistic
                    title="Out"
                    value={money(d.finance.monthExpense)}
                    valueStyle={{ fontSize: 18 }}
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Statistic
                    title="Pending in"
                    value={money(d.finance.pendingIncome)}
                    valueStyle={{ fontSize: 18 }}
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Statistic
                    title="Unpaid payroll"
                    value={money(d.finance.pendingPayroll)}
                    valueStyle={{ fontSize: 18 }}
                  />
                </Col>
              </Row>

              <ReactApexChart
                type="bar"
                height={220}
                series={[
                  { name: "Income", data: d.finance.trend.map((t) => t.income) },
                  { name: "Expenses", data: d.finance.trend.map((t) => t.expense) },
                ]}
                options={{
                  chart: { toolbar: { show: false }, fontFamily: "inherit" },
                  theme: chartTheme,
                  colors: [BRAND.colorPrimary, "#ff7875"],
                  plotOptions: { bar: { borderRadius: 4, columnWidth: "55%" } },
                  dataLabels: { enabled: false },
                  grid: { borderColor: "rgba(128,128,128,.15)" },
                  xaxis: {
                    categories: d.finance.trend.map((t) =>
                      format(new Date(`${t.month}-01`), "MMM")
                    ),
                  },
                  yaxis: {
                    labels: {
                      formatter: (v: number) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v),
                    },
                  },
                  tooltip: { y: { formatter: (v: number) => money(v) } },
                  legend: { position: "top", horizontalAlign: "right" },
                }}
              />
            </Card>
          </Col>
        )}

        {/* Upcoming meetings */}
        {d?.meetings && (
          <Col xs={24} lg={10}>
            <Card
              title="Upcoming meetings"
              loading={isLoading}
              extra={<Link to="/meetings">All</Link>}
            >
              <List
                dataSource={d.meetings.upcoming}
                locale={{ emptyText: <Empty description="Nothing booked" /> }}
                renderItem={(m) => (
                  <List.Item>
                    <List.Item.Meta
                      title={m.name}
                      description={
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {format(new Date(`${m.date}T00:00:00`), "EEE d MMM")} at{" "}
                          {m.time} · {m.timezone}
                        </Typography.Text>
                      }
                    />
                    <Tag color={m.status === "confirmed" ? "green" : "gold"}>
                      {m.status}
                    </Tag>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        )}

        {/* Recent leads */}
        {d?.leads && (
          <Col xs={24} lg={12}>
            <Card
              title="Latest enquiries"
              loading={isLoading}
              extra={<Link to="/leads">All</Link>}
            >
              <List
                dataSource={d.leads.recent}
                locale={{ emptyText: <Empty description="No enquiries yet" /> }}
                renderItem={(lead) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Link to={`/leads?highlight=${lead._id}`}>{lead.name}</Link>
                      }
                      description={
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {lead.company || lead.email}
                          {lead.service ? ` · ${lead.service}` : ""}
                        </Typography.Text>
                      }
                    />
                    <Tag color={LEAD_STATUS_COLORS[lead.status]}>{lead.status}</Tag>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        )}

        {/* Active projects */}
        {d?.projects && (
          <Col xs={24} lg={12}>
            <Card
              title="Active projects"
              loading={isLoading}
              extra={<Link to="/projects">All</Link>}
            >
              <List
                dataSource={d.projects.active}
                locale={{ emptyText: <Empty description="No active projects" /> }}
                renderItem={(project) => {
                  const done =
                    project.tasks?.filter((t) => t.status === "done").length ?? 0;
                  const total = project.tasks?.length ?? 0;
                  const pct = total ? Math.round((done / total) * 100) : 0;

                  return (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <Link to={`/projects/${project._id}`}>{project.name}</Link>
                        }
                        description={
                          <div style={{ maxWidth: 260 }}>
                            <Progress
                              percent={pct}
                              size="small"
                              strokeColor={BRAND.colorPrimary}
                            />
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                              {done}/{total} tasks
                              {project.deadline ? ` · due ${project.deadline}` : ""}
                            </Typography.Text>
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            </Card>
          </Col>
        )}

        {/* Recent activity */}
        {d?.activity && (
          <Col xs={24}>
            <Card
              title="Recent activity"
              loading={isLoading}
              extra={<Link to="/audit-logs">Full audit log</Link>}
            >
              {d.activity.length === 0 ? (
                <Empty description="Nothing yet" />
              ) : (
                <Timeline
                  items={d.activity.map((entry) => ({
                    color:
                      entry.action.includes("delete")
                        ? "red"
                        : entry.action.includes("create")
                          ? "green"
                          : "blue",
                    children: (
                      <div>
                        <Typography.Text>{entry.description}</Typography.Text>
                        <div>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {entry.user?.name ?? "system"} ·{" "}
                            {formatDistanceToNow(new Date(entry.createdAt), {
                              addSuffix: true,
                            })}
                          </Typography.Text>
                        </div>
                      </div>
                    ),
                  }))}
                />
              )}
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default DashboardPage;
