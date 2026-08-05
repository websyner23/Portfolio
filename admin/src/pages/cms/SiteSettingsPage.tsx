import { Button, Card, Col, Form, Input, Row, Space, Switch } from "antd";
import { useEffect } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import ImageUpload from "../../components/cms/ImageUpload";
import PageHeader from "../../components/PageHeader";
import {
  useGetSiteSettingsQuery,
  useUpdateSiteSettingsMutation,
} from "../../redux/api/cmsApi";

const SiteSettingsPage = () => {
  const { data, isLoading } = useGetSiteSettingsQuery();
  const [updateSettings, { isLoading: saving }] = useUpdateSiteSettingsMutation();
  const [form] = Form.useForm();

  useEffect(() => {
    if (data?.data) form.setFieldsValue(data.data);
  }, [data, form]);

  const onSubmit = async (values: Record<string, unknown>) => {
    try {
      await updateSettings(values).unwrap();
      toast.success("Site settings saved — the website updates within seconds");
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ?? "Could not save"
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="Site Settings"
        subtitle="Brand details, contact info, navigation and social links used across the website"
        extra={
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            Save changes
          </Button>
        }
      />

      <Form form={form} layout="vertical" onFinish={onSubmit} disabled={isLoading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Brand" style={{ height: "100%" }}>
              <Form.Item name="brandName" label="Brand name">
                <Input />
              </Form.Item>
              <Form.Item name="tagline" label="Tagline">
                <Input />
              </Form.Item>
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item name="url" label="Website URL">
                <Input placeholder="https://websyner.co" />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="logo" label="Logo (light)">
                    <ImageUpload folder="websyner/brand" height={70} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="logoDark" label="Logo (dark)">
                    <ImageUpload folder="websyner/brand" height={70} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Contact" style={{ height: "100%" }}>
              <Form.Item name="email" label="Email">
                <Input />
              </Form.Item>
              <Form.Item name="phone" label="Phone">
                <Input />
              </Form.Item>
              <Form.Item name={["address", "line1"]} label="Address line 1">
                <Input />
              </Form.Item>
              <Form.Item name={["address", "line2"]} label="Address line 2">
                <Input />
              </Form.Item>
              <Form.Item name="footerNote" label="Footer note">
                <Input />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Social links" style={{ height: "100%" }}>
              {[
                "twitter",
                "linkedin",
                "instagram",
                "dribbble",
                "github",
                "facebook",
                "youtube",
              ].map((network) => (
                <Form.Item
                  key={network}
                  name={["social", network]}
                  label={network[0].toUpperCase() + network.slice(1)}
                >
                  <Input placeholder={`https://…`} />
                </Form.Item>
              ))}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Navigation" style={{ height: "100%" }}>
              <Form.List name="nav">
                {(items, { add, remove }) => (
                  <>
                    {items.map((item) => (
                      <Space
                        key={item.key}
                        align="start"
                        style={{ display: "flex", marginBottom: 8 }}
                      >
                        <Form.Item {...item} name={[item.name, "label"]} noStyle>
                          <Input placeholder="Label" style={{ width: 130 }} />
                        </Form.Item>
                        <Form.Item {...item} name={[item.name, "href"]} noStyle>
                          <Input placeholder="/path" style={{ width: 150 }} />
                        </Form.Item>
                        <Form.Item
                          {...item}
                          name={[item.name, "visible"]}
                          valuePropName="checked"
                          noStyle
                        >
                          <Switch size="small" />
                        </Form.Item>
                        <Button
                          danger
                          icon={<FiTrash2 />}
                          onClick={() => remove(item.name)}
                        />
                      </Space>
                    ))}
                    <Button
                      type="dashed"
                      block
                      icon={<FiPlus />}
                      onClick={() => add({ visible: true })}
                    >
                      Add nav item
                    </Button>
                  </>
                )}
              </Form.List>

              <div style={{ marginTop: 24 }}>
                <Form.Item name={["seo", "metaTitle"]} label="Meta title">
                  <Input />
                </Form.Item>
                <Form.Item name={["seo", "metaDescription"]} label="Meta description">
                  <Input.TextArea rows={2} />
                </Form.Item>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default SiteSettingsPage;
