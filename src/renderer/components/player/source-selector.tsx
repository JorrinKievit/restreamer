import { Check, Star } from "lucide-react";
import React, { FC } from "react";
import { Source } from "types/sources";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface SourceSelectorProps {
  sources: Source[];
  activeSource: Source;
  selectSource: (source: Source) => void;
}

const SourceButton: FC<
  Omit<SourceSelectorProps, "sources"> & { source: Source }
> = ({ source, activeSource, selectSource }) => {
  return (
    <Button
      variant="outline"
      className="flex h-12 flex-col items-center space-y-1 px-4 py-3"
      onClick={() => selectSource(source)}
      disabled={activeSource.server === source.server}
    >
      <span className="pt-4 text-lg">{source.server}</span>
      <div className="flex space-x-2">
        <Badge className="mx-auto self-start">{source.quality}</Badge>
        {(source.subtitles && source.subtitles.length > 0) ||
        source.labels?.hasSubtitles ? (
          <Badge className="self-start">Subtitles</Badge>
        ) : null}
      </div>
    </Button>
  );
};

const SourceSelector: FC<SourceSelectorProps> = ({
  sources,
  activeSource,
  selectSource,
}) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid w-full grid-cols-5 gap-4">
        {sources
          .filter((source) => !source.isVlc)
          .map((source) => (
            <SourceButton
              key={source.server}
              source={source}
              activeSource={activeSource}
              selectSource={selectSource}
            />
          ))}
      </div>
      {sources.filter((source) => source.isVlc).length > 0 ? (
        <h1 className="text-lg font-bold">Sources only playable through VLC</h1>
      ) : null}
      <div className="grid w-full grid-cols-5 gap-4">
        {sources
          .filter((source) => source.isVlc)
          .map((source) => (
            <SourceButton
              key={source.server}
              source={source}
              activeSource={activeSource}
              selectSource={selectSource}
            />
          ))}
      </div>
    </div>
  );
};

export { SourceSelector };
