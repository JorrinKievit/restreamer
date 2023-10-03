import { ChildProcess, spawn } from 'child_process';
import fs from 'fs';

const firstPath = 'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe';
const secondPath = 'C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe';

let vlcInstance: ChildProcess | null = null;

export const launchVlc = (url: string) => {
  if (vlcInstance) {
    vlcInstance.kill();
  }

  if (fs.existsSync(firstPath)) {
    vlcInstance = spawn(`"${firstPath}"`, [url, '--audio-language=eng', '--sub-language=eng'], { shell: true });
    return;
  }
  if (fs.existsSync(secondPath)) {
    vlcInstance = spawn(`"${secondPath}"`, [url, '--audio-language=eng', '--sub-language=eng'], { shell: true });
    return;
  }
  throw new Error('VLC not found');
};

export const stopVlc = () => {
  if (vlcInstance) {
    vlcInstance.kill();
  }
};
