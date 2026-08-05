import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
} from "antd";
import { useEffect } from "react";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import {
  useGetAttendanceSettingsQuery,
  useUpdateAttendanceSettingsMutation,
} from "../../redux/api/hrmApi";

const WEEKDAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const AttendanceSettingsPage = () => {
  const { data, isLoading } = useGetAttendanceSettingsQuery();
  const [updateSettings, { isLoading: saving }] =
    useUpdateAttendanceSettingsMutation();
  const [form] = Form.useForm();

  useEffect(() => {
    if (data?.data) form.setFieldsValue(data.data);
  }, [data, form]);

  const onSubmit = async (values: Record<string, unknown>) => {
    try {
      await updateSettings(values).unwrap();
      toast.success("Attendance rules saved");
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not save the settings"
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="Attendance Settings"
        subtitle="Shift window, lateness rules and payroll defaults"
        extra={
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            Save settings
          </Button>
        }
      />

      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="These rules change how attendance is calculated"
        description="Existing records keep their stored values until they are recalculated. Changing the shift window or timezone affects how future punches are attributed to a day."
        />

      <Form form={form} layout="vertical" onFinish={onSubmit} disabled={isLoading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Shift window" style={{ height: "100%" }}>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="shiftStart"
                    label="Shift start"
                    extra="24-hour, e.g. 22:00"
                  >
                    <Input placeholder="22:00" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="shiftEnd"
                    label="Shift end"
                    extra="Next day when earlier than the start"
                  >
                    <Input placeholder="01:00" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="overnightCutoff"
                label="Overnight cutoff"
                extra="Punches before this time count towards the previous day's shift"
              >
                <Input placeholder="06:00" />
              </Form.Item>
              <Form.Item name="timezone" label="Timezone">
                <Input placeholder="Asia/Dhaka" />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Rules" style={{ height: "100%" }}>
              <Form.Item
                name="graceMinutes"
                label="Grace period (minutes)"
                extra="Arriving within this window still counts as on time"
              >
                <InputNumber min={0} max={180} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                name="requiredDailyMinutes"
                label="Required daily minutes"
                extra="Shorter days are marked incomplete — 180 is a 3-hour shift"
              >
                <InputNumber min={0} max={1440} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                name="optionalWeekdays"
                label="Optional working days"
                extra="Work on these days counts towards hours but never affects attendance or the bonus"
              >
                <Select mode="multiple" options={WEEKDAYS} />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24}>
            <Card title="Payroll defaults">
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Form.Item name="currency" label="Currency">
                    <Input placeholder="BDT" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="defaultBaseSalary"
                    label="Default base salary"
                    extra="Applied to new employees"
                  >
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="defaultPerfectBonus"
                    label="Perfect attendance bonus"
                    extra="Paid only for a month with no late, absent, leave or short days"
                  >
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default AttendanceSettingsPage;
