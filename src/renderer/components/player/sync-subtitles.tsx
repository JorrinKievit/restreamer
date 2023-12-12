import { zodResolver } from "@hookform/resolvers/zod";
import { PopoverAnchor } from "@radix-ui/react-popover";
import { useMediaPlayer, useMediaStore } from "@vidstack/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Popover, PopoverContent } from "../ui/popover";

const syncSubtitlesSchema = z.object({
  value: z.number(),
});

export const SyncSubtitlesPopover = () => {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof syncSubtitlesSchema>>({
    resolver: zodResolver(syncSubtitlesSchema),
    defaultValues: {
      value: 0,
    },
  });

  const value = form.watch("value");

  const player = useMediaPlayer();
  const store = useMediaStore();

  useEffect(() => {
    document.addEventListener("open-sync-subtitles-popover", () => {
      if (!isOpen) setIsOpen(true);
    });
    return () => {
      document.removeEventListener("open-sync-subtitles-popover", () => {
        if (isOpen) setIsOpen(false);
      });
    };
  }, [isOpen, setIsOpen]);

  const handleSyncSubtitleChange = (
    values: z.infer<typeof syncSubtitlesSchema>,
  ) => {
    if (!player) {
      setIsOpen(false);
      return;
    }
    const track = store.textTrack;
    if (!track || !track.src) {
      setIsOpen(false);
      return;
    }

    track.cues.forEach((cue) => {
      cue.startTime += values.value / 1000;
      cue.endTime += values.value / 1000;
    });

    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen) player?.controls.pause();
    if (!isOpen) player?.controls.resume();
  }, [isOpen, player?.controls]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <PopoverAnchor asChild>
        <div className="absolute left-48 top-12" />
      </PopoverAnchor>
      <PopoverContent className="w-[360px]">
        <div className="flex flex-col gap-2">
          <h1 className="font-medium">Subtitle selector</h1>
          <div className="flex flex-col gap-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSyncSubtitleChange)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {value === 0
                          ? "No subtitle delay"
                          : value > 0
                            ? `Use this if the subtitles are shown ${value}ms too early`
                            : `Use this if the subtitles are shown ${value
                                .toString()
                                .replace("-", "")}ms too late`}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0"
                          type="number"
                          step={100}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-row-reverse gap-4">
                  <Button type="submit">Submit</Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      setIsOpen(false);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SyncSubtitlesPopover;
