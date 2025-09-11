
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
import { Plus, Bot, BrainCircuit, Pencil, Download, Rocket } from "lucide-react";
import Link from "next/link";

const agents = [
  {
    name: "Profile Assistant",
    description: "This is a pre-built Q&A bot. Download the template, upload it to your Botpress cloud, and then paste your new bot's embed script on the 'Bot' page.",
    icon: Bot,
    tags: ["Default", "Q&A"],
    templateUrl: "/flowbot.bpz",
    configureUrl: "/dashboard/bot"
  },
  {
    name: "Lead Generation Agent",
    description: "Proactively engages visitors to capture leads, book meetings, or direct them to specific funnels. (Coming soon)",
    icon: BrainCircuit,
    tags: ["Pro", "Sales"],
    templateUrl: "#",
    configureUrl: "#",
    disabled: true,
  },
];

export default function AgentHubPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Agent Hub</h1>
          <p className="text-muted-foreground">
            Manage your AI agents or download pre-built templates.
          </p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" /> Create New Agent (Coming Soon)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card key={agent.name} className={`flex flex-col ${agent.disabled ? 'opacity-60' : ''}`}>
            <CardHeader className="flex-row gap-4 items-start">
                <agent.icon className="h-10 w-10 text-primary shrink-0" />
                <div>
                    <CardTitle>{agent.name}</CardTitle>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {agent.tags.map(tag => (
                            <span key={tag} className={`text-xs text-muted-foreground font-semibold bg-muted px-2 py-0.5 rounded-full ${tag === 'Pro' ? 'bg-amber-500/20 text-amber-600' : ''}`}>{tag}</span>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">
                {agent.description}
              </p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2">
              <Button asChild className="w-full" disabled={agent.disabled}>
                <a href={agent.templateUrl}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                </a>
              </Button>
              <Button asChild variant="secondary" className="w-full" disabled={agent.disabled}>
                <Link href={agent.configureUrl}>
                    <Rocket className="mr-2 h-4 w-4" />
                    Configure
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
         <Card className="flex flex-col items-center justify-center border-dashed bg-muted/20">
            <div className="text-center p-6">
                <Plus className="h-8 w-8 text-muted-foreground mb-2 mx-auto"/>
                <h3 className="font-semibold">Custom Agent</h3>
                <p className="text-sm text-muted-foreground">The ability to create your own agents from scratch is coming soon.</p>
            </div>
        </Card>
      </div>
    </div>
  );
}
