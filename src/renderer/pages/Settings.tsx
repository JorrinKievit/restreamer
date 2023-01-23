import React, { FC, useState } from 'react';
import {
  useOpenSubtitlesLogin,
  useOpenSubtitlesLogout,
} from 'renderer/api/opensubtitles/api';
import { OpenSubtitlesUser } from 'renderer/api/opensubtitles/user-information.types';
import { useLocalStorage } from 'renderer/hooks/useLocalStorage';

const initialOpenSubtitlesData: OpenSubtitlesUser = {
  token: '',
  user: {
    allowed_downloads: 0,
    level: '',
    user_id: 0,
    ext_installed: false,
    vip: false,
    remaining_downloads: 0,
  },
};

const Settings: FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [opensubtitlesData, setOpensubtitlesData] =
    useLocalStorage<OpenSubtitlesUser>(
      'opensubtitles',
      initialOpenSubtitlesData
    );

  const {
    mutate: mutateLogin,
    error: errorLogin,
    isLoading: isLoadingLogin,
  } = useOpenSubtitlesLogin();
  const {
    mutate: mutateLogout,
    isLoading: isLoadingLogout,
    error: errorLogout,
  } = useOpenSubtitlesLogout();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutateLogin(
      {
        username,
        password,
      },
      {
        onSuccess: (res) => {
          setOpensubtitlesData(res);
        },
      }
    );
  };

  const handleLogout = async () => {
    mutateLogout(null, {
      onSuccess: () => {
        setOpensubtitlesData(initialOpenSubtitlesData);
      },
    });
  };

  return (
    <div className="card bg-neutral shadow-xl w-1/2">
      <div className="card-body">
        {!opensubtitlesData?.token ? (
          <>
            <h2 className="card-title justify-center">
              OpenSubtitles.com Login
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-control w-full max-w-xs mx-auto">
                <label className="label">
                  <span className="label-text">Username</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full max-w-xs"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered w-full max-w-xs"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="card-actions justify-end">
                  <button
                    type="submit"
                    className={`btn btn-primary mt-4 ${
                      isLoadingLogin ? 'loading' : ''
                    }`}
                  >
                    Login
                  </button>
                </div>
                {errorLogin && (
                  <p className="text-error">
                    {errorLogin.response.data.message}
                  </p>
                )}
              </div>
            </form>
          </>
        ) : (
          <>
            <h2>Hello, {opensubtitlesData.user.user_id}</h2>
            <h2>
              Allowed downloads: {opensubtitlesData.user.allowed_downloads}
            </h2>
            <h2>
              Remaining downloads: {opensubtitlesData.user.remaining_downloads}
            </h2>
            <h2>Level: {opensubtitlesData.user.level}</h2>
            <div className="card-actions justify-end">
              <button
                type="button"
                className={`btn btn-primary mt-4 ${
                  isLoadingLogout ? 'loading' : ''
                }`}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
            {errorLogout && <p className="text-error">{errorLogout.message}</p>}
          </>
        )}
      </div>
    </div>
  );
};

export default Settings;
