import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Radio,
  Row,
  Space,
  Typography,
} from "antd";
import { useEffect } from "react";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import { useGetThemeQuery, useUpdateThemeMutation } from "../../redux/api/cmsApi";

const TOKENS: { key: string; label: string; help?: string }[] = [
  { key: "brand", label: "Brand", help: "Primary accent — buttons and highlights" },
  { key: "brandForeground", label: "Brand foreground", help: "Ink on brand fills" },
  { key: "brandInk", label: "Brand ink", help: "Brand-coloured text (contrast-safe)" },
  { key: "navy", label: "Navy" },
  { key: "navyForeground", label: "Navy foreground" },
  { key: "background", label: "Background" },
  { key: "foreground", label: "Foreground (text)" },
  { key: "card", label: "Card" },
  { key: "cardForeground", label: "Card foreground" },
  { key: "muted", label: "Muted" },
  { key: "mutedForeground", label: "Muted foreground" },
  { key: "border", label: "Border" },
  { key: "input", label: "Input" },
  { key: "ring", label: "Focus ring" },
  { key: "logoInk", label: "Logo ink" },
];

const ColorRow = ({ mode }: { mode: "light" | "dark" }) => (
  <>
    {TOKENS.map((token) => (
      <Form.Item
        key={token.key}
        label={token.label}
        extra={token.help}
        style={{ marginBottom: 14 }}
      >
        <Space>
          <Form.Item name={[mode, token.key]} noStyle>
            <Input type="color" style={{ width: 56, padding: 3, height: 34 }} />
          </Form.Item>
          <Form.Item name={[mode, token.key]} noStyle>
            <Input style={{ width: 110 }} placeholder="#000000" />
          </Form.Item>
        </Space>
      </Form.Item>
    ))}
  </>
);

const ThemePage = () => {
  const { data, isLoading } = useGetThemeQuery();
  const [updateTheme, { isLoading: saving }] = useUpdateThemeMutation();
  const [form] = Form.useForm();

  useEffect(() => {
    if (data?.data) form.setFieldsValue(data.data);
  }, [data, form]);

  const onSubmit = async (values: Record<string, unknown>) => {
    try {
      await updateTheme(values).unwrap();
      toast.success("Theme saved — the website picks up the new colours shortly");
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ?? "Could not save"
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="Theme & Colours"
        subtitle="Brand colours used by the public website in light and dark mode"
        extra={
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            Save theme
          </Button>
        }
      />

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="These values are injected as CSS variables on the website"
        description="Keep enough contrast between background and foreground pairs. Brand-coloured text should use 'Brand ink' rather than 'Brand' so it stays readable on both themes."
      />

      <Form form={form} layout="vertical" onFinish={onSubmit} disabled={isLoading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Light mode">
              <ColorRow mode="light" />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Dark mode">
              <ColorRow mode="dark" />
            </Card>
          </Col>
          <Col xs={24}>
            <Card title="Defaults">
              <Space size="large" wrap align="start">
                <Form.Item name="defaultMode" label="Default mode for new visitors">
                  <Radio.Group optionType="button" buttonStyle="solid">
                    <Radio.Button value="light">Light</Radio.Button>
                    <Radio.Button value="dark">Dark</Radio.Button>
                  </Radio.Group>
                </Form.Item>
                <Form.Item name="radius" label="Corner radius">
                  <Input style={{ width: 120 }} placeholder="0.75rem" />
                </Form.Item>
              </Space>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                Visitors can still switch themes themselves; this only sets the
                starting mode.
              </Typography.Paragraph>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default ThemePage;
