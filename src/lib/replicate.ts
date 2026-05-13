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

  const prediction = await replicate.predictions.create({
    version: "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
    input,
    ...(params.webhookUrl && {
      webhook: params.webhookUrl,
      webhook_events_filter: ["completed"],
    }),
  } as Parameters<typeof replicate.predictions.create>[0]);

  return prediction;
}

export async function checkPrediction(replicateId: string) {
  return replicate.predictions.get(replicateId);
}

export { replicate };
