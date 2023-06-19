import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export const useQuery = () => {
  const { search } = useLocation();

  const query = useMemo(() => new URLSearchParams(search), [search]);

  const get = <T>(param: string): T => {
    const value = query.get(param);
    if (value === null) {
      throw new Error(`Parameter "${param}" is missing.`);
    }
    return value as unknown as T;
  };

  return { get };
};
