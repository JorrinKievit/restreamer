export const retrieveStreamTapeURL = async (url: string) => {
  const streamEmbedResult = await fetch(url, {
    referrer: 'https://streamembed.net/',
  });
  const streamEmbedText = await streamEmbedResult.text();
  // eslint-disable-next-line no-useless-escape
  const streamEmbedRegex = /window.atob\(\'([^\']*)/g;
  const streamEmbedRegexResult = streamEmbedRegex.exec(streamEmbedText);
  const streamTapeURL = atob(streamEmbedRegexResult![1]);
  const streamTapeResult = await fetch(streamTapeURL);
  const streamTapeText = await streamTapeResult.text();
  const streamTapeRegex =
    /document.getElementById\(\\'robotlink\\'\).innerHTML = ([^;]*)/g;
  const streamTapeCdnUrlCode = streamTapeRegex.exec(streamTapeText);
  // eslint-disable-next-line no-eval
  const streamTapeCdnUrl = `https:${eval(streamTapeCdnUrlCode![1])}`;
  return streamTapeCdnUrl;
};
