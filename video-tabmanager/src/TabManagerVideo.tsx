import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { ColdOpenScene } from "./scenes/ColdOpenScene";
import { MorningScene } from "./scenes/MorningScene";
import { MiddayScene } from "./scenes/MiddayScene";
import { EveningScene } from "./scenes/EveningScene";
import { OutroScene } from "./scenes/OutroScene";
import { DEFAULT_SCENE_FRAMES } from "./calculate-metadata";
import type { TabManagerVideoProps } from "./schema";

const TRANSITION_DURATION = 15;

export const TabManagerVideo: React.FC<TabManagerVideoProps> = (props) => {
  const sf = DEFAULT_SCENE_FRAMES;

  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={sf.coldOpen}>
          <ColdOpenScene voiceoverFiles={props.voiceoverFiles} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={sf.morning}>
          <MorningScene voiceoverFiles={props.voiceoverFiles} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={sf.midday}>
          <MiddayScene voiceoverFiles={props.voiceoverFiles} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={sf.evening}>
          <EveningScene voiceoverFiles={props.voiceoverFiles} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={sf.outro}>
          <OutroScene voiceoverFiles={props.voiceoverFiles} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
