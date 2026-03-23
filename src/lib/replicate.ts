import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function startMusicGeneration(params: {
  prompt: string;
  duration: number;
  webhookUrl?: string;
}) {
  const input: Record<string, unknown> = {
    model_version: "melody",
    prompt: params.prompt,
    duration: params.duration,
    output_format: "mp3",
    normalization_strategy: "loudness",
  };

  const options: Record<string, unknown> = {
    model: "meta/musicgen",
    input,
  };

  if (params.webhookUrl) {
    options.webhook = params.webhookUrl;
    options.webhook_events_filter = ["completed"];
  }

  const prediction = await replicate.predictions.create(
    options as Parameters<typeof replicate.predictions.create>[0]
  );
  return prediction;
}

export async function checkPrediction(replicateId: string) {
  return replicate.predictions.get(replicateId);
}

export { replicate };