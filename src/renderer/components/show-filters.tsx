import { zodResolver } from "@hookform/resolvers/zod";
import { TMDB_MOVIE_GENRES, TMDB_TV_GENRES } from "main/api/tmdb/genres";
import { TMBD_SORT_BY } from "main/api/tmdb/sort-by";
import React, { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { MultiSelect } from "./ui/multi-select";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Select,
} from "./ui/select";

type ShowType = "movie" | "tv";

export type FilterOptions = {
  genres: number[];
  year?: number;
  type: ShowType;
  sortBy: string;
  page: number;
};

const showFiltersSchema = z.object({
  genres: z.array(
    z.object({
      label: z.string(),
      value: z.number(),
    }),
  ),
  year: z.string().optional().default("2000"),
  type: z.enum(["movie", "tv"]),
  sortBy: z.string().optional(),
  page: z.number(),
});

interface ShowFilterProps {
  defaultShowType: ShowType;
  callback: (options: FilterOptions) => void;
}

const ShowFilter: FC<ShowFilterProps> = ({ defaultShowType, callback }) => {
  const form = useForm<z.infer<typeof showFiltersSchema>>({
    resolver: zodResolver(showFiltersSchema),
    defaultValues: {
      genres: [],
      year: undefined,
      type: defaultShowType,
      sortBy: TMBD_SORT_BY.find((sort) => sort.value === "popularity.desc")
        ?.value,
      page: 1,
    },
  });

  const showType = form.watch("type");

  const DEFAULT_GENRES =
    defaultShowType === "movie" ? TMDB_MOVIE_GENRES : TMDB_TV_GENRES;

  const handleSubmit = (values: z.infer<typeof showFiltersSchema>) => {
    callback({
      genres: values.genres.map((genre) => genre.value),
      year: Number(values.year),
      type: values.type,
      sortBy: values.sortBy ? values.sortBy : "popularity.desc",
      page: 1,
    });
  };

  useEffect(() => {
    form.setValue("type", defaultShowType);
  }, [defaultShowType]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full">
        <div className="flex w-full items-center justify-center gap-4">
          <FormField
            control={form.control}
            name="genres"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Genres</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={DEFAULT_GENRES.map((genre) => ({
                      label: genre.name,
                      value: genre.id,
                    }))}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem className="w-[150px]">
                <FormLabel>Year</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="2000"
                    min={1900}
                    max={2100}
                    type="number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sortBy"
            render={({ field }) => (
              <FormItem className="w-[500px]">
                <FormLabel>Sort by</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sort by" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TMBD_SORT_BY.map((sort) => (
                      <SelectItem value={sort.value} key={sort.value}>
                        {sort.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="w-[200px]">
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} value={showType}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[
                      { label: "Movie", value: "movie" },
                      { label: "TV Show", value: "tv" },
                    ].map((type) => (
                      <SelectItem value={type.value} key={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="self-end">
            Filter
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ShowFilter;
