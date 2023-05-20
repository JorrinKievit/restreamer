import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export const useSyncSubtitle = () => {
  const { mutate, data, error, isLoading } = useMutation({
    mutationKey: ['time-shift-subtitle'],
    mutationFn: async ({
      downloadUrl,
      timeShift,
    }: {
      downloadUrl: string;
      timeShift: number;
    }) => {
      const res = await axios.get(downloadUrl, {
        responseType: 'text',
      });
      const text = res.data;
      let newData = text;
      text.match(/(\d{2}:\d{2}:\d{2}\.\d{3})/g).forEach((match: string) => {
        let ms = Date.parse(`1970-01-01T${match}Z`);
        ms += Number(timeShift);
        const newTime = new Date(Number(ms)).toISOString().slice(11, -1);
        newData = newData.replace(match, newTime);
      });
      const newBlob = new Blob([newData], { type: 'text/vtt' });
      const url = URL.createObjectURL(newBlob);
      return url;
    },
  });

  return { mutate, data, error, isLoading };
};
