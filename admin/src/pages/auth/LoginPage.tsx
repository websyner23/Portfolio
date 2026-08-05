import { Button, Card, Form, Input, Typography } from "antd";
import { FiLock, FiMail } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BRAND } from "../../config";
import { useLoginMutation } from "../../redux/api/authApi";
import { setCredentials } from "../../redux/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { Navigate } from "react-router-dom";

const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();
  const user = useAppSelector((s) => s.auth.user);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      const res = await login(values).unwrap();
      dispatch(
        setCredentials({ user: res.data.user, token: res.data.accessToken })
      );
      toast.success(`Welcome back, ${res.data.user.name}`);
      const from = (location.state as { from?: { pathname: string } })?.from
        ?.pathname;
      navigate(from ?? "/", { replace: true });
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "Login failed — check your credentials";
      toast.error(message);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${BRAND.colorNavy} 0%, #0d1520 100%)`,
        padding: 16,
      }}
    >
      <Card style={{ width: 400, maxWidth: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: BRAND.colorPrimary,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: BRAND.colorNavy,
              fontWeight: 800,
              fontSize: 22,
              marginBottom: 12,
            }}
          >
            W
          </div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {BRAND.name} Admin
          </Typography.Title>
          <Typography.Text type="secondary">
            Sign in to your dashboard
          </Typography.Text>
        </div>

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Enter a valid email" },
            ]}
          >
            <Input
              prefix={<FiMail style={{ color: "#999" }} />}
              placeholder="admin@websyner.co"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Password is required" }]}
          >
            <Input.Password
              prefix={<FiLock style={{ color: "#999" }} />}
              placeholder="••••••••"
              size="large"
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={isLoading}
          >
            Sign in
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
