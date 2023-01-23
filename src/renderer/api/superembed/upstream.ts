export const retrieveUpStreamURL = async (url: string) => {
  const streamEmbedResult = await fetch(url, {
    referrer: 'https://streamembed.net/',
  });
  const streamEmbedText = await streamEmbedResult.text();
  // eslint-disable-next-line no-useless-escape
  const streamEmbedRegex = /window.atob\(\'([^\']*)/g;
  const streamEmbedRegexResult = streamEmbedRegex.exec(streamEmbedText);
  const upstreamUrl = atob(streamEmbedRegexResult![1]);

  const upstreamResult = await fetch(upstreamUrl);
  const upstreamText = await upstreamResult.text();
  // eslint-disable-next-line no-useless-escape
  const upstreamRegex = /\'\|\|function(.*)(\.split\(\'\|\'\))/g;
  const upstreamRegexResult = upstreamRegex.exec(upstreamText);
  // eslint-disable-next-line no-eval
  const upstreamArgs = eval(upstreamRegexResult![0]);

  const linkIndex = upstreamArgs.indexOf('this');
  const hslIndex = upstreamArgs.indexOf('hls2');
  const m3u8Index = upstreamArgs.indexOf('m3u8');
  const dataIndex = upstreamArgs.indexOf('data');
  const spIndex = upstreamArgs.indexOf('sp');
  let tValue = '';
  let i = m3u8Index - 1;

  while (upstreamArgs[i] !== '10800') {
    if (tValue) tValue += '-';
    tValue += upstreamArgs[i];
    // eslint-disable-next-line no-plusplus
    i--;
  }

  const fullURL = `https://${upstreamArgs[linkIndex - 1]}.${
    upstreamArgs[linkIndex - 2]
  }.${upstreamArgs[linkIndex - 3]}/hls2/${upstreamArgs[linkIndex - 4]}/${
    upstreamArgs[linkIndex - 5]
  }/${upstreamArgs[hslIndex - 1]}/master.m3u8?t=${tValue}&s=${
    upstreamArgs[dataIndex + 1]
  }&e=${upstreamArgs[spIndex + 1]}&f=${upstreamArgs[dataIndex + 2]}&i=0.0&sp=0`;

  const finalResult = await fetch(fullURL);
  if (finalResult.status !== 200) retrieveUpStreamURL(url);
  return fullURL;
};
