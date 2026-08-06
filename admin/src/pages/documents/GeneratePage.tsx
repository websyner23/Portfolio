import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Typography,
} from "antd";
import { toPng } from "html-to-image";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiDownload, FiFileText, FiPrinter } from "react-icons/fi";
import { toast } from "sonner";
import LetterPreview from "../../components/documents/LetterPreview";
import PageHeader from "../../components/PageHeader";
import {
  useGenerateDocumentMutation,
  useGetPlaceholdersQuery,
  useGetTemplatesQuery,
  usePreviewDocumentMutation,
} from "../../redux/api/documentApi";
import { useGetEmployeesQuery } from "../../redux/api/hrmApi";

const humanize = (key: string) =>
  key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

const GeneratePage = () => {
  const { data: templatesRes } = useGetTemplatesQuery();
  const { data: employeesRes } = useGetEmployeesQuery({ limit: 200 });
  const [preview, { isLoading: previewing }] = usePreviewDocumentMutation();
  const [generate, { isLoading: generating }] = useGenerateDocumentMutation();

  const [templateId, setTemplateId] = useState<string>();
  const [employeeId, setEmployeeId] = useState<string>();
  const [html, setHtml] = useState("");
  const [manualValues, setManualValues] = useState<Record<string, string>>({});
  const [form] = Form.useForm();
  const letterRef = useRef<HTMLDivElement>(null);

  const { data: placeholdersRes } = useGetPlaceholdersQuery(employeeId);

  const templates = templatesRes?.data ?? [];
  const template = templates.find((t) => t._id === templateId);

  const autoKeys = useMemo(
    () => new Set((placeholdersRes?.data ?? []).map((p) => p.key)),
    [placeholdersRes]
  );

  /** Only placeholders the generator can't work out need to be asked for. */
  const manualFields = useMemo(
    () => (template?.variables ?? []).filter((v) => !autoKeys.has(v)),
    [template, autoKeys]
  );

  // Re-render the preview whenever the inputs change.
  useEffect(() => {
    if (!templateId) {
      setHtml("");
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await preview({
          template: templateId,
          employee: employeeId,
          values: manualValues,
        }).unwrap();
        if (!cancelled) setHtml(res.data.renderedHtml);
      } catch {
        if (!cancelled) setHtml("");
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [templateId, employeeId, manualValues, preview]);

  const onDownloadImage = async () => {
    if (!letterRef.current) return;
    try {
      const dataUrl = await toPng(letterRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `${template?.name ?? "document"}.png`.replace(/\s+/g, "-").toLowerCase();
      link.href = dataUrl;
      link.click();
      toast.success("Image downloaded");
    } catch {
      toast.error("Could not export the image");
    }
  };

  /** Opens a print window with just the letter — the route to a PDF. */
  const onPrint = () => {
    if (!letterRef.current) return;
    const win = window.open("", "_blank", "width=900,height=1000");
    if (!win) {
      toast.error("Allow pop-ups to print this document");
      return;
    }
    win.document.write(`
      <html>
        <head>
          <title>${template?.name ?? "Document"}</title>
          <style>
            body { margin: 0; }
            @page { size: A4; margin: 0; }
          </style>
        </head>
        <body>${letterRef.current.outerHTML}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  const onIssue = async () => {
    if (!templateId) return;
    try {
      const res = await generate({
        template: templateId,
        employee: employeeId,
        values: manualValues,
      }).unwrap();
      toast.success(`Issued as ${res.data.reference}`);
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not issue the document"
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="Generate a Document"
        subtitle="Pick a template and an employee — the rest fills itself in"
        extra={
          <>
            <Button icon={<FiPrinter />} onClick={onPrint} disabled={!html}>
              Print / PDF
            </Button>
            <Button icon={<FiDownload />} onClick={onDownloadImage} disabled={!html}>
              Download image
            </Button>
            <Button
              type="primary"
              icon={<FiFileText />}
              loading={generating}
              disabled={!templateId}
              onClick={onIssue}
            >
              Issue & save
            </Button>
          </>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Details" style={{ position: "sticky", top: 80 }}>
            <Form form={form} layout="vertical">
              <Form.Item label="Template" required>
                <Select
                  placeholder="Pick a letter"
                  value={templateId}
                  onChange={(v) => {
                    setTemplateId(v);
                    setManualValues({});
                  }}
                  options={templates.map((t) => ({
                    value: t._id,
                    label: t.name,
                  }))}
                />
              </Form.Item>

              <Form.Item
                label="Employee"
                extra="Fills in their name, ID, role, dates and salary"
              >
                <Select
                  placeholder="Pick an employee"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  value={employeeId}
                  onChange={setEmployeeId}
                  options={(employeesRes?.data ?? []).map((e) => ({
                    value: e._id,
                    label: `${e.fullName} (${e.employeeId})`,
                  }))}
                />
              </Form.Item>

              {template && manualFields.length > 0 && (
                <>
                  <Typography.Text
                    strong
                    style={{ display: "block", margin: "16px 0 8px" }}
                  >
                    Fill in the rest
                  </Typography.Text>
                  {manualFields.map((field) => (
                    <Form.Item key={field} label={humanize(field)}>
                      <Input
                        value={manualValues[field] ?? ""}
                        placeholder={humanize(field)}
                        onChange={(e) =>
                          setManualValues((prev) => ({
                            ...prev,
                            [field]: e.target.value,
                          }))
                        }
                      />
                    </Form.Item>
                  ))}
                </>
              )}

              {template && manualFields.length === 0 && (
                <Alert
                  type="success"
                  showIcon
                  message="Everything is filled in automatically"
                />
              )}
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title="Preview"
            extra={
              previewing ? (
                <Space size={6}>
                  <Spin size="small" />
                  <Typography.Text type="secondary">Updating…</Typography.Text>
                </Space>
              ) : null
            }
            styles={{ body: { background: "rgba(128,128,128,.08)", padding: 20 } }}
          >
            {html ? (
              <>
                <LetterPreview ref={letterRef} html={html} />
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginTop: 16 }}
                  message="Highlighted fields are still empty"
                  description="Anything shown as [field_name] hasn't been filled in yet — fill it before issuing the letter."
                />
              </>
            ) : (
              <Empty
                description="Pick a template to see the letter"
                style={{ padding: 60 }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default GeneratePage;
