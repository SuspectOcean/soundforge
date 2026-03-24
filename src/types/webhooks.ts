export type WebhookEvent = {
  event: string;
  data: {
    replicate_id: string;
    output?: string | string[];
    error?: string;
  };
};
