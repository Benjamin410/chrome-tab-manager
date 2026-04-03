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
        voiceoverFiles: [],
      }}
      calculateMetadata={calculateTabManagerVideoMetadata}
      fps={30}
      width={1920}
      height={1080}
      durationInFrames={1410}
    />
  );
};
