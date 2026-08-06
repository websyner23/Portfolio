import { Alert, Modal, Radio, Select, Space, Tag, Typography } from "antd";
import { useState } from "react";
import { toast } from "sonner";
import {
  useGetLinkableUsersQuery,
  useLinkEmployeeUserMutation,
  type TEmployee,
} from "../../redux/api/hrmApi";

type Props = {
  employee: TEmployee;
  onClose: () => void;
};

/**
 * Links an employee to a login so they can use the punch panel — either an
 * account that already exists, or a fresh one provisioned on the spot.
 */
const LinkLoginModal = ({ employee, onClose }: Props) => {
  const { data, isFetching } = useGetLinkableUsersQuery();
  const [linkUser, { isLoading }] = useLinkEmployeeUserMutation();

  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [userId, setUserId] = useState<string>();

  const users = data?.data ?? [];
  const selected = users.find((u) => u._id === userId);

  const onSubmit = async () => {
    if (mode === "existing" && !userId) {
      toast.error("Pick an account to link");
      return;
    }

    try {
      const res = await linkUser({
        id: employee._id,
        ...(mode === "existing" ? { userId } : { createLogin: true }),
      }).unwrap();

      const temp = res.data?.temporaryPassword;
      toast.success(
        temp
          ? `${res.message} Temporary password: ${temp}`
          : res.message,
        { duration: temp ? 20000 : 6000 }
      );
      onClose();
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not link the login"
      );
    }
  };

  return (
    <Modal
      title={`Link a login — ${employee.fullName}`}
      open
      onCancel={onClose}
      onOk={onSubmit}
      confirmLoading={isLoading}
      okText="Link"
      width={520}
    >
      <Typography.Paragraph type="secondary">
        Linking connects this employee record to an admin-panel account, which
        is what lets them clock in and out on the punch panel.
      </Typography.Paragraph>

      <Radio.Group
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        style={{ marginBottom: 16 }}
      >
        <Radio.Button value="existing">Link an existing account</Radio.Button>
        <Radio.Button value="new">Create a new login</Radio.Button>
      </Radio.Group>

      {mode === "existing" ? (
        <Space direction="vertical" style={{ width: "100%" }}>
          <Select
            style={{ width: "100%" }}
            placeholder={
              users.length ? "Pick an account" : "No unlinked accounts available"
            }
            loading={isFetching}
            value={userId}
            onChange={setUserId}
            showSearch
            optionFilterProp="label"
            options={users.map((user) => ({
              value: user._id,
              label: `${user.name} — ${user.email}`,
            }))}
            optionRender={(option) => {
              const user = users.find((u) => u._id === option.value);
              return (
                <Space>
                  <span>{user?.name}</span>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {user?.email}
                  </Typography.Text>
                  {user?.roleName && <Tag>{user.roleName}</Tag>}
                  {!user?.canPunch && <Tag color="orange">can't punch</Tag>}
                </Space>
              );
            }}
          />

          {users.length === 0 && !isFetching && (
            <Alert
              type="info"
              showIcon
              message="Every account is already linked"
              description="Create a new login instead, or free one up by unlinking it from another employee."
            />
          )}

          {selected && !selected.canPunch && (
            <Alert
              type="warning"
              showIcon
              message={`The "${selected.roleName}" role can't clock in`}
              description='You can still link the account, but add the "attendance.punch" permission to that role under Roles & Permissions before they can use the punch panel.'
            />
          )}
        </Space>
      ) : (
        <Alert
          type="info"
          showIcon
          message={`A login will be created for ${employee.email}`}
          description="It gets the 'employee' role, which can punch in and out. A temporary password is shown once here and emailed to them."
        />
      )}
    </Modal>
  );
};

export default LinkLoginModal;
