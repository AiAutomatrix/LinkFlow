"use client";

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coffee, Bitcoin, CreditCard, Banknote } from "lucide-react";

export default function SupportMeCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Support Me 💙</CardTitle>
        <CardDescription>Help keep this app growing and improving.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* E-transfer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-muted/50 rounded-lg">
          <span className="flex items-center gap-2 font-medium"><Banknote size={18}/> E-Transfer</span>
          <p className="text-sm font-mono text-muted-foreground mt-1 sm:mt-0">your.email@example.com</p>
        </div>

        {/* Crypto */}
        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
          <span className="flex items-center gap-2 font-medium"><Bitcoin size={18}/> Crypto Wallets</span>
          <div className="pl-6 space-y-1 text-muted-foreground">
             <p className="text-xs font-mono">BTC: your_btc_address_here</p>
             <p className="text-xs font-mono">ETH: your_eth_address_here</p>
             <p className="text-xs font-mono">SOL: your_sol_address_here</p>
          </div>
        </div>

        {/* Stripe Donate Button */}
        <Button className="w-full bg-indigo-600 text-white hover:bg-indigo-600/90 flex gap-2" disabled>
          <CreditCard size={18}/> Donate with Card (Coming Soon)
        </Button>

        {/* Buy Me a Coffee */}
        <a 
          href="https://www.buymeacoffee.com/username" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button variant="outline" className="w-full bg-yellow-400 text-black hover:bg-yellow-400/90 hover:text-black flex gap-2">
            <Coffee size={18}/> Buy Me a Coffee
          </Button>
        </a>

      </CardContent>
    </Card>
  );
}