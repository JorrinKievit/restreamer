import { FC } from "react";
import { ColorThemePicker } from "renderer/components/layout/color-theme";
import { OpenSubtitlesSettings } from "renderer/components/settings/opensubtitles";
import { SourcesCheck } from "renderer/components/settings/sources-check";

const SettingsPage: FC = () => {
  return (
    <div className="grid h-[700px] grid-cols-2 grid-rows-2 gap-6">
      <OpenSubtitlesSettings />
      <SourcesCheck />
      <ColorThemePicker />
    </div>
  );
};

export { SettingsPage };
