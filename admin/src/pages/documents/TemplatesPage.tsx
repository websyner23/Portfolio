import {
  Alert,
  Button,
  Card,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { FiCopy, FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import RichText from "../../components/cms/RichText";
import PageHeader from "../../components/PageHeader";
import {
  DOCUMENT_TYPES,
  useCreateTemplateMutation,
  useDeleteTemplateMutation,
  useGetPlaceholdersQuery,
  useGetTemplatesQuery,
  useUpdateTemplateMutation,
  type TDocumentTemplate,
} from "../../redux/api/documentApi";

const TemplatesPage = () => {
  const { data, isFetching } = useGetTemplatesQuery();
  const { data: placeholdersRes } = useGetPlaceholdersQuery();
  const [createTemplate, { isLoading: creating }] = useCreateTemplateMutation();
  const [updateTemplate, { isLoading: updating }] = useUpdateTemplateMutation();
  const [deleteTemplate] = useDeleteTemplateMutation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TDocumentTemplate | null>(null);
  const [form] = Form.useForm();

  const templates = data?.data ?? [];
  const placeholders = placeholdersRes?.data ?? [];

  useEffect(() => {
    if (!open) return;
    if (editing) form.setFieldsValue(editing);
    else {
      form.resetFields();
      form.setFieldsValue({ type: "custom", isActive: true });
    }
  }, [open, editing, form]);

  const onSubmit = async (values: Record<string, unknown>) => {
    try {
      if (editing) {
        await updateTemplate({ id: editing._id, body: values }).unwrap();
        toast.success("Template saved");
      } else {
        await createTemplate(values).unwrap();
        toast.success("Template created");
      }
      setOpen(false);
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not save the template"
      );
    }
  };

  const copyPlaceholder = (key: string) => {
    void navigator.clipboard?.writeText(`{{${key}}}`);
    toast.success(`{{${key}}} copied — paste it into the letter`);
  };

  return (
    <div>
      <PageHeader
        title="Document Templates"
        subtitle="Reusable letters with placeholders the generator fills in"
        extra={
          <Button
            type="primary"
            icon={<FiPlus />}
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            New template
          </Button>
        }
      />

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="_id"
          loading={isFetching}
          dataSource={templates}
          scroll={{ x: 820 }}
          pagination={false}
          columns={[
            {
              title: "Template",
              dataIndex: "name",
              render: (name: string, row: TDocumentTemplate) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>{name}</Typography.Text>
                  {row.description && (
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {row.description}
                    </Typography.Text>
                  )}
                </Space>
              ),
            },
            {
              title: "Type",
              dataIndex: "type",
              width: 190,
              render: (type: string) => (
                <Tag>
                  {DOCUMENT_TYPES.find((t) => t.value === type)?.label ?? type}
                </Tag>
              ),
            },
            {
              title: "Placeholders",
              dataIndex: "variables",
              render: (vars: string[]) => (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {vars.length} field{vars.length === 1 ? "" : "s"}
                </Typography.Text>
              ),
            },
            {
              title: "Updated",
              dataIndex: "updatedAt",
              width: 130,
              render: (d: string) => format(new Date(d), "dd MMM yyyy"),
            },
            {
              title: "",
              width: 90,
              align: "right",
              render: (_: unknown, row: TDocumentTemplate) => (
                <Space>
                  <Button
                    size="small"
                    icon={<FiEdit2 />}
                    onClick={() => {
                      setEditing(row);
                      setOpen(true);
                    }}
                  />
                  <Popconfirm
                    title="Delete this template?"
                    description="Letters already issued from it are unaffected."
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    onConfirm={async () => {
                      try {
                        await deleteTemplate(row._id).unwrap();
                        toast.success("Template deleted");
                      } catch {
                        toast.error("Could not delete the template");
                      }
                    }}
                  >
                    <Button size="small" danger icon={<FiTrash2 />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        title={editing ? `Edit — ${editing.name}` : "New template"}
        open={open}
        onClose={() => setOpen(false)}
        width={860}
        extra={
          <Button
            type="primary"
            loading={creating || updating}
            onClick={() => form.submit()}
          >
            Save
          </Button>
        }
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Write the letter, and use placeholders for anything that changes"
          description={
            <div>
              <Typography.Paragraph style={{ marginBottom: 8 }}>
                Type <code>{"{{placeholder_name}}"}</code> anywhere in the body.
                The fields below are filled in automatically from the employee
                and your site settings; anything else becomes a question on the
                generator page.
              </Typography.Paragraph>
              <Space wrap size={[4, 4]}>
                {placeholders.map((p) => (
                  <Tooltip key={p.key} title={p.sample || "filled at generation"}>
                    <Tag
                      style={{ cursor: "pointer" }}
                      onClick={() => copyPlaceholder(p.key)}
                      icon={<FiCopy style={{ marginRight: 4 }} />}
                    >
                      {`{{${p.key}}}`}
                    </Tag>
                  </Tooltip>
                ))}
              </Space>
            </div>
          }
        />

        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Space style={{ display: "flex" }} align="start">
            <Form.Item
              name="name"
              label="Template name"
              rules={[{ required: true, message: "Name is required" }]}
              style={{ flex: 1, minWidth: 260 }}
            >
              <Input placeholder="Offer Letter" />
            </Form.Item>
            <Form.Item name="type" label="Type" style={{ width: 220 }}>
              <Select options={DOCUMENT_TYPES} />
            </Form.Item>
          </Space>

          <Form.Item name="description" label="When to use this">
            <Input placeholder="Sent to a candidate once terms are agreed" />
          </Form.Item>

          <Form.Item
            name="contentHtml"
            label="Letter body"
            rules={[{ required: true, message: "The letter body is required" }]}
          >
            <RichText height={380} placeholder="Dear {{employee_name}}, …" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default TemplatesPage;
