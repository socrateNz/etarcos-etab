"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { BookOpen, HelpCircle, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserGuideView } from "@/components/layout/user-guide-view";
import { SupportTickets } from "@/features/support/components/support-tickets";
import { canOpenTickets } from "@/features/support/rules";

export default function SupportPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isSupport = role === "super_admin";
  const canCreate = canOpenTickets(role);
  const showTickets = isSupport || canCreate;
  const [activeTab, setActiveTab] = useState("guide");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support & Manuel d'Utilisation"
        description="Guide d'utilisation par rôle et assistance technique."
        icon={HelpCircle}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="guide" className="gap-2">
            <BookOpen className="w-4 h-4" /> Manuel d&apos;utilisation
          </TabsTrigger>
          {showTickets && (
            <TabsTrigger value="tickets" className="gap-2">
              <MessageSquare className="w-4 h-4" /> Tickets de support
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="guide">
          <UserGuideView />
        </TabsContent>

        {showTickets && (
          <TabsContent value="tickets">
            <SupportTickets isSupport={isSupport} canCreate={canCreate} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
