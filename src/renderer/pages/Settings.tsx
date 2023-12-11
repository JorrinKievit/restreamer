import { FC } from "react";
import { OpenSubtitlesSettings } from "renderer/components/settings/opensubtitles";
import { SourcesCheck } from "renderer/components/settings/sources-check";

const SettingsPage: FC = () => {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="h-1/2">
        <OpenSubtitlesSettings />
      </div>
      <div className="h-1/2">
        <SourcesCheck />
      </div>
    </div>
  );
};

export { SettingsPage };
