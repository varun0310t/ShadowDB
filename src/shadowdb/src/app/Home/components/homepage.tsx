import { Activity, Clock } from "lucide-react";

function HomeContent() {
  return (
    <div className="flex flex-col h-full w-full space-y-6 animate-fadeIn overflow-y-auto pb-6">
      <h2 className="text-3xl font-bold">Welcome to ShadowDB</h2>
      <p className="text-gray-300">
        Manage your databases with ease using our powerful and intuitive
        interface. Create new databases, run queries, and monitor performance
        all in one place.
      </p>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-purple-500" />
            Quick Stats
          </h3>
          <ul className="space-y-2">
            <li className="flex items-center justify-between">
              <span>Total Databases</span>
              <span className="text-purple-400 font-semibold">5</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Active Connections</span>
              <span className="text-purple-400 font-semibold">23</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Queries Today</span>
              <span className="text-purple-400 font-semibold">1,234</span>
            </li>
          </ul>
        </div>
        <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-pink-500" />
            Recent Activity
          </h3>
          <ul className="space-y-2">
            <li className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
              Database "Users" created
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
              Query executed on "Products"
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
              Backup completed for "Orders"
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default HomeContent;
