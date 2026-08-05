import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

export const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <Result
      status="404"
      title="404"
      subTitle="This page does not exist."
      extra={
        <Button type="primary" onClick={() => navigate("/")}>
          Back to dashboard
        </Button>
      }
    />
  );
};

export const ForbiddenPage = () => {
  const navigate = useNavigate();
  return (
    <Result
      status="403"
      title="403"
      subTitle="You don't have permission to access this page."
      extra={
        <Button type="primary" onClick={() => navigate("/")}>
          Back to dashboard
        </Button>
      }
    />
  );
};
