import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";

const config = JSON.parse(readFileSync("voiceover-config.json", "utf-8"));

const API_KEY = process.env.ELEVENLABS_API_KEY;

if (!API_KEY) {
  console.error("❌ ELEVENLABS_API_KEY not set. Set it in .env or as an environment variable.");
  console.log("💡 Video will be rendered without voiceover.");
  process.exit(0);
}

async function generateVoiceover(sceneId: string, text: string, outputPath: string) {
  console.log(`🎙️  Generating voiceover for ${sceneId}...`);

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: config.modelId,
        voice_settings: config.voiceSettings,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error for ${sceneId}: ${response.status} ${error}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const dir = outputPath.substring(0, outputPath.lastIndexOf("/"));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(outputPath, buffer);
  console.log(`✅ ${sceneId} → ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

async function main() {
  console.log(`\n🎬 Voiceover generation started (${config.scenes.length} scenes)\n`);

  for (const scene of config.scenes) {
    await generateVoiceover(scene.id, scene.text, scene.output);
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\n✅ All voiceover files generated!\n");
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
