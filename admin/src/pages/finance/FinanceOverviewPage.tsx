import { Card, Col, DatePicker, Empty, List, Row, Statistic, Tag, Typography } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";
import ReactApexChart from "react-apexcharts";
import PageHeader from "../../components/PageHeader";
import { useAppSelector } from "../../redux/hooks";
import { useGetFinanceOverviewQuery } from "../../redux/api/financeApi";

export const money = (value = 0) => `৳${value.toLocaleString()}`;

const FinanceOverviewPage = () => {
  const [month, setMonth] = useState<Dayjs>(dayjs());
  const themeMode = useAppSelector((s) => s.ui.themeMode);
  const { data, isFetching } = useGetFinanceOverviewQuery(month.format("YYYY-MM"));

  const overview = data?.data;
  const totals = overview?.totals;
  const trend = overview?.trend ?? [];

  const chartTheme = { mode: themeMode as "light" | "dark" };

  return (
    <div>
      <PageHeader
        title="Finance"
        subtitle="Balances, cash flow, pending income and payroll"
        extra={
          <DatePicker
            picker="month"
            value={month}
            onChange={(d) => d && setMonth(d)}
            allowClear={false}
          />
        }
      />

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}>
          <Card size="small" loading={isFetching}>
            <Statistic
              title="Total balance"
              value={money(totals?.balance)}
              valueStyle={{ color: "#0fcda1" }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card size="small" loading={isFetching}>
            <Statistic title="Income this month" value={money(totals?.monthIncome)} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card size="small" loading={isFetching}>
            <Statistic
              title="Expenses this month"
              value={money(totals?.monthExpense)}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card size="small" loading={isFetching}>
            <Statistic
              title="Net this month"
              value={money(totals?.monthNet)}
              valueStyle={{
                color: (totals?.monthNet ?? 0) >= 0 ? "#0fcda1" : "#ff4d4f",
              }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card size="small" loading={isFetching}>
            <Statistic
              title="Pending client income"
              value={money(totals?.pendingIncome)}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" loading={isFetching}>
            <Statistic
              title="Unpaid payroll"
              value={money(totals?.pendingPayroll)}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" loading={isFetching}>
            <Statistic title="Active employees" value={totals?.activeEmployees ?? 0} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={15}>
          <Card title="Income vs expenses — last 6 months" loading={isFetching}>
            <ReactApexChart
              type="bar"
              height={300}
              series={[
                { name: "Income", data: trend.map((t) => t.income) },
                { name: "Expenses", data: trend.map((t) => t.expense) },
              ]}
              options={{
                chart: { toolbar: { show: false }, fontFamily: "inherit" },
                theme: chartTheme,
                colors: ["#0fcda1", "#ff7875"],
                plotOptions: {
                  bar: { borderRadius: 4, columnWidth: "55%" },
                },
                dataLabels: { enabled: false },
                grid: { borderColor: "rgba(128,128,128,.15)" },
                xaxis: {
                  categories: trend.map((t) =>
                    dayjs(`${t.month}-01`).format("MMM")
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

        <Col xs={24} lg={9}>
          <Card title="Accounts" loading={isFetching} style={{ marginBottom: 16 }}>
            <List
              dataSource={overview?.accounts ?? []}
              locale={{ emptyText: <Empty description="No accounts yet" /> }}
              renderItem={(account) => (
                <List.Item>
                  <List.Item.Meta
                    title={account.name}
                    description={<Tag>{account.type}</Tag>}
                  />
                  <Typography.Text strong>{money(account.balance)}</Typography.Text>
                </List.Item>
              )}
            />
          </Card>

          <Card title="Upcoming receivables" loading={isFetching}>
            <List
              dataSource={overview?.upcomingReceivables ?? []}
              locale={{ emptyText: <Empty description="Nothing outstanding" /> }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.title}
                    description={
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {item.client}
                        {item.dueDate ? ` · due ${item.dueDate}` : ""}
                      </Typography.Text>
                    }
                  />
                  <Typography.Text strong>
                    {money(item.amount - (item.paidAmount ?? 0))}
                  </Typography.Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {(overview?.incomeByProject?.length ?? 0) > 0 && (
          <Col xs={24}>
            <Card title="Income by project" loading={isFetching}>
              <ReactApexChart
                type="bar"
                height={280}
                series={[
                  {
                    name: "Income",
                    data: overview!.incomeByProject.map((p) => p.total),
                  },
                ]}
                options={{
                  chart: { toolbar: { show: false }, fontFamily: "inherit" },
                  theme: chartTheme,
                  colors: ["#0fcda1"],
                  plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
                  dataLabels: { enabled: false },
                  grid: { borderColor: "rgba(128,128,128,.15)" },
                  xaxis: {
                    categories: overview!.incomeByProject.map((p) => p.name),
                  },
                  tooltip: { y: { formatter: (v: number) => money(v) } },
                }}
              />
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default FinanceOverviewPage;
