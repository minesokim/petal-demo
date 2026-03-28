"use client";

import React from "react";

import { cn } from "@/lib/utils";
import { format, startOfToday } from "date-fns";
import { motion } from "motion/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type DateRange = {
  from: Date;
  to: Date;
};

// Colors match document status donut exactly:
// Red hsl(0 84.2% 60.2%), Yellow hsl(47.9 95.8% 53.1%), Blue hsl(214.7 95% 50%), Green hsl(142.1 76.2% 36.3%)
// Actual counts from 20 mock clients: 1+2+4+2+4+2+2+3 = 20
const currentSeasonData = [
  { width: 5, cssColor: "hsl(0 84.2% 60.2%)", label: "Not Started", count: 1 },
  { width: 10, cssColor: "hsl(47.9 95.8% 53.1%)", label: "Intake Sent", count: 2 },
  { width: 20, cssColor: "hsl(47.9 95.8% 48%)", label: "Collecting Docs", count: 4 },
  { width: 10, cssColor: "hsl(214.7 95% 58%)", label: "Docs Complete", count: 2 },
  { width: 20, cssColor: "hsl(214.7 95% 50%)", label: "In Prep", count: 4 },
  { width: 10, cssColor: "hsl(214.7 95% 44%)", label: "In Review", count: 2 },
  { width: 10, cssColor: "hsl(142.1 76.2% 42%)", label: "Ready to Sign", count: 2 },
  { width: 15, cssColor: "hsl(142.1 76.2% 36.3%)", label: "Filed", count: 3 },
];

const lastSeasonData = [
  { width: 0, cssColor: "hsl(0 84.2% 60.2%)", label: "Not Started", count: 0 },
  { width: 0, cssColor: "hsl(47.9 95.8% 53.1%)", label: "Intake Sent", count: 0 },
  { width: 5.2, cssColor: "hsl(47.9 95.8% 48%)", label: "Collecting Docs", count: 9 },
  { width: 3.5, cssColor: "hsl(214.7 95% 58%)", label: "Docs Complete", count: 6 },
  { width: 8.1, cssColor: "hsl(214.7 95% 50%)", label: "In Prep", count: 14 },
  { width: 5.8, cssColor: "hsl(214.7 95% 44%)", label: "In Review", count: 10 },
  { width: 4.1, cssColor: "hsl(142.1 76.2% 42%)", label: "Ready to Sign", count: 7 },
  { width: 73.3, cssColor: "hsl(142.1 76.2% 36.3%)", label: "Filed", count: 126 },
];

export const CategoryBarChart = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const [selectedPeriod, setSelectedPeriod] = React.useState<string>("current");

  const today = startOfToday();
  const currentRange: DateRange = {
    from: new Date(2026, 0, 15),
    to: new Date(2026, 3, 15),
  };
  const lastRange: DateRange = {
    from: new Date(2025, 0, 15),
    to: new Date(2025, 3, 15),
  };

  const period = selectedPeriod === "current" ? currentRange : lastRange;
  const pipelineData = selectedPeriod === "current" ? currentSeasonData : lastSeasonData;
  const totalClients = selectedPeriod === "current" ? 20 : 18;
  const totalFiled = selectedPeriod === "current" ? 3 : 14;

  return (
    <Card
      className={cn(
        "flex h-full w-full flex-col gap-0 p-6 shadow-none",
        className,
      )}
      {...props}
    >
      <CardHeader className="flex flex-row items-center justify-between p-0">
        <div className="flex flex-row items-center gap-1">
          <CardTitle className="text-base font-medium text-muted-foreground">
            Filing Pipeline
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-5 text-muted-foreground/50"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10 16.25a6.25 6.25 0 100-12.5 6.25 6.25 0 000 12.5zm1.116-3.041l.1-.408a1.709 1.709 0 01-.25.083 1.176 1.176 0 01-.308.048c-.193 0-.329-.032-.407-.095-.079-.064-.118-.184-.118-.359a3.514 3.514 0 01.118-.672l.373-1.318c.037-.121.062-.255.075-.4a3.73 3.73 0 00.02-.304.866.866 0 00-.292-.678c-.195-.174-.473-.26-.833-.26-.2 0-.412.035-.636.106-.224.07-.459.156-.704.256l-.1.409c.073-.028.16-.057.262-.087.101-.03.2-.045.297-.045.198 0 .331.034.4.1.07.066.105.185.105.354 0 .093-.01.197-.034.31a6.216 6.216 0 01-.084.36l-.374 1.325c-.033.14-.058.264-.073.374-.015.11-.022.22-.022.325 0 .272.1.496.301.673.201.177.483.265.846.265.236 0 .443-.03.621-.092s.417-.152.717-.27zM11.05 7.85a.772.772 0 00.26-.587.78.78 0 00-.26-.59.885.885 0 00-.628-.244.893.893 0 00-.63.244.778.778 0 00-.264.59c0 .23.088.426.263.587a.897.897 0 00.63.243.888.888 0 00.629-.243z"
                    fill="currentColor"
                  />
                </svg>
              </TooltipTrigger>
              <TooltipContent className="max-w-70">
                <p className="text-xs">
                  Track the distribution of your clients across each stage of the
                  filing process. See where bottlenecks are and which clients need
                  attention before the April 15 deadline.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger size="sm" className="w-full md:w-auto h-8 gap-2">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="current">This Season</SelectItem>
              <SelectItem value="last">Last Season</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-0">
        <div className="flex items-center gap-3">
          <span className="font-display text-3xl leading-none tracking-tight tabular-nums">
            {totalFiled}/{totalClients}
          </span>
          {selectedPeriod === "current" ? (
            <p className="text-sm text-green-500 dark:text-green-600">
              {Math.round((totalFiled / totalClients) * 100)}% filed{" "}
              <span className="text-muted-foreground">18 days remaining</span>
            </p>
          ) : (
            <p className="text-sm text-green-500 dark:text-green-600">
              {Math.round((totalFiled / totalClients) * 100)}% filed{" "}
              <span className="text-muted-foreground">season complete</span>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-normal text-muted-foreground">
              {period?.from && format(period.from, "MMM dd, yyyy")}
            </p>
            <p className="text-sm font-normal text-muted-foreground">
              {period?.to && format(period.to, "MMM dd, yyyy")}
            </p>
          </div>

          <TooltipProvider delayDuration={0}>
            <div className="flex gap-1">
              {pipelineData.filter(d => d.width > 0).map((item, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <motion.div
                      className="cursor-pointer transition-opacity hover:opacity-80"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: `${item.width}%`, opacity: 1 }}
                      transition={{
                        width: { duration: 2.2, delay: 0.2 + index * 0.1, ease: [0.35, 0, 0.15, 1] },
                        opacity: { duration: 1, delay: 0.15 + index * 0.1 },
                      }}
                    >
                      <div className="h-11 rounded-md" style={{ backgroundColor: item.cssColor }} />
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {item.label} - {item.count} clients
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>

        <div className="flex gap-4 pt-1">
          <div className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: "hsl(0 84.2% 60.2%)" }} /><span className="text-[10px] text-muted-foreground">Need you</span></div>
          <div className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: "hsl(47.9 95.8% 53.1%)" }} /><span className="text-[10px] text-muted-foreground">Waiting</span></div>
          <div className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: "hsl(214.7 95% 50%)" }} /><span className="text-[10px] text-muted-foreground">In progress</span></div>
          <div className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: "hsl(142.1 76.2% 36.3%)" }} /><span className="text-[10px] text-muted-foreground">Complete</span></div>
        </div>
      </CardContent>
    </Card>
  );
};
