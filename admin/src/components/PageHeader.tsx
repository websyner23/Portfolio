import { Space, Typography } from "antd";
import { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
};

const PageHeader = ({ title, subtitle, extra }: Props) => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: 12,
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 20,
    }}
  >
    <div>
      <Typography.Title level={3} style={{ margin: 0 }}>
        {title}
      </Typography.Title>
      {subtitle && (
        <Typography.Text type="secondary">{subtitle}</Typography.Text>
      )}
    </div>
    {extra && <Space wrap>{extra}</Space>}
  </div>
);

export default PageHeader;
