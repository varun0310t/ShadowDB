import axios from "axios";

export const executeQuery = async (data: {db_name:string ,query: string }) => {
  const response = await axios.post("/api/query/executeQueryRouteWebRoute", data);
  return response.data;
};
