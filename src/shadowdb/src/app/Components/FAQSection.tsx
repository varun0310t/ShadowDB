"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQItemProps {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQAccordionItem = ({ item, isOpen, onToggle }: FAQItemProps) => {
  return (
    <div className="border border-gray-700 rounded-lg bg-gray-800/50 backdrop-blur-sm">
      <button
        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-700/30 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
        onClick={onToggle}
        type="button"
      >
        <h3 className="text-lg font-semibold text-white pr-4">{item.question}</h3>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-purple-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-purple-400 flex-shrink-0" />
        )}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-4 pt-3">
          <p className="text-gray-300 leading-relaxed">{item.answer}</p>
        </div>
      </div>
    </div>
  );
};

export const FAQSection = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const faqData: FAQItem[] = [
    {
      question: "What makes ShadowDB different from other database services?",
      answer: "ShadowDb is designed to be a fully managed, production-ready database service that combines the power of PostgreSQL with Haproxy load balancing, built-in PgPool caching and Connection Pooling. We focus on performance, scalability, and ease of use, allowing developers to focus on building applications without worrying about database management."
    },
    {
      question: "How does  built-in caching work?",
      answer: "Our built-in caching layer uses PgPool to cache frequently accessed data, significantly reducing database load and improving response times. This means your application can handle more requests with lower latency, especially for read-heavy workloads."
    },
    {
      question: "Can I scale my database as my application grows?",
      answer: "You can easily add more replicas to your database cluster to handle increased read traffic. Our architecture supports horizontal scaling, allowing you to grow your database seamlessly without downtime. You can also upgrade your plan for more storage and performance."
    },
    {
      question: "What kind of backups  do you provide?",
      answer: "We provide manual backup as of now but we are working on automated backups . You can create backups of your database at any time, and we store them securely for you. This ensures that your data is safe and can be restored in case of any issues."
    },
    {
      question: "Is there a free tier available?",
      answer: "Yes! Our Starter plan is completely free and includes up to 1GB storage, basic monitoring, and community support. It's perfect for getting started or small projects."
    },
    {
      question: "How secure is my data with ShadowDB?",
      answer: "We take security seriously. Each database is isolated inside a individual Docker container, including haproxy and pgpool , ensuring that your data is protected. with the role-based access control, "
    },
    {
      question: "Can I migrate my existing database to ShadowDB?",
      answer: "as of now this feature is not available but we are working on it. You can export your data from your existing PostgreSQL database and import it into ShadowDB using standard PostgreSQL tools. "
    },
    {
      question: "What programming languages and frameworks are supported?",
      answer: "ShadowDB works with any application that can connect to PostgreSQL databases. As we are built on PostgreSQL, you can use it with popular languages and frameworks like Node.js, Python, Ruby on Rails, Java, and more. "
    }
  ];

  const toggleItem = (index: number) => {
    console.log(`Toggling item ${index}`, openItems); // Debug log
    setOpenItems(prev => {
      const newItems = prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index];
      console.log('New open items:', newItems); // Debug log
      return newItems;
    });
  };

  return (
    <section id="faq" className="py-20 px-4 bg-gray-800/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Find answers to common questions about ShadowDB's features, pricing, and capabilities.
          </p>
        </div>
        
        <div className="space-y-4">
          {faqData.map((item, index) => (
            <FAQAccordionItem
              key={index}
              item={item}
              isOpen={openItems.includes(index)}
              onToggle={() => toggleItem(index)}
            />
          ))}
        </div>
        
        {/* <div className="text-center mt-12">
          <p className="text-gray-400 mb-4">
            Still have questions? We're here to help!
          </p>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors">
            Contact Support
          </button>
        </div> */}
      </div>
    </section>
  );
};
