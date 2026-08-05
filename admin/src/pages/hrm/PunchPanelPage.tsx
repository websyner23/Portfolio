import { Alert, Button, Card, Col, Row, Statistic, Tag, Typography } from "antd";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { FiLogIn, FiLogOut } from "react-icons/fi";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import { BRAND } from "../../config";
import {
  useGetMyTodayQuery,
  usePunchInMutation,
  usePunchOutMutation,
} from "../../redux/api/hrmApi";

/** Live h:mm:ss since the open session started. */
const useElapsed = (since: string | null) => {
  const [elapsed, setElapsed] = useState("0:00:00");

  useEffect(() => {
    if (!since) {
      setElapsed("0:00:00");
      return;
    }

    const tick = () => {
      const seconds = Math.max(
        0,
        Math.floor((Date.now() - new Date(since).getTime()) / 1000)
      );
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      setElapsed(`${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [since]);

  return elapsed;
};

const PunchPanelPage = () => {
  const { data, isLoading, error } = useGetMyTodayQuery();
  const [punchIn, { isLoading: punchingIn }] = usePunchInMutation();
  const [punchOut, { isLoading: punchingOut }] = usePunchOutMutation();

  const today = data?.data;
  const elapsed = useElapsed(today?.openSince ?? null);

  const notLinked =
    (error as { data?: { message?: string } })?.data?.message?.includes("linked");

  const handle = async (action: "in" | "out") => {
    try {
      if (action === "in") {
        await punchIn().unwrap();
        toast.success("Punched in — have a good shift");
      } else {
        await punchOut().unwrap();
        toast.success("Punched out — session recorded");
      }
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not record the punch"
      );
    }
  };

  if (notLinked) {
    return (
      <div>
        <PageHeader title="Punch Panel" />
        <Alert
          type="warning"
          showIcon
          message="Your account isn't linked to an employee record"
          description="Ask an administrator to link your login to your employee profile so you can clock in and out."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Punch Panel"
        subtitle={
          today
            ? `Shift ${today.rules.shiftStart} – ${today.rules.shiftEnd} · ${today.rules.graceMinutes} min grace`
            : undefined
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card loading={isLoading} style={{ textAlign: "center" }}>
            <Typography.Text type="secondary">
              Shift date {today?.shiftDate}
            </Typography.Text>

            <div style={{ margin: "20px 0" }}>
              <Tag
                color={today?.isPunchedIn ? "green" : "default"}
                style={{ fontSize: 14, padding: "4px 14px", borderRadius: 999 }}
              >
                {today?.isPunchedIn ? "Currently punched in" : "Not punched in"}
              </Tag>
            </div>

            <Typography.Title
              level={1}
              style={{
                margin: "12px 0",
                fontVariantNumeric: "tabular-nums",
                color: today?.isPunchedIn ? BRAND.colorPrimary : undefined,
              }}
            >
              {today?.isPunchedIn ? elapsed : today?.workedLabel ?? "0:00"}
            </Typography.Title>

            <Typography.Text type="secondary">
              {today?.isPunchedIn
                ? `Since ${today.openSince ? format(new Date(today.openSince), "h:mm a") : "—"}`
                : "Total worked this shift"}
            </Typography.Text>

            <div style={{ marginTop: 28 }}>
              {today?.isPunchedIn ? (
                <Button
                  danger
                  type="primary"
                  size="large"
                  icon={<FiLogOut />}
                  loading={punchingOut}
                  onClick={() => handle("out")}
                  style={{ height: 56, paddingInline: 40, fontSize: 16 }}
                >
                  Punch out
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  icon={<FiLogIn />}
                  loading={punchingIn}
                  onClick={() => handle("in")}
                  style={{ height: 56, paddingInline: 40, fontSize: 16 }}
                >
                  Punch in
                </Button>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="This shift" loading={isLoading}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic title="Worked" value={today?.workedLabel ?? "0:00"} />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Shift window"
                  value={`${today?.rules.shiftStart ?? "--"} – ${today?.rules.shiftEnd ?? "--"}`}
                />
              </Col>
            </Row>

            <Alert
              style={{ marginTop: 20 }}
              type="info"
              showIcon
              message="Working past midnight is fine"
              description="Punches before the overnight cutoff count towards the previous day's shift, so a session that ends at 1 AM stays on the right date."
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PunchPanelPage;
