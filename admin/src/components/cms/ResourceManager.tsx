import {
  Button,
  Card,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import {
  TCmsResource,
  useCreateCmsItemMutation,
  useDeleteCmsItemMutation,
  useGetCmsListQuery,
  useUpdateCmsItemMutation,
} from "../../redux/api/cmsApi";
import PageHeader from "../PageHeader";
import ImageUpload from "./ImageUpload";
import RichText from "./RichText";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type TFieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "switch"
  | "select"
  | "tags"
  | "image"
  | "color"
  | "list" // array of strings
  | "pairs"; // array of { [keyA]: string; [keyB]: string }

export type TField = {
  /** Field path — an array addresses a nested value, e.g. ["colors", "from"]. */
  name: string | string[];
  label: string;
  type: TFieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: { value: string; label: string }[];
  /** For "pairs": the two object keys, e.g. ["label", "value"]. */
  pairKeys?: [string, string];
  /** Field spans the full drawer width (default true). */
  span?: number;
  initialValue?: unknown;
};

type Props = {
  resource: TCmsResource;
  title: string;
  subtitle?: string;
  /** Columns shown in the table. */
  columns: ColumnsType<any>;
  /** Fields rendered in the create/edit drawer. */
  fields: TField[];
  /** Extra query params, e.g. { group: "general" }. */
  params?: Record<string, string | number>;
  /** Values merged into every created item (e.g. a fixed group). */
  createDefaults?: Record<string, unknown>;
  drawerWidth?: number;
  searchPlaceholder?: string;
};

const renderField = (field: TField) => {
  switch (field.type) {
    case "textarea":
      return <Input.TextArea rows={3} placeholder={field.placeholder} />;
    case "richtext":
      return <RichText placeholder={field.placeholder} />;
    case "number":
      return <InputNumber style={{ width: "100%" }} />;
    case "switch":
      return <Switch />;
    case "select":
      return <Select options={field.options} placeholder={field.placeholder} allowClear />;
    case "tags":
      return (
        <Select
          mode="tags"
          tokenSeparators={[","]}
          placeholder={field.placeholder ?? "Type and press enter"}
          open={false}
        />
      );
    case "image":
      return <ImageUpload />;
    case "color":
      return <Input type="color" style={{ width: 90, padding: 4, height: 36 }} />;
    default:
      return <Input placeholder={field.placeholder} />;
  }
};

/** Repeating string list, e.g. features / outcomes / bullets. */
const ListField = ({ name, label }: { name: string; label: string }) => (
  <Form.List name={name}>
    {(items, { add, remove }) => (
      <div style={{ marginBottom: 18 }}>
        <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
          {label}
        </Typography.Text>
        {items.map((item) => (
          <Space key={item.key} style={{ display: "flex", marginBottom: 8 }} align="start">
            <Form.Item {...item} noStyle>
              <Input style={{ width: 420, maxWidth: "60vw" }} />
            </Form.Item>
            <Button danger icon={<FiTrash2 />} onClick={() => remove(item.name)} />
          </Space>
        ))}
        <Button type="dashed" onClick={() => add("")} icon={<FiPlus />} block>
          Add {label.toLowerCase()}
        </Button>
      </div>
    )}
  </Form.List>
);

/** Repeating object list with two string keys, e.g. metrics or FAQs. */
const PairsField = ({
  name,
  label,
  pairKeys,
}: {
  name: string;
  label: string;
  pairKeys: [string, string];
}) => (
  <Form.List name={name}>
    {(items, { add, remove }) => (
      <div style={{ marginBottom: 18 }}>
        <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
          {label}
        </Typography.Text>
        {items.map((item) => (
          <Space key={item.key} style={{ display: "flex", marginBottom: 8 }} align="start">
            <Form.Item {...item} name={[item.name, pairKeys[0]]} noStyle>
              <Input placeholder={pairKeys[0]} style={{ width: 190 }} />
            </Form.Item>
            <Form.Item {...item} name={[item.name, pairKeys[1]]} noStyle>
              <Input.TextArea
                placeholder={pairKeys[1]}
                autoSize={{ minRows: 1, maxRows: 4 }}
                style={{ width: 250 }}
              />
            </Form.Item>
            <Button danger icon={<FiTrash2 />} onClick={() => remove(item.name)} />
          </Space>
        ))}
        <Button type="dashed" onClick={() => add({})} icon={<FiPlus />} block>
          Add {label.toLowerCase()}
        </Button>
      </div>
    )}
  </Form.List>
);

/**
 * Table + drawer form for any CMS collection. Each page supplies its columns
 * and field config; the CRUD wiring, ordering and toasts are shared.
 */
const ResourceManager = ({
  resource,
  title,
  subtitle,
  columns,
  fields,
  params,
  createDefaults,
  drawerWidth = 620,
  searchPlaceholder = "Search…",
}: Props) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data, isFetching } = useGetCmsListQuery({
    resource,
    params: { limit: 200, ...params, ...(searchTerm ? { searchTerm } : {}) },
  });
  const [createItem, { isLoading: creating }] = useCreateCmsItemMutation();
  const [updateItem, { isLoading: updating }] = useUpdateCmsItemMutation();
  const [deleteItem] = useDeleteCmsItemMutation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue(editing);
    } else {
      form.resetFields();
      fields.forEach((f) => {
        if (f.initialValue !== undefined) {
          form.setFieldValue(f.name, f.initialValue);
        }
      });
    }
  }, [open, editing, form, fields]);

  const onSubmit = async (values: any) => {
    try {
      if (editing) {
        await updateItem({ resource, id: editing._id, body: values }).unwrap();
        toast.success(`${title} updated`);
      } else {
        await createItem({
          resource,
          body: { ...createDefaults, ...values },
        }).unwrap();
        toast.success(`${title} created`);
      }
      setOpen(false);
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ?? "Could not save"
      );
    }
  };

  const tableColumns: ColumnsType<any> = [
    ...columns,
    {
      title: "",
      key: "__actions",
      width: 100,
      align: "right",
      fixed: "right",
      render: (_: unknown, row: any) => (
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
            title="Delete this item?"
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={async () => {
              try {
                await deleteItem({ resource, id: row._id }).unwrap();
                toast.success("Deleted");
              } catch {
                toast.error("Could not delete");
              }
            }}
          >
            <Button size="small" danger icon={<FiTrash2 />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        extra={
          <>
            <Input.Search
              placeholder={searchPlaceholder}
              allowClear
              onSearch={setSearchTerm}
              style={{ width: 230 }}
            />
            <Button
              type="primary"
              icon={<FiPlus />}
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              Add
            </Button>
          </>
        }
      />

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="_id"
          loading={isFetching}
          dataSource={data?.data ?? []}
          columns={tableColumns}
          scroll={{ x: 760 }}
          pagination={{ pageSize: 20, hideOnSinglePage: true }}
        />
      </Card>

      <Drawer
        title={editing ? `Edit ${title.toLowerCase()}` : `New ${title.toLowerCase()}`}
        open={open}
        onClose={() => setOpen(false)}
        width={drawerWidth}
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
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          {fields.map((field) => {
            const key = Array.isArray(field.name)
              ? field.name.join(".")
              : field.name;

            if (field.type === "list") {
              return <ListField key={key} name={key} label={field.label} />;
            }
            if (field.type === "pairs") {
              return (
                <PairsField
                  key={key}
                  name={key}
                  label={field.label}
                  pairKeys={field.pairKeys ?? ["label", "value"]}
                />
              );
            }
            return (
              <Form.Item
                key={key}
                name={field.name}
                label={field.label}
                extra={field.help}
                valuePropName={field.type === "switch" ? "checked" : "value"}
                rules={
                  field.required
                    ? [{ required: true, message: `${field.label} is required` }]
                    : undefined
                }
              >
                {renderField(field)}
              </Form.Item>
            );
          })}
        </Form>
      </Drawer>
    </div>
  );
};

export default ResourceManager;

/** Shared column renderers. */
export const activeColumn = {
  title: "Active",
  dataIndex: "isActive",
  width: 90,
  render: (v: boolean) => (
    <Tag color={v ? "green" : "default"}>{v ? "live" : "hidden"}</Tag>
  ),
};

export const orderColumn = {
  title: "#",
  dataIndex: "order",
  width: 60,
};
