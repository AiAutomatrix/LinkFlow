
"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link as LinkIcon, Palette, BarChart3, Bot, ExternalLink, MessageCircleQuestion, GraduationCap, User } from "lucide-react";

const instructions = [
  {
    value: "item-1",
    title: "Step 1: Complete Your Profile",
    icon: User,
    content: "Start by visiting the 'Profile' page. Here you can set your public username, display name, and a short bio. Don't forget to upload a profile picture to make your page more personal!",
  },
  {
    value: "item-2",
    title: "Step 2: Add Your Links",
    icon: LinkIcon,
    content: "Navigate to the 'Links' page. Use the 'Add Link' button to create new links. You can also add your social media profiles, which will appear as icons. Drag and drop your custom links to reorder them.",
  },
    {
    value: "item-3",
    title: "Step 3: Customize Your Appearance",
    icon: Palette,
    content: "Go to the 'Appearance' page to bring your profile to life. Choose from dozens of pre-made themes or create your own custom gradient. You can also toggle the animated background for a more dynamic look.",
  },
  {
    value: "item-4",
    title: "Step 4: Set Up Your AI Bot",
    icon: Bot,
    content: "Head over to the 'Bot' page. Here you can paste in an embed script from a provider like Botpress. This will add a chatbot to your public page, allowing visitors to interact with an AI trained on your content.",
  },
  {
    value: "item-5",
    title: "Step 5: Share Your Page",
    icon: ExternalLink,
    content: "Once you're happy with your setup, click the 'Public Page' button in the sidebar to see your live profile. Copy the URL and share it in your social media bios, email signatures, and anywhere else you want to connect with your audience.",
  },
  {
    value: "item-6",
    title: "Step 6: Check Your Analytics",
    icon: BarChart3,
    content: "After sharing your page, visit the 'Analytics' page to see how your links are performing. Track total clicks, clicks per link, and see which content is most engaging for your audience.",
  },
];

export default function InstructionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Instructions</h1>
        <p className="text-muted-foreground">
          Follow these steps to get your LinkFlow profile up and running.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        {instructions.map((item) => (
          <AccordionItem value={item.value} key={item.value}>
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-primary"/>
                    {item.title}
                </div>
            </AccordionTrigger>
            <AccordionContent className="text-base text-muted-foreground pl-11">
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
