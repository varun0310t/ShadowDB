import axios from "axios";

export const GetDataBases = async () => {
  const response = await axios.get("/api/users/pool/GetDatabases");
  return response.data;
};

export const CreateDatabse = async (data: {
  tenancy_type: string;
  db_name: string;
  haproxy_enabled: boolean;
  pgpool_enabled: boolean;
}) => {
  const response = await axios.post("/api/users/pool/NewDataBase", data);
  return response.data;
};

export const UpdateDatabaseName = async (data: {
  tenancy_type: string;
  Original_DB_Name: string;
  New_DB_Name: string;
  database_id:number
}) => {
  const response = await axios.post("/api/users/pool/configuration", data);
  return response.data;
};

export const GenerateQueryToken = async (options?: {
  expiresInDays?: number;
}) => {
  const response = await axios.post("/api/query/Tokens", options || {});
  return response.data;
};

export const GetTokens = async (options?: {
  showRevoked?: boolean;
  limit?: number;
  offset?: number;
}) => {
  const response = await axios.get("/api/query/Tokens", { params: options });
  return response.data;
};

export const RevokeToken = async (tokenId: number) => {
  const response = await axios.put(`/api/query/Tokens/${tokenId}`);
  return response.data;
};

// Database Access Control functions
export const getDatabaseAccessUsers = async (database_id: number) => {
  const response = await axios.get(`/api/users/pool/Access?database_id=${encodeURIComponent(database_id)}`);
  return response.data;
};

export const grantDatabaseAccess = async (data: {
  dbName: string;
  email: string;
  accessLevel: "admin" | "user" | "read";
  database_id:number
}) => {
  const response = await axios.post("/api/users/pool/Access", data);
  return response.data;
};

export const updateDatabaseAccess = async (data: {
  dbName: string;
  email: string;
  accessLevel: "admin" | "user" | "read";
  database_id:number
}) => {
  const response = await axios.patch("/api/users/pool/Access", data);
  return response.data;
};

export const revokeDatabaseAccess = async (database_id: number, email: string) => {
  const response = await axios.delete(
    `/api/users/pool/Access?database_id=${encodeURIComponent(database_id)}&email=${encodeURIComponent(email)}`
  );
  return response.data;
};


