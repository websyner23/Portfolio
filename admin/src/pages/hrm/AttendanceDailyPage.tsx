import {
  Alert,
  Button,
  Card,
  DatePicker,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { format } from "date-fns";
import { useState } from "react";
import { FiCheckCircle } from "react-icons/fi";
import { toast } from "sonner";
import ExportXlsxButton from "../../components/ExportXlsxButton";
import PageHeader from "../../components/PageHeader";
import {
  useFinalizeDayMutation,
  useGetDailySheetQuery,
  type TDailyRow,
} from "../../redux/api/hrmApi";

const STATUS_COLORS: Record<string, string> = {
  present: "green",
  late: "orange",
  incomplete: "gold",
  absent: "red",
  leave: "blue",
  "optional-off": "default",
  "not-punched": "default",
};

const time = (value: string | null) =>
  value ? format(new Date(value), "h:mm a") : "—";

const AttendanceDailyPage = () => {
  const [date, setDate] = useState<Dayjs>(dayjs());
  const iso = date.format("YYYY-MM-DD");

  const { data, isFetching } = useGetDailySheetQuery(iso);
  const [finalize, { isLoading: finalizing }] = useFinalizeDayMutation();

  const sheet = data?.data;
  const rows = sheet?.rows ?? [];

  const onFinalize = async () => {
    try {
      const res = await finalize(iso).unwrap();
      const result = res.data as { absentMarked: number; autoClosed: number };
      toast.success(
        `Finalized ${iso} — ${result.absentMarked} marked absent, ${result.autoClosed} session(s) auto-closed`
      );
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not finalize the day"
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="Daily Attendance"
        subtitle={
          sheet
            ? `Shift ${sheet.shiftStart} – ${sheet.shiftEnd}`
            : "Who was in, who was late, who was missing"
        }
        extra={
          <>
            <DatePicker
              value={date}
              onChange={(d) => d && setDate(d)}
              allowClear={false}
            />
            <ExportXlsxButton
              fileName={`websyner-attendance-${iso}`}
              sheetName="Daily"
              rows={rows.map((r) => ({
                "Employee ID": r.employee.employeeId,
                Name: r.employee.fullName,
                Status: r.status,
                "First In": time(r.firstIn),
                "Last Out": time(r.lastOut),
                "Work Time": r.workedLabel,
                "Late (min)": r.lateMinutes,
                Note: r.note,
              }))}
            />
            <Popconfirm
              title={`Finalize ${iso}?`}
              description="Closes open sessions and marks missing employees absent."
              okText="Finalize"
              onConfirm={onFinalize}
            >
              <Button icon={<FiCheckCircle />} loading={finalizing}>
                Finalize day
              </Button>
            </Popconfirm>
          </>
        }
      />

      {sheet?.isOptionalDay && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="This is an optional working day"
          description="Work today counts towards total hours but never affects attendance or the perfect-attendance bonus."
        />
      )}

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey={(row: TDailyRow) => row.employee._id}
          loading={isFetching}
          dataSource={rows}
          scroll={{ x: 860 }}
          pagination={false}
          columns={[
            {
              title: "Employee",
              render: (_: unknown, row: TDailyRow) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>{row.employee.fullName}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {row.employee.employeeId}
                    {row.employee.designation ? ` · ${row.employee.designation}` : ""}
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: "Status",
              dataIndex: "status",
              width: 150,
              render: (status: string, row: TDailyRow) => (
                <Space>
                  <Tag color={STATUS_COLORS[status] ?? "default"}>{status}</Tag>
                  {row.isPunchedIn && <Tag color="green">in now</Tag>}
                </Space>
              ),
            },
            {
              title: "First in",
              dataIndex: "firstIn",
              width: 110,
              render: time,
            },
            {
              title: "Last out",
              dataIndex: "lastOut",
              width: 110,
              render: time,
            },
            {
              title: "Work time",
              dataIndex: "workedLabel",
              width: 110,
            },
            {
              title: "Late",
              dataIndex: "lateMinutes",
              width: 100,
              render: (minutes: number) =>
                minutes > 0 ? (
                  <Typography.Text type="warning">{minutes} min</Typography.Text>
                ) : (
                  "—"
                ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default AttendanceDailyPage;
