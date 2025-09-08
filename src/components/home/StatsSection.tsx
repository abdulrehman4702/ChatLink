import React, { useState, useEffect } from "react";
import { Users, MessageCircle, Globe, Zap } from "lucide-react";

const stats = [
  {
    icon: Users,
    label: "Active Users",
    value: 12500,
    suffix: "+",
    color: "text-blue-600",
  },
  {
    icon: MessageCircle,
    label: "Messages Sent",
    value: 2500000,
    suffix: "+",
    color: "text-green-600",
  },
  {
    icon: Globe,
    label: "Countries",
    value: 45,
    suffix: "+",
    color: "text-purple-600",
  },
  {
    icon: Zap,
    label: "Uptime",
    value: 99.9,
    suffix: "%",
    color: "text-orange-600",
  },
];

export const StatsSection: React.FC = () => {
  const [animatedStats, setAnimatedStats] = useState(
    stats.map((stat) => ({ ...stat, animatedValue: 0 }))
  );

  useEffect(() => {
    const animateStats = () => {
      setAnimatedStats((prevStats) =>
        prevStats.map((stat) => {
          const targetValue = stat.value;
          const increment = targetValue / 100;
          const newValue = Math.min(
            stat.animatedValue + increment,
            targetValue
          );

          return {
            ...stat,
            animatedValue: newValue,
          };
        })
      );
    };

    const interval = setInterval(animateStats, 50);

    // Clean up after animation completes
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="py-20 bg-gradient-to-r from-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trusted by Users Worldwide
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Join thousands of satisfied users who rely on our platform for their
            daily communication needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {animatedStats.map((stat, index) => {
            const IconComponent = stat.icon;
            const displayValue =
              stat.suffix === "%"
                ? stat.animatedValue.toFixed(1)
                : Math.floor(stat.animatedValue).toLocaleString();

            return (
              <div
                key={index}
                className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconComponent className={`w-8 h-8 ${stat.color}`} />
                </div>
                <div className={`text-4xl font-bold ${stat.color} mb-2`}>
                  {displayValue}
                  {stat.suffix}
                </div>
                <div className="text-gray-300 font-medium">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Trust indicators */}
        <div className="mt-16 text-center">
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm">Privacy First</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
