import { Card, Col, DatePicker, Progress, Row, Statistic, Table, Tag, Typography } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";
import ExportXlsxButton from "../../components/ExportXlsxButton";
import PageHeader from "../../components/PageHeader";
import {
  useGetMonthlySummaryQuery,
  type TMonthlyRow,
} from "../../redux/api/hrmApi";

const money = (value: number, currency = "BDT") =>
  `${currency === "BDT" ? "৳" : ""}${value.toLocaleString()}`;

const AttendanceMonthlyPage = () => {
  const [month, setMonth] = useState<Dayjs>(dayjs());
  const key = month.format("YYYY-MM");

  const { data, isFetching } = useGetMonthlySummaryQuery(key);
  const summary = data?.data;
  const rows = summary?.rows ?? [];
  const totals = summary?.totals;

  return (
    <div>
      <PageHeader
        title="Monthly Report"
        subtitle={
          summary
            ? `${month.format("MMMM YYYY")} · counted up to ${summary.upTo}`
            : "Attendance and payroll totals for the month"
        }
        extra={
          <>
            <DatePicker
              picker="month"
              value={month}
              onChange={(d) => d && setMonth(d)}
              allowClear={false}
            />
            <ExportXlsxButton
              fileName={`websyner-attendance-${key}`}
              sheetName={key}
              rows={rows.map((r) => ({
                "Employee ID": r.employee.employeeId,
                Employee: r.employee.fullName,
                Scheduled: r.scheduledDays,
                Present: r.presentDays,
                Late: r.lateDays,
                Incomplete: r.incompleteDays,
                Leave: r.leaveDays,
                Absent: r.absentDays,
                "Attendance %": `${r.attendancePct}%`,
                "Work Time": r.workTimeLabel,
                "Base Salary": r.baseSalary,
                Bonus: r.bonus,
                "Net Payable": r.netPayable,
                "Bonus Eligible": r.bonusEligible ? "Yes" : "No",
              }))}
            />
          </>
        }
      />

      {/* Company summary — mirrors the HRM sheet's dashboard */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {[
          { title: "Active employees", value: totals?.activeEmployees ?? 0 },
          { title: "Scheduled days", value: totals?.scheduledDays ?? 0 },
          { title: "Present", value: totals?.presentDays ?? 0 },
          { title: "Late", value: totals?.lateDays ?? 0 },
          { title: "Leave", value: totals?.leaveDays ?? 0 },
          { title: "Absent", value: totals?.absentDays ?? 0 },
        ].map((stat) => (
          <Col xs={12} sm={8} lg={4} key={stat.title}>
            <Card size="small" loading={isFetching}>
              <Statistic title={stat.title} value={stat.value} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card size="small" loading={isFetching}>
            <Statistic
              title="Total work time"
              value={totals?.totalWorkLabel ?? "0:00"}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" loading={isFetching}>
            <Statistic
              title="Bonus eligible"
              value={totals?.bonusEligible ?? 0}
              suffix={`/ ${totals?.activeEmployees ?? 0}`}
              valueStyle={{ color: "#0fcda1" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" loading={isFetching}>
            <Statistic
              title="Total payroll"
              value={money(totals?.totalPayroll ?? 0, summary?.currency)}
            />
          </Card>
        </Col>
      </Row>

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey={(row: TMonthlyRow) => row.employee._id}
          loading={isFetching}
          dataSource={rows}
          scroll={{ x: 1100 }}
          pagination={false}
          summary={() =>
            totals ? (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}>
                    <Typography.Text strong>Company total</Typography.Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    {totals.scheduledDays}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    {totals.presentDays}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>{totals.lateDays}</Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    {totals.leaveDays}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>
                    {totals.absentDays}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} />
                  <Table.Summary.Cell index={7}>
                    {totals.totalWorkLabel}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8} />
                  <Table.Summary.Cell index={9}>
                    <Typography.Text strong>
                      {money(totals.totalPayroll, summary?.currency)}
                    </Typography.Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            ) : null
          }
          columns={[
            {
              title: "Employee",
              fixed: "left",
              width: 190,
              render: (_: unknown, row: TMonthlyRow) => (
                <div>
                  <Typography.Text strong>{row.employee.fullName}</Typography.Text>
                  <div>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {row.employee.employeeId}
                    </Typography.Text>
                  </div>
                </div>
              ),
            },
            { title: "Scheduled", dataIndex: "scheduledDays", width: 100 },
            { title: "Present", dataIndex: "presentDays", width: 90 },
            {
              title: "Late",
              dataIndex: "lateDays",
              width: 80,
              render: (v: number) =>
                v > 0 ? <Typography.Text type="warning">{v}</Typography.Text> : v,
            },
            { title: "Leave", dataIndex: "leaveDays", width: 80 },
            {
              title: "Absent",
              dataIndex: "absentDays",
              width: 90,
              render: (v: number) =>
                v > 0 ? <Typography.Text type="danger">{v}</Typography.Text> : v,
            },
            {
              title: "Attendance",
              dataIndex: "attendancePct",
              width: 130,
              render: (pct: number) => (
                <Progress
                  percent={pct}
                  size="small"
                  strokeColor={pct >= 90 ? "#0fcda1" : pct >= 70 ? "#faad14" : "#ff4d4f"}
                />
              ),
            },
            { title: "Work time", dataIndex: "workTimeLabel", width: 110 },
            {
              title: "Bonus",
              dataIndex: "bonusEligible",
              width: 110,
              render: (eligible: boolean, row: TMonthlyRow) =>
                eligible ? (
                  <Tag color="green">{money(row.bonus, summary?.currency)}</Tag>
                ) : (
                  <Tag>—</Tag>
                ),
            },
            {
              title: "Net payable",
              dataIndex: "netPayable",
              width: 130,
              render: (v: number) => (
                <Typography.Text strong>
                  {money(v, summary?.currency)}
                </Typography.Text>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default AttendanceMonthlyPage;
