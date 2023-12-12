import { SearchIcon, SettingsIcon } from "lucide-react";
import React, { FC, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { client } from "renderer/api/trpc";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Spacer } from "../ui/spacer";
import { ThemeToggle } from "./theme-toggle";

const HEADER_LINKS = [
  {
    title: "Live",
    url: "/live/list",
  },
  {
    title: "Movies",
    url: "/shows/discover/movie",
  },
  {
    title: "TV Shows",
    url: "/shows/discover/tv",
  },
];

const Header: FC = () => {
  const [searchInput, setSearchInput] = useState("");

  const { data } = client.app.getAppVersion.useQuery();

  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigate(`/search/${searchInput}`);
  };

  return (
    <header className="flex border-b py-4">
      <div className="flex w-full items-center justify-between ">
        <div className="flex">
          <Button variant="ghost">
            <NavLink to="/">Restreamer v{data}</NavLink>
          </Button>
        </div>
        <div className="flex items-center gap-4">
          {HEADER_LINKS.map((link) => (
            <NavLink
              key={link.url}
              to={link.url}
              className={({ isActive }) =>
                [
                  isActive ? "border-b-2 border-primary" : "border-transparent",
                ].join(" ")
              }
            >
              <Button variant="ghost">{link.title}</Button>
            </NavLink>
          ))}

          <form onSubmit={handleSubmit}>
            <div className="flex max-w-sm items-center">
              <Input
                className="rounded-r-none"
                type="text"
                placeholder="Search..."
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <Button
                variant="outline"
                type="submit"
                className="rounded-l-none border-l-0"
              >
                <SearchIcon className="h-4 w-4" />
              </Button>
            </div>
          </form>
          <Button asChild>
            <NavLink to="/settings">
              <SettingsIcon className="h-4 w-4" />
            </NavLink>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export { Header };
