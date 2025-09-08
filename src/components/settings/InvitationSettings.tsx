import React, { useState } from "react";
import { UserPlus, Clock } from "lucide-react";
import { InvitationList } from "../invitations/InvitationList";

export const InvitationSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"pending" | "sent">("pending");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Chat Invitations
        </h2>
        <p className="text-gray-600">
          Manage your chat invitations and see who wants to connect with you.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("pending")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "pending"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Pending Invitations</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "sent"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center space-x-2">
              <UserPlus className="w-4 h-4" />
              <span>Sent Invitations</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        <InvitationList
          type={activeTab}
          onInvitationAccepted={(invitation) => {
            // Handle invitation acceptance
            console.log("Invitation accepted:", invitation);
          }}
        />
      </div>
    </div>
  );
};
