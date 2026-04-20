import readline from 'readline';

import { ASSISTANT_NAME } from '../config.js';
import { logger } from '../logger.js';
import { registerChannel } from './registry.js';
import { Channel, NewMessage } from '../types.js';

const LOCAL_JID = 'local:main';

class LocalChannel implements Channel {
  name = 'local';
  private connected = false;
  private rl: readline.Interface | null = null;

  constructor(
    private readonly onMessage: (chatJid: string, message: NewMessage) => void,
    private readonly onChatMetadata: (
      chatJid: string,
      timestamp: string,
      name?: string,
      channel?: string,
      isGroup?: boolean,
    ) => void,
  ) {}

  async connect(): Promise<void> {
    if (this.connected) return;
    this.connected = true;
    const timestamp = new Date().toISOString();
    this.onChatMetadata(LOCAL_JID, timestamp, 'Local Main', 'local', false);

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: process.stdin.isTTY === true,
    });

    this.rl.on('line', (line) => {
      const text = line.trim();
      if (!text) return;
      const now = new Date().toISOString();
      this.onChatMetadata(LOCAL_JID, now, 'Local Main', 'local', false);
      this.onMessage(LOCAL_JID, {
        id: `local-${Date.now()}`,
        chat_jid: LOCAL_JID,
        sender: 'local-user',
        sender_name: 'Local User',
        content: text,
        timestamp: now,
      });
    });

    this.rl.on('close', () => {
      this.connected = false;
    });

    logger.info(
      { jid: LOCAL_JID, trigger: `@${ASSISTANT_NAME}` },
      'Local channel connected',
    );
  }

  async sendMessage(jid: string, text: string): Promise<void> {
    if (!this.ownsJid(jid)) {
      throw new Error(`Local channel does not own JID: ${jid}`);
    }
    process.stdout.write(`\n${ASSISTANT_NAME}: ${text}\n`);
    if (this.rl && process.stdin.isTTY) {
      this.rl.prompt(true);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  ownsJid(jid: string): boolean {
    return jid === LOCAL_JID;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.rl?.close();
    this.rl = null;
  }
}

registerChannel('local', (opts) => {
  if (process.env.LOCAL_CHANNEL_ENABLED !== 'true') {
    return null;
  }
  return new LocalChannel(opts.onMessage, opts.onChatMetadata);
});
