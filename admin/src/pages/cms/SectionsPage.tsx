import {
  Button,
  Card,
  Collapse,
  Empty,
  Form,
  Input,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import {
  useGetSectionsQuery,
  useUpdateSectionMutation,
} from "../../redux/api/cmsApi";

/* eslint-disable @typescript-eslint/no-explicit-any */

const PAGES = [
  { key: "home", label: "Home" },
  { key: "about", label: "About" },
  { key: "services", label: "Services" },
  { key: "process", label: "Process" },
  { key: "pricing", label: "Pricing" },
  { key: "portfolio", label: "Portfolio" },
  { key: "contact", label: "Contact" },
];

const LONG_FIELDS = ["description", "subtitle", "summary", "mission", "vision", "body"];

const humanize = (key: string) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

/** Renders one editable content object; nested objects (CTAs) recurse one level. */
const ContentFields = ({
  content,
  path = [],
}: {
  content: Record<string, any>;
  path?: string[];
}) => (
  <>
    {Object.entries(content ?? {}).map(([key, value]) => {
      const fieldPath = [...path, key];

      if (value && typeof value === "object" && !Array.isArray(value)) {
        return (
          <Card
            key={key}
            size="small"
            title={humanize(key)}
            style={{ marginBottom: 12 }}
          >
            <ContentFields content={value} path={fieldPath} />
          </Card>
        );
      }

      return (
        <Form.Item
          key={key}
          name={["content", ...fieldPath]}
          label={humanize(key)}
          style={{ marginBottom: 12 }}
        >
          {LONG_FIELDS.includes(key) ? (
            <Input.TextArea rows={3} />
          ) : (
            <Input />
          )}
        </Form.Item>
      );
    })}
  </>
);

const SectionForm = ({ section }: { section: any }) => {
  const [updateSection, { isLoading }] = useUpdateSectionMutation();
  const [form] = Form.useForm();

  const onSubmit = async (values: any) => {
    try {
      await updateSection({
        page: section.page,
        sectionKey: section.sectionKey,
        body: values,
      }).unwrap();
      toast.success(`"${section.label || section.sectionKey}" saved`);
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ?? "Could not save"
      );
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ content: section.content, visible: section.visible }}
      onFinish={onSubmit}
    >
      <ContentFields content={section.content} />
      <Space>
        <Button type="primary" htmlType="submit" loading={isLoading}>
          Save section
        </Button>
        <Form.Item name="visible" valuePropName="checked" noStyle>
          <Switch checkedChildren="visible" unCheckedChildren="hidden" />
        </Form.Item>
      </Space>
    </Form>
  );
};

const SectionsPage = () => {
  const [page, setPage] = useState("home");
  const { data, isFetching } = useGetSectionsQuery(page);

  const sections = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Page Content"
        subtitle="Headlines, intro copy and calls-to-action for each page of the website"
      />

      <Tabs
        activeKey={page}
        onChange={setPage}
        items={PAGES.map((p) => ({ key: p.key, label: p.label }))}
      />

      {!isFetching && sections.length === 0 ? (
        <Card>
          <Empty description={`No editable sections defined for the ${page} page yet`} />
        </Card>
      ) : (
        <Collapse
          accordion
          items={sections.map((section: any) => ({
            key: section._id,
            label: (
              <Space>
                <Typography.Text strong>
                  {section.label || section.sectionKey}
                </Typography.Text>
                <Tag>{section.sectionKey}</Tag>
                {!section.visible && <Tag color="orange">hidden</Tag>}
              </Space>
            ),
            children: <SectionForm section={section} />,
          }))}
        />
      )}
    </div>
  );
};

export default SectionsPage;
