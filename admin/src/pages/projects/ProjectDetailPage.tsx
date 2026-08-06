import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Input,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import { FiArrowLeft, FiPlus, FiTrash2 } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import { BRAND } from "../../config";
import { usePermission } from "../../hooks/usePermission";
import {
  PROJECT_STATUSES,
  TASK_STATUSES,
  useAddTaskMutation,
  useDeleteProjectMutation,
  useDeleteTaskMutation,
  useGetProjectQuery,
  useUpdateProjectMutation,
  useUpdateTaskMutation,
  type TTask,
} from "../../redux/api/projectApi";
import ProjectChat from "./ProjectChat";

const ProjectDetailPage = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { can } = usePermission();
  const { data, isFetching, error } = useGetProjectQuery(id);
  const [updateProject] = useUpdateProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();
  const [addTask, { isLoading: addingTask }] = useAddTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();

  const [newTask, setNewTask] = useState("");
  const project = data?.data;
  const canManage = can("projects.manage");

  if (error) {
    return (
      <Card>
        <Empty description="You don't have access to this project" />
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Button onClick={() => navigate("/projects")}>Back to projects</Button>
        </div>
      </Card>
    );
  }

  const changeStatus = async (status: string) => {
    try {
      await updateProject({ id, body: { status } }).unwrap();
      toast.success(`Status changed to ${status}`);
    } catch {
      toast.error("Could not change the status");
    }
  };

  const onAddTask = async () => {
    if (!newTask.trim()) return;
    try {
      await addTask({ id, body: { title: newTask.trim() } }).unwrap();
      setNewTask("");
    } catch {
      toast.error("Could not add the task");
    }
  };

  const memberOptions =
    project?.members?.map((m) => ({ value: m._id, label: m.name })) ?? [];

  return (
    <div>
      <PageHeader
        title={project?.name ?? "Project"}
        subtitle={
          project
            ? `${project.code}${project.client?.company ? ` · ${project.client.company}` : ""}`
            : undefined
        }
        extra={
          <>
            <Button icon={<FiArrowLeft />} onClick={() => navigate("/projects")}>
              All projects
            </Button>
            {canManage && project && (
              <>
                <Select
                  value={project.status}
                  style={{ width: 150 }}
                  options={PROJECT_STATUSES}
                  onChange={changeStatus}
                />
                <Popconfirm
                  title="Delete this project?"
                  description="Its chat history is deleted too. This can't be undone."
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                  onConfirm={async () => {
                    try {
                      await deleteProject(id).unwrap();
                      toast.success("Project deleted");
                      navigate("/projects");
                    } catch {
                      toast.error("Could not delete the project");
                    }
                  }}
                >
                  <Button danger icon={<FiTrash2 />} />
                </Popconfirm>
              </>
            )}
          </>
        }
      />

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small" loading={isFetching}>
            <Statistic title="Progress" value={project?.progress ?? 0} suffix="%" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" loading={isFetching}>
            <Statistic
              title="Tasks done"
              value={project?.tasks?.filter((t) => t.status === "done").length ?? 0}
              suffix={`/ ${project?.tasks?.length ?? 0}`}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" loading={isFetching}>
            <Statistic
              title="Budget"
              value={`৳${(project?.budgetAmount ?? 0).toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" loading={isFetching}>
            <Statistic title="Team" value={project?.members?.length ?? 0} />
          </Card>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="overview"
        items={[
          {
            key: "overview",
            label: "Overview",
            children: (
              <Card loading={isFetching}>
                <Descriptions column={{ xs: 1, md: 2 }} bordered size="small">
                  <Descriptions.Item label="Client">
                    {project?.client?.name || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Company">
                    {project?.client?.company || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    {project?.client?.email || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Priority">
                    <Tag>{project?.priority}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Start date">
                    {project?.startDate || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Deadline">
                    {project?.deadline || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Lead">
                    {project?.lead?.name || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Team">
                    <Avatar.Group max={{ count: 6 }} size="small">
                      {project?.members?.map((m) => (
                        <Avatar key={m._id} style={{ background: BRAND.colorNavy }}>
                          {m.name?.[0]?.toUpperCase()}
                        </Avatar>
                      ))}
                    </Avatar.Group>
                  </Descriptions.Item>
                </Descriptions>

                {project?.description && (
                  <>
                    <Typography.Title level={5} style={{ marginTop: 20 }}>
                      Description
                    </Typography.Title>
                    <Typography.Paragraph style={{ whiteSpace: "pre-wrap" }}>
                      {project.description}
                    </Typography.Paragraph>
                  </>
                )}

                <Progress
                  percent={project?.progress ?? 0}
                  strokeColor={BRAND.colorPrimary}
                  style={{ marginTop: 20 }}
                />
              </Card>
            ),
          },
          {
            key: "tasks",
            label: `Tasks (${project?.tasks?.length ?? 0})`,
            children: (
              <Card loading={isFetching}>
                {canManage && (
                  <Space.Compact style={{ width: "100%", marginBottom: 16 }}>
                    <Input
                      placeholder="Add a task…"
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      onPressEnter={onAddTask}
                    />
                    <Button
                      type="primary"
                      icon={<FiPlus />}
                      loading={addingTask}
                      onClick={onAddTask}
                    >
                      Add
                    </Button>
                  </Space.Compact>
                )}

                <Table
                  rowKey="_id"
                  dataSource={project?.tasks ?? []}
                  pagination={false}
                  scroll={{ x: 620 }}
                  locale={{ emptyText: "No tasks yet" }}
                  columns={[
                    { title: "Task", dataIndex: "title" },
                    {
                      title: "Status",
                      dataIndex: "status",
                      width: 170,
                      render: (status: string, row: TTask) =>
                        canManage ? (
                          <Select
                            size="small"
                            value={status}
                            style={{ width: 140 }}
                            options={TASK_STATUSES}
                            onChange={(v) =>
                              updateTask({ id, taskId: row._id, body: { status: v } })
                            }
                          />
                        ) : (
                          <Tag
                            color={
                              TASK_STATUSES.find((s) => s.value === status)?.color
                            }
                          >
                            {status}
                          </Tag>
                        ),
                    },
                    {
                      title: "Assignee",
                      dataIndex: ["assignee", "name"],
                      width: 170,
                      render: (name: string, row: TTask) =>
                        canManage ? (
                          <Select
                            size="small"
                            allowClear
                            placeholder="Unassigned"
                            value={row.assignee?._id}
                            style={{ width: 140 }}
                            options={memberOptions}
                            onChange={(v) =>
                              updateTask({
                                id,
                                taskId: row._id,
                                body: { assignee: v },
                              })
                            }
                          />
                        ) : (
                          name || "—"
                        ),
                    },
                    ...(canManage
                      ? [
                          {
                            title: "",
                            width: 60,
                            align: "right" as const,
                            render: (_: unknown, row: TTask) => (
                              <Button
                                size="small"
                                danger
                                icon={<FiTrash2 />}
                                onClick={() => deleteTask({ id, taskId: row._id })}
                              />
                            ),
                          },
                        ]
                      : []),
                  ]}
                />
              </Card>
            ),
          },
          {
            key: "chat",
            label: "Chat",
            children: (
              <Card>
                <ProjectChat projectId={id} />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};

export default ProjectDetailPage;
