import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Progress,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import { BRAND } from "../../config";
import { usePermission } from "../../hooks/usePermission";
import { useTableQuery } from "../../hooks/useTableQuery";
import { useGetUsersQuery } from "../../redux/api/userApi";
import {
  PROJECT_STATUSES,
  useCreateProjectMutation,
  useGetProjectsQuery,
  type TProject,
} from "../../redux/api/projectApi";

const statusMeta = (status: string) =>
  PROJECT_STATUSES.find((s) => s.value === status);

const ProjectsPage = () => {
  const navigate = useNavigate();
  const table = useTableQuery();
  const { can } = usePermission();
  const { data, isFetching } = useGetProjectsQuery(table.params);
  const { data: usersRes } = useGetUsersQuery({ limit: 200 });
  const [createProject, { isLoading: creating }] = useCreateProjectMutation();

  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const projects = data?.data?.projects ?? [];
  const unread = data?.data?.unread ?? {};
  const canManage = can("projects.manage");

  const userOptions =
    usersRes?.data?.map((u) => ({ value: u._id, label: u.name })) ?? [];

  const onSubmit = async (values: Record<string, unknown>) => {
    try {
      const res = await createProject(values).unwrap();
      toast.success(`Project created — ${res.data.code}`);
      setOpen(false);
      form.resetFields();
      navigate(`/projects/${res.data._id}`);
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not create the project"
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Client work, tasks and the team chat that goes with each one"
        extra={
          <>
            <Input.Search
              placeholder="Search name, code or client"
              allowClear
              onSearch={table.search}
              style={{ width: 240 }}
            />
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 150 }}
              options={PROJECT_STATUSES}
              onChange={(v) => table.setFilter("status", v)}
            />
            {canManage && (
              <Button type="primary" icon={<FiPlus />} onClick={() => setOpen(true)}>
                New project
              </Button>
            )}
          </>
        }
      />

      {!isFetching && projects.length === 0 ? (
        <Card>
          <Empty
            description={
              canManage
                ? "No projects yet — create your first one"
                : "You haven't been added to any projects yet"
            }
          />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {projects.map((project: TProject) => {
            const meta = statusMeta(project.status);
            const unreadCount = unread[project._id] ?? 0;

            return (
              <Col xs={24} sm={12} xl={8} key={project._id}>
                <Badge.Ribbon
                  text={`${unreadCount} new`}
                  color={BRAND.colorPrimary}
                  style={{ display: unreadCount ? undefined : "none" }}
                >
                  <Card
                    hoverable
                    loading={isFetching}
                    onClick={() => navigate(`/projects/${project._id}`)}
                    style={{ height: "100%" }}
                  >
                    <Space
                      style={{ width: "100%", justifyContent: "space-between" }}
                      align="start"
                    >
                      <div>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {project.code}
                        </Typography.Text>
                        <Typography.Title level={5} style={{ margin: "2px 0 0" }}>
                          {project.name}
                        </Typography.Title>
                      </div>
                      <Tag color={meta?.color}>{meta?.label}</Tag>
                    </Space>

                    {project.client?.name && (
                      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                        {project.client.company || project.client.name}
                      </Typography.Text>
                    )}

                    <div style={{ margin: "16px 0 8px" }}>
                      <Space
                        style={{ width: "100%", justifyContent: "space-between" }}
                      >
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {project.tasks?.filter((t) => t.status === "done").length ?? 0}
                          {" / "}
                          {project.tasks?.length ?? 0} tasks
                        </Typography.Text>
                        <Typography.Text style={{ fontSize: 12 }}>
                          {project.progress}%
                        </Typography.Text>
                      </Space>
                      <Progress
                        percent={project.progress}
                        showInfo={false}
                        size="small"
                        strokeColor={BRAND.colorPrimary}
                      />
                    </div>

                    <Space
                      style={{ width: "100%", justifyContent: "space-between" }}
                    >
                      <Avatar.Group max={{ count: 4 }} size="small">
                        {project.members?.map((m) => (
                          <Avatar
                            key={m._id}
                            src={m.avatar}
                            style={{ background: BRAND.colorNavy }}
                          >
                            {m.name?.[0]?.toUpperCase()}
                          </Avatar>
                        ))}
                      </Avatar.Group>
                      {project.deadline && (
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          due {project.deadline}
                        </Typography.Text>
                      )}
                    </Space>
                  </Card>
                </Badge.Ribbon>
              </Col>
            );
          })}
        </Row>
      )}

      <Drawer
        title="New project"
        open={open}
        onClose={() => setOpen(false)}
        width={480}
        extra={
          <Button type="primary" loading={creating} onClick={() => form.submit()}>
            Create
          </Button>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onSubmit}
          initialValues={{ status: "proposal", priority: "medium" }}
        >
          <Form.Item
            name="name"
            label="Project name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="Northwind Rebuild" />
          </Form.Item>
          <Space style={{ display: "flex" }} align="start">
            <Form.Item name={["client", "name"]} label="Client" style={{ flex: 1 }}>
              <Input placeholder="Sarah Hollis" />
            </Form.Item>
            <Form.Item
              name={["client", "company"]}
              label="Company"
              style={{ flex: 1 }}
            >
              <Input placeholder="Northwind Logistics" />
            </Form.Item>
          </Space>
          <Form.Item name={["client", "email"]} label="Client email">
            <Input placeholder="sarah@northwind.com" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Space style={{ display: "flex" }} align="start">
            <Form.Item name="status" label="Status" style={{ flex: 1 }}>
              <Select options={PROJECT_STATUSES} />
            </Form.Item>
            <Form.Item name="priority" label="Priority" style={{ flex: 1 }}>
              <Select
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                ]}
              />
            </Form.Item>
          </Space>
          <Space style={{ display: "flex" }} align="start">
            <Form.Item name="startDate" label="Start date" style={{ flex: 1 }}>
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="deadline" label="Deadline" style={{ flex: 1 }}>
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
          </Space>
          <Form.Item name="budgetAmount" label="Budget (৳)">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="lead" label="Project lead">
            <Select options={userOptions} allowClear showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item
            name="members"
            label="Team members"
            extra="Only members and managers can see this project and its chat"
          >
            <Select
              mode="multiple"
              options={userOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default ProjectsPage;
