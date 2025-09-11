
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Bot, BrainCircuit, Pencil } from "lucide-react";
import Link from "next/link";

const agents = [
  {
    name: "Profile Assistant",
    description: "Answers questions about your profile, links, and bio based on your public page content.",
    icon: Bot,
    tags: ["Default", "Q&A"],
    href: "/dashboard/bot"
  },
  {
    name: "Lead Generation Agent",
    description: "Proactively engages visitors to capture leads, book meetings, or direct them to specific funnels.",
    icon: BrainCircuit,
    tags: ["Pro", "Sales"],
    href: "#"
  },
];

export default function AgentHubPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Agent Hub</h1>
          <p className="text-muted-foreground">
            Manage your AI agents and create new ones.
          </p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" /> Create New Agent (Coming Soon)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card key={agent.name} className="flex flex-col">
            <CardHeader className="flex-row gap-4 items-center">
                <agent.icon className="h-10 w-10 text-primary" />
                <div>
                    <CardTitle>{agent.name}</CardTitle>
                    <div className="flex gap-2 mt-1">
                        {agent.tags.map(tag => (
                            <span key={tag} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">
                {agent.description}
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="secondary" className="w-full">
                <Link href={agent.href}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Configure
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
         <Card className="flex flex-col items-center justify-center border-dashed">
            <Plus className="h-8 w-8 text-muted-foreground mb-2"/>
            <h3 className="font-semibold">New Agent</h3>
            <p className="text-sm text-muted-foreground">Coming Soon</p>
        </Card>
      </div>
    </div>
  );
}
