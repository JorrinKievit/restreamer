import React, { FC, useState } from "react";
import { OpenSubtitlesUser } from "main/api/opensubtitles/user-information.types";
import { useLocalStorage } from "usehooks-ts";
import { client } from "renderer/api/trpc";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { SpinnerButton } from "../ui/spinner-button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";

const initialOpenSubtitlesData: OpenSubtitlesUser = {
  token: "",
  user: {
    allowed_downloads: 0,
    allowed_translations: 0,
    level: "",
    user_id: 0,
    ext_installed: false,
    username: "",
    vip: false,
    remaining_downloads: 0,
    downloads_count: 0,
  },
};

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const OpenSubtitlesSettings: FC = () => {
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const [opensubtitlesData, setOpensubtitlesData] =
    useLocalStorage<OpenSubtitlesUser>(
      "opensubtitles",
      initialOpenSubtitlesData,
    );

  const {
    mutate: login,
    error: errorLogin,
    isLoading: isLoadingLogin,
  } = client.opensubtitles.login.useMutation();

  const {
    mutate: logout,
    isLoading: isLoadingLogout,
    error: errorLogout,
  } = client.opensubtitles.logout.useMutation();

  const handleLogout = async () => {
    logout(
      {
        token: opensubtitlesData.token,
      },
      {
        onSuccess: () => {
          setOpensubtitlesData(initialOpenSubtitlesData);
        },
      },
    );
  };

  const handleSubmit = ({
    username,
    password,
  }: z.infer<typeof loginSchema>) => {
    login(
      {
        username,
        password,
      },
      {
        onSuccess: (res) => {
          setOpensubtitlesData(res);
        },
      },
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <h4 className="text-2xl font-semibold leading-none tracking-tight">
          OpenSubtitles
        </h4>
      </CardHeader>
      {!opensubtitlesData?.token ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <CardContent>
              <div className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {errorLogin?.message && (
                <span color="tomato">{errorLogin.message}</span>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <SpinnerButton type="submit" isLoading={isLoadingLogin}>
                Login
              </SpinnerButton>
            </CardFooter>
          </form>
        </Form>
      ) : (
        <>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-20 gap-y-10">
              <Label>Username</Label>
              <Label>{opensubtitlesData.user.username}</Label>
              <Label>User ID</Label>
              <Label>{opensubtitlesData.user.user_id}</Label>
              <Label>Remaining downloads</Label>
              <Label>{opensubtitlesData.user.remaining_downloads}</Label>
              <Label>Level</Label>
              <Label>{opensubtitlesData.user.level}</Label>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <SpinnerButton isLoading={isLoadingLogout} onClick={handleLogout}>
              Logout
            </SpinnerButton>
          </CardFooter>
          {errorLogout && <span color="tomato">{errorLogout.message}</span>}
        </>
      )}
    </Card>
  );
};

export { OpenSubtitlesSettings };
