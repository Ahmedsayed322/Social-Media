import admin, { app } from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export class NotificationService {
  client: app.App;
  constructor() {
    const serviceAccount = JSON.parse(
      readFileSync(
        resolve(
          './src/config/social-media-app-f6312-firebase-adminsdk-fbsvc-f362495135.json',
        ),
      ) as unknown as string,
    );
    this.client = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  async sendNotification({
    token,
    data,
  }: {
    token: string;
    data: { title: string; body: string };
  }) {
    const message = {
      token,
      data,
    };
    return await this.client.messaging().send(message);
  }
  async sendNotifications({
    tokens,
    data,
  }: {
    tokens: string[];
    data: { title: string; body: string };
  }) {
    await Promise.all(
      tokens.map((t) => {
        this.sendNotification({ token: t, data });
      }),
    );
  }
}
export default new NotificationService();
