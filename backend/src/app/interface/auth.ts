export type TAuthedUser = {
  _id: string;
  name: string;
  email: string;
  role: {
    _id: string;
    name: string;
    permissions: string[];
  };
  employee?: string;
};

export type TJwtPayload = {
  userId: string;
  iat?: number;
  exp?: number;
};
