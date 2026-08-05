import { Card, Col, Row, Typography } from "antd";
import { usePermission } from "../../hooks/usePermission";

const DashboardPage = () => {
  const { user } = usePermission();

  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Dashboard
      </Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card>
            <Typography.Text>
              Welcome{user ? `, ${user.name}` : ""} — the WebSyner admin is up
              and running. Modules will appear in the sidebar as they are
              enabled for your role.
            </Typography.Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
