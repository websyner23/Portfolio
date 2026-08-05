export type TApiMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
};

export type TApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  meta?: TApiMeta;
  data: T;
};

export type TQueryParams = Record<string, string | number | undefined>;

export type TRole = {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
};

export type TPermissionCatalog = {
  groups: Record<string, { key: string; label: string }[]>;
  all: string[];
};

export type TUser = {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: TRole;
  employee?: { _id: string; employeeId: string; fullName: string };
  status: "active" | "blocked";
  needsPasswordChange: boolean;
  lastLoginAt?: string;
  createdAt: string;
};

export type TAuditLog = {
  _id: string;
  user?: { _id: string; name: string; email: string };
  action: string;
  module: string;
  targetId?: string;
  description: string;
  method?: string;
  endpoint?: string;
  statusCode?: number;
  ip?: string;
  userAgent?: string;
  device?: { browser: string; os: string; deviceType: string };
  createdAt: string;
};
