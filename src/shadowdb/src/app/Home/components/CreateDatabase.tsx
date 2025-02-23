"use client";

import { Button } from "@/components/ui/button";

function CreateDatabaseContent() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-3xl font-bold">Create a New Database</h2>
      <form className="space-y-4 max-w-md">
        <div>
          <label
            htmlFor="dbName"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Database Name
          </label>
          <input
            type="text"
            id="dbName"
            name="dbName"
            className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
          />
        </div>
        <div>
          <label
            htmlFor="dbType"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Database Type
          </label>
          <select
            id="dbType"
            name="dbType"
            className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
          >
            <option>SQL</option>
            <option>NoSQL</option>
            <option>Graph</option>
          </select>
        </div>
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
        >
          Create Database
        </Button>
      </form>
    </div>
  );
}

export default CreateDatabaseContent;
