
import axios from "axios";
const leaderPoolIndex = { value: 0 };

async function checkAndUpdateLeader() {
  try {
    const response = await axios.get("http://localhost:8008/cluster");
    const clusterInfo = response.data;
  let n = clusterInfo.members.length;
    for (let i = 0; i < n; i++) {
      if (clusterInfo.members[i].role === "leader") {
        console.log("Leader found at index", i);
        leaderPoolIndex.value = i;
        break;
      }
    }
  } catch (error) {
    console.error("Error checking leader:", error);
  }
}
checkAndUpdateLeader();
setInterval(checkAndUpdateLeader, 10000);


export {  leaderPoolIndex,checkAndUpdateLeader };

