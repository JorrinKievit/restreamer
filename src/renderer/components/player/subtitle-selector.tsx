import React, { FC, useEffect, useState } from "react";
import { OPENSUBTITLES_LANGUAGES } from "main/api/opensubtitles/languages";
import { OpenSubtitlesUser } from "main/api/opensubtitles/user-information.types";
import { useLocalStorage } from "renderer/hooks/useLocalStorage";
import { client } from "renderer/api/trpc";
import { useMediaPlayer, useMediaStore } from "@vidstack/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Popover, PopoverContent } from "../ui/popover";
import { Skeleton } from "../ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { SpinnerButton } from "../ui/spinner-button";
import { PopoverAnchor } from "@radix-ui/react-popover";

interface SubtitleSelectorProps {
  tmdbId: string;
  season?: number;
  episode?: number;
}

const subtitleSchema = z.object({
  language: z.string().min(1),
  fileId: z.string().min(1),
});

export const SubtitleSelector: FC<SubtitleSelectorProps> = ({
  tmdbId,
  season,
  episode,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof subtitleSchema>>({
    resolver: zodResolver(subtitleSchema),
    defaultValues: {
      language: "",
      fileId: "",
    },
  });

  const language = form.watch("language");
  const fileId = form.watch("fileId");

  const [opensubtitlesData, setOpensubtitlesData] =
    useLocalStorage<OpenSubtitlesUser | null>("opensubtitles", null);

  const { data, isLoading: searchIsLoading } =
    client.opensubtitles.search.useQuery(
      {
        tmdbId,
        season,
        episode,
      },
      {
        enabled: !!isOpen,
      },
    );
  const { mutate, isLoading: downloadIsLoading } =
    client.opensubtitles.download.useMutation();

  const player = useMediaPlayer();
  const store = useMediaStore();

  useEffect(() => {
    document.addEventListener("open-subtitles-popover", () => {
      if (!isOpen) setIsOpen(true);
    });
    return () => {
      document.removeEventListener("open-subtitles-popover", () => {
        if (isOpen) setIsOpen(false);
      });
    };
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    if (isOpen) player?.controls.pause();
    if (!isOpen) player?.controls.resume();
  }, [isOpen, player?.controls]);

  useEffect(() => {
    form.setValue("fileId", "");
  }, [language]);

  const handleSubtitleChange = (values: z.infer<typeof subtitleSchema>) => {
    mutate(
      { fileId: Number(values.fileId), token: opensubtitlesData!.token },
      {
        onSuccess: (res) => {
          if (!player || !store) return;

          const existingTextTracks = player.textTracks;
          const languageTracksCount = Array.from(existingTextTracks).filter(
            (track) => track?.language === language,
          ).length;

          let label = `Uploaded | ${OPENSUBTITLES_LANGUAGES.find(
            (l) => l.language_code === language,
          )?.language_name}`;

          if (languageTracksCount > 0) label += ` ${languageTracksCount + 1}`;

          player.textTracks.add({
            src: res.link,
            kind: "subtitles",
            label,
            language,
            default: true,
          });
          player.textTracks[player.textTracks.length - 1]!.mode = "showing";

          setOpensubtitlesData({
            ...opensubtitlesData!,
            user: {
              // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
              ...opensubtitlesData?.user!,
              remaining_downloads: res.remaining,
            },
          });
          setIsOpen(false);
        },
      },
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <PopoverAnchor asChild>
        <div className="absolute left-40 top-12" />
      </PopoverAnchor>
      <PopoverContent className="w-[300px]">
        <div className="flex flex-col gap-2">
          <h1 className="font-medium">Subtitle selector</h1>
          <div className="flex flex-col gap-4">
            {searchIsLoading ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubtitleChange)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[
                              ...new Set(
                                data
                                  ?.filter(
                                    (subtitle) =>
                                      subtitle.attributes.language !== null,
                                  )
                                  .map(
                                    (subtitle: {
                                      attributes: { language: string };
                                    }) =>
                                      OPENSUBTITLES_LANGUAGES.find(
                                        (l) =>
                                          subtitle.attributes.language.toLowerCase() ===
                                          l.language_code,
                                      ),
                                  ),
                              ),
                            ]
                              .sort((a, b) =>
                                a!.language_name > b!.language_name ? 1 : -1,
                              )
                              .map((lang) => (
                                <SelectItem
                                  value={lang?.language_code!}
                                  key={lang?.language_code}
                                >
                                  {lang?.language_name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fileId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>File</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={language === ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a file" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {data
                              ?.filter(
                                (subtitle) =>
                                  subtitle.attributes.language?.toLowerCase() ===
                                  language,
                              )
                              ?.sort(
                                (a, b) =>
                                  b.attributes.download_count -
                                  a.attributes.download_count,
                              )
                              .map((subtitle) => (
                                <SelectItem
                                  key={subtitle.id}
                                  value={subtitle.attributes.files[0].file_id.toString()}
                                >
                                  {subtitle.attributes.files[0].file_name} |
                                  Downloads:{" "}
                                  {subtitle.attributes.download_count}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <div className="flex flex-row-reverse gap-4">
                    <SpinnerButton
                      type="submit"
                      isLoading={downloadIsLoading}
                      disabled={fileId === ""}
                    >
                      Submit
                    </SpinnerButton>
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
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
