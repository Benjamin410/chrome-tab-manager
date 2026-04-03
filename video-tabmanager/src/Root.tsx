import { Composition } from "remotion";
import { TabManagerVideo } from "./TabManagerVideo";
import { TabManagerVideoSchema } from "./schema";
import { calculateTabManagerVideoMetadata } from "./calculate-metadata";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TabManagerVideo"
      component={TabManagerVideo}
      schema={TabManagerVideoSchema}
      defaultProps={{
        voiceoverFiles: [
          "voiceover/01-cold-open.mp3",
          "voiceover/02-transition.mp3",
          "voiceover/03-morning-sort.mp3",
          "voiceover/04-morning-search.mp3",
          "voiceover/05-midday-windows.mp3",
          "voiceover/06-midday-groups.mp3",
          "voiceover/07-evening-localhost.mp3",
          "voiceover/08-evening-dev.mp3",
          "voiceover/09-outro-tagline.mp3",
          "voiceover/10-outro-cta.mp3",
        ],
      }}
      calculateMetadata={calculateTabManagerVideoMetadata}
      fps={30}
      width={1920}
      height={1080}
      durationInFrames={1410}
    />
  );
};
