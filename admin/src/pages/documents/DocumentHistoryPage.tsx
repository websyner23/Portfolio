import {
  Button,
  Card,
  Drawer,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { format } from "date-fns";
import { toPng } from "html-to-image";
import { useRef, useState } from "react";
import { FiDownload, FiEye, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import LetterPreview from "../../components/documents/LetterPreview";
import PageHeader from "../../components/PageHeader";
import { useTableQuery } from "../../hooks/useTableQuery";
import {
  DOCUMENT_TYPES,
  useDeleteGeneratedDocumentMutation,
  useGetGeneratedDocumentQuery,
  useGetGeneratedDocumentsQuery,
  type TGeneratedDocument,
} from "../../redux/api/documentApi";

const DocumentViewer = ({ id, onClose }: { id: string; onClose: () => void }) => {
  const { data, isFetching } = useGetGeneratedDocumentQuery(id);
  const letterRef = useRef<HTMLDivElement>(null);
  const doc = data?.data;

  const download = async () => {
    if (!letterRef.current) return;
    try {
      const dataUrl = await toPng(letterRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `${doc?.reference ?? "document"}.png`.replace(/\//g, "-");
      link.href = dataUrl;
      link.click();
      toast.success("Image downloaded");
    } catch {
      toast.error("Could not export the image");
    }
  };

  return (
    <Drawer
      title={doc?.title ?? "Document"}
      open
      onClose={onClose}
      width={900}
      loading={isFetching}
      extra={
        <Button icon={<FiDownload />} onClick={download} disabled={!doc}>
          Download
        </Button>
      }
      styles={{ body: { background: "rgba(128,128,128,.08)" } }}
    >
      {doc && (
        <>
          <Space wrap style={{ marginBottom: 16 }}>
            <Tag>{doc.reference}</Tag>
            <Typography.Text type="secondary">
              Issued {format(new Date(doc.issuedAt), "dd MMM yyyy")}
              {doc.issuedBy ? ` by ${doc.issuedBy.name}` : ""}
            </Typography.Text>
          </Space>
          <LetterPreview ref={letterRef} html={doc.renderedHtml ?? ""} />
        </>
      )}
    </Drawer>
  );
};

const DocumentHistoryPage = () => {
  const table = useTableQuery();
  const { data, isFetching } = useGetGeneratedDocumentsQuery(table.params);
  const [deleteDocument] = useDeleteGeneratedDocumentMutation();
  const [viewing, setViewing] = useState<string | null>(null);

  return (
    <div>
      <PageHeader
        title="Issued Documents"
        subtitle="Every letter that has been generated, kept exactly as it was issued"
        extra={
          <>
            <Input.Search
              placeholder="Search title, recipient or reference"
              allowClear
              onSearch={table.search}
              style={{ width: 260 }}
            />
            <Select
              placeholder="Type"
              allowClear
              style={{ width: 200 }}
              options={DOCUMENT_TYPES}
              onChange={(v) => table.setFilter("type", v)}
            />
          </>
        }
      />

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="_id"
          loading={isFetching}
          dataSource={data?.data ?? []}
          scroll={{ x: 880 }}
          pagination={{
            current: table.page,
            pageSize: table.limit,
            total: data?.meta?.total ?? 0,
            showSizeChanger: true,
            onChange: (p, ps) => {
              table.setPage(p);
              table.setLimit(ps);
            },
          }}
          columns={[
            {
              title: "Reference",
              dataIndex: "reference",
              width: 190,
              render: (ref: string) => <Tag>{ref}</Tag>,
            },
            {
              title: "Document",
              dataIndex: "title",
              render: (title: string, row: TGeneratedDocument) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>{title}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {row.templateName}
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: "Recipient",
              width: 180,
              render: (_: unknown, row: TGeneratedDocument) =>
                row.employee?.fullName ?? row.recipientName ?? "—",
            },
            {
              title: "Issued",
              dataIndex: "issuedAt",
              width: 130,
              render: (d: string) => format(new Date(d), "dd MMM yyyy"),
            },
            {
              title: "",
              width: 90,
              align: "right",
              render: (_: unknown, row: TGeneratedDocument) => (
                <Space>
                  <Button
                    size="small"
                    icon={<FiEye />}
                    onClick={() => setViewing(row._id)}
                  />
                  <Popconfirm
                    title="Delete this document?"
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    onConfirm={async () => {
                      try {
                        await deleteDocument(row._id).unwrap();
                        toast.success("Document deleted");
                      } catch {
                        toast.error("Could not delete the document");
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

      {viewing && (
        <DocumentViewer id={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
};

export default DocumentHistoryPage;
