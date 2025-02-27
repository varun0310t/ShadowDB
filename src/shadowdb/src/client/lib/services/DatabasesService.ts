import axios from "axios";

export const GetDataBases = async () => {
    const response = await axios.get("/api/users/pool/GetDatabases");
    return response.data;
  };
  