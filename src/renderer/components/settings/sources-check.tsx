import { Loader2 } from "lucide-react";
import React, { FC, useEffect, useState } from "react";
import { client } from "renderer/api/trpc";
import { cn } from "../../lib/utils";
import { Source } from "types/sources";
import useBoolean from "usehooks-ts/dist/esm/useBoolean/useBoolean";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

const AVAILABLE_SOURCES = [
  {
    name: "GoMovies",
  },
  {
    name: "SuperStream",
  },
  {
    name: "2Embed",
  },
  {
    name: "VidSrc",
    children: [
      {
        name: "VidSrc Pro",
      },
    ],
  },
  {
    name: "SmashyStream",
    children: [
      {
        name: "Smashy (V1)",
      },
      {
        name: "Smashy (D)",
      },
    ],
  },
  {
    name: "MoviesApi",
  },
  {
    name: "VidSrcTo",
    children: [
      {
        name: "Vidstream",
      },
      {
        name: "FileMoon",
      },
      {
        name: "VidPlay",
      },
    ],
  },
  {
    name: "VegaMovies",
  },
  {
    name: "UHDMovies",
  },
  {
    name: "ShowBox",
  },
  {
    name: "MyFileStorage",
  },
  {
    name: "MultiMovies",
  },
  {
    name: "RidooMovies",
    children: [
      {
        name: "Ridoo",
      },
      {
        name: "Closeload",
      },
    ],
  },
  {
    name: "RemoteStream",
  },
];

const SourceInfo: FC<{
  data: Source[] | undefined;
  name: string;
  isLoading: boolean;
  showBadge?: boolean;
  children?: React.ReactNode;
}> = ({ data, name, isLoading, showBadge = true, children }) => {
  return (
    <div className="flex items-center gap-2">
      <span key={name}>{name}</span>
      {data && showBadge && (
        <Badge
          variant={
            data?.find((s) => s.server === name) ? "default" : "destructive"
          }
        >
          {data.find((s) => s.server === name)
            ? "Operational"
            : "Non-operational"}
        </Badge>
      )}
      {isLoading && showBadge && <Loader2 className="h-4 w-4 animate-spin" />}
      {children && <ul>{children}</ul>}
    </div>
  );
};

const SourcesCheck: FC = () => {
  const { value, setFalse, toggle, setTrue } = useBoolean(false);

  const {
    data: sourcesData,
    isLoading,
    refetch,
  } = client.app.getSources.useQuery({
    imdbId: "tt4154756",
    tmdbId: "299536",
    showName: "Avengers: Infinity War",
    type: "movie",
  });
  const [sources, setSources] = useState<Source[]>(sourcesData ?? []);
  const [sourcesLoading, setSourcesLoading] = useState<Record<string, boolean>>(
    () => {
      const initialLoading: Record<string, boolean> = {};
      AVAILABLE_SOURCES.forEach((source) => {
        if (!source.children) {
          initialLoading[source.name] = true;
        }
      });
      return initialLoading;
    },
  );
  client.app.getSourcesSubscription.useSubscription(undefined, {
    onData: (data) => {
      const d = data as Source[];
      if (d.length === 0) return;
      setSources((prev) => [...prev, ...d]);
      setSourcesLoading((prev) => ({ ...prev, [d[0].server]: false }));
    },
  });

  const handleRefetch = () => {
    setSourcesLoading((prev) => {
      const newState: Record<string, boolean> = {};
      Object.keys(prev).forEach((key) => {
        newState[key] = true;
      });
      return newState;
    });
    refetch();
    setTrue();
    setTimeout(
      () => {
        setFalse();
      },
      2 * 60 * 1000,
    );
  };

  useEffect(() => {
    if (!isLoading) {
      setSourcesLoading((prev) => {
        const newState: Record<string, boolean> = {};
        Object.keys(prev).forEach((key) => {
          newState[key] = false;
        });
        return newState;
      });
    }
  }, [isLoading]);

  return (
    <ScrollArea className="h-full">
      <Card>
        <CardHeader>
          <h4 className="text-2xl font-semibold leading-none tracking-tight">
            Available Sources
          </h4>
        </CardHeader>
        <CardContent className=" pb-4 pt-0">
          <ul className="ml-8 list-disc gap-2">
            {AVAILABLE_SOURCES.map((source) => (
              <li key={source.name}>
                <SourceInfo
                  data={sources}
                  name={source.name}
                  isLoading={sourcesLoading[source.name]}
                  showBadge={!source.children}
                />
                {source.children && (
                  <ul className="ml-4 list-disc gap-2">
                    {source.children.map((child) => (
                      <li key={child.name}>
                        <SourceInfo
                          data={sources}
                          name={child.name}
                          isLoading={sourcesLoading[child.name]}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="justify-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    onClick={handleRefetch}
                    disabled={value}
                    className={cn(value && "pointer-events-none")}
                  >
                    Refetch
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>You can only refetch once every 2 minutes</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      </Card>
    </ScrollArea>
  );
};

export { SourcesCheck };
