import { UpdateInfo } from "electron-updater";
import { FC, useState } from "react";
import { client } from "renderer/api/trpc";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

const UpdateModal: FC = () => {
  const { mutate } = client.updater.quitAndInstall.useMutation();
  const [isOpen, setIsOpen] = useState(false);
  const [releaseNotes, setReleaseNotes] =
    useState<UpdateInfo["releaseNotes"]>(null);

  const handleUpdate = () => {
    mutate();
  };

  const parseHTML = (htmlString: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    const ulElement = doc.querySelector("h3 + ul");
    const liElements = ulElement ? Array.from(ulElement.children) : [];

    return liElements.map((liElement, index) => (
      <li key={index}>{liElement.textContent}</li>
    ));
  };

  window.electron.ipcRenderer.on("app-update-available", (info) => {
    setReleaseNotes((info as UpdateInfo).releaseNotes);
    setIsOpen(true);
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update available</DialogTitle>
        </DialogHeader>
        <p className="mb-2">
          There is a new update available. Do you want to restart and update?
        </p>
        {releaseNotes && typeof releaseNotes !== "string" && (
          <ul className="ml-8 list-disc space-y-4">
            {releaseNotes.map((release) => (
              <li key={release.version}>
                <b className="text-lg">v{release.version}</b>
                {release.note && (
                  <ul className="ml-16 list-disc space-y-2">
                    {parseHTML(release.note)}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button className="mr-3" onClick={handleUpdate}>
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { UpdateModal };
