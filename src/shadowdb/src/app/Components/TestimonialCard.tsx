import React from 'react';
import { Users } from 'lucide-react';

export function TestimonialCard({ quote, author, company }: { quote: string; author: string; company: string }) {
  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <p className="mb-4 italic">"{quote}"</p>
      <div className="flex items-center">
        <Users className="w-10 h-10 text-purple-500 mr-3" />
        <div>
          <p className="font-semibold">{author}</p>
          <p className="text-sm text-gray-400">{company}</p>
        </div>
      </div>
    </div>
  )
}