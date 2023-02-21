import axios from 'axios';
import toWebVTT from 'srt-webvtt';

export const convertSrtToWebVTT = async (captionUrl: string) => {
  const res = await axios.get(captionUrl, {
    responseType: 'blob',
  });
  const caption = await toWebVTT(res.data);
  return caption;
};
