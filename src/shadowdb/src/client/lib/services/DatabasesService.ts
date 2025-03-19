import axios from "axios";

export const GetDataBases = async () => {
  const response = await axios.get("/api/users/pool/GetDatabases");
  return response.data;
};
export const CreateDatabse = async (data:{ tenancy_type:string, db_name:string}) => {
  const response = await axios.post("/api/users/pool/NewDataBase", data);
  return response.data;
};
