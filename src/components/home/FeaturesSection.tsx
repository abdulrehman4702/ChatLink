import React from "react";
import {
  Smartphone,
  Globe,
  Bell,
  Search,
  FileText,
  Heart,
  Clock,
  Settings,
} from "lucide-react";

const features = [
  {
    icon: Smartphone,
    title: "Mobile Optimized",
    description: "Perfect experience on all devices, from desktop to mobile",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "Connect with people from anywhere in the world",
    color: "from-green-500 to-green-600",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Get notified only when it matters with intelligent alerts",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: Search,
    title: "Advanced Search",
    description: "Find any message or conversation instantly",
    color: "from-orange-500 to-orange-600",
  },
  {
    icon: FileText,
    title: "Rich Media",
    description: "Share files, images, and documents seamlessly",
    color: "from-pink-500 to-pink-600",
  },
  {
    icon: Heart,
    title: "Emoji Reactions",
    description: "Express yourself with fun emoji reactions",
    color: "from-red-500 to-red-600",
  },
  {
    icon: Clock,
    title: "Message History",
    description: "Never lose a conversation with persistent chat history",
    color: "from-indigo-500 to-indigo-600",
  },
  {
    icon: Settings,
    title: "Customizable",
    description: "Personalize your chat experience to your liking",
    color: "from-teal-500 to-teal-600",
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Powerful Features for Modern Communication
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need for seamless, secure, and enjoyable
            conversations
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="group p-6 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
              >
                <div
                  className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              All features included at no extra cost
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
